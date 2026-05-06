import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROMPT_BASE = `És um personal trainer experiente e especializado. Com base nos dados do utilizador fornecidos, cria um plano de treino semanal personalizado e detalhado. Responde APENAS com um objeto JSON válido, sem qualquer texto adicional, markdown ou formatação extra. O JSON deve seguir exatamente o schema fornecido.

Schema obrigatório:
{
  "plan_name": "string (curto e motivador, em português)",
  "weekly_structure": [
    {
      "day": "Segunda-feira" | "Terça-feira" | "Quarta-feira" | "Quinta-feira" | "Sexta-feira" | "Sábado" | "Domingo",
      "session_type": "string (ex: Peito & Tríceps, Descanso, Cardio HIIT)",
      "duration_minutes": number,
      "exercises": [
        {
          "id": "string uuid",
          "name": "string",
          "muscle_group": "string",
          "sets": number,
          "reps": "string (ex: 8-12)",
          "rest_seconds": number,
          "description": "string com instruções técnicas de execução em português",
          "image_search_term": "string em inglês"
        }
      ]
    }
  ],
  "notes": "string com recomendações gerais em português"
}

Regras:
- Inclui exatamente 7 dias na weekly_structure (do utilizador, na ordem da semana). Em dias sem treino, session_type = "Descanso" e exercises = [].
- O número de dias de treino (não-descanso) deve corresponder à frequência indicada.
- A duration_minutes em dias de treino deve ser ~ a duração indicada pelo utilizador.
- Cada exercício deve ter um id (gera um uuid v4 plausível, formato 8-4-4-4-12 hex).
- Responde apenas com o JSON.`;

async function callAI(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    if (r.status === 429) throw new Error("RATE_LIMIT");
    if (r.status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(`AI error ${r.status}: ${t}`);
  }
  const json = await r.json();
  const content = json.choices?.[0]?.message?.content as string;
  if (!content) throw new Error("Empty AI response");
  // Strip ```json if present
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned);
}

export const generateWorkoutPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (pErr || !profile) throw new Error("Perfil não encontrado");

    const { data: goalsRows } = await supabase
      .from("user_goals")
      .select("goal")
      .eq("user_id", userId);
    const goals = (goalsRows ?? []).map((g) => g.goal);

    const userPrompt = `Dados do utilizador:
- Idade: ${profile.age} anos
- Sexo: ${profile.sex}
- Peso: ${profile.weight} kg
- Altura: ${profile.height} cm
- Nível: ${profile.experience}
- Objetivos: ${goals.join(", ")}
- Disponibilidade: ${profile.days_per_week} dias por semana, ${profile.session_time} minutos por sessão

Gera o plano de treino semanal personalizado seguindo o schema.`;

    const plan = await callAI(PROMPT_BASE, userPrompt);

    // Deactivate previous plans
    await supabase.from("workout_plans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);

    const { data: inserted, error: insErr } = await supabase
      .from("workout_plans")
      .insert({ user_id: userId, plan_data: plan, is_active: true })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);
    return inserted;
  });

const replaceSchema = z.object({
  exercise: z.object({
    name: z.string(),
    muscle_group: z.string(),
    sets: z.number(),
    reps: z.string(),
    rest_seconds: z.number(),
    description: z.string().optional(),
  }),
});

export const replaceExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { exercise: { name: string; muscle_group: string; sets: number; reps: string; rest_seconds: number; description?: string } }) =>
    replaceSchema.parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("experience").eq("user_id", userId).single();
    const { data: goalsRows } = await supabase.from("user_goals").select("goal").eq("user_id", userId);
    const goals = (goalsRows ?? []).map((g) => g.goal).join(", ");

    const sys = `És um personal trainer. Sugere UM exercício alternativo para o mesmo grupo muscular, adequado ao nível e objetivos do utilizador. Responde APENAS com JSON válido seguindo este schema, sem markdown:
{
  "id": "uuid",
  "name": "string",
  "muscle_group": "string",
  "sets": number,
  "reps": "string",
  "rest_seconds": number,
  "description": "string em português",
  "image_search_term": "string em inglês"
}`;
    const user = `Substituir exercício "${data.exercise.name}" (grupo: ${data.exercise.muscle_group}). Nível: ${profile?.experience}. Objetivos: ${goals}. Mantém séries/reps/descanso semelhantes (${data.exercise.sets}x${data.exercise.reps}, ${data.exercise.rest_seconds}s) mas usa um exercício DIFERENTE para o mesmo grupo muscular.`;

    return await callAI(sys, user);
  });
