import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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
          "description": "string em português",
          "image_search_term": "string em inglês"
        }
      ]
    }
  ],
  "notes": "string em português"
}

Regras:
- Inclui exatamente 7 dias na weekly_structure (Segunda a Domingo).
- Em dias sem treino: session_type = "Descanso" e exercises = [].
- O número de dias com treino deve corresponder à frequência do utilizador.
- A duration_minutes em dias de treino deve aproximar a duração indicada.
- Cada exercício precisa de um id (uuid v4 plausível).
- Responde apenas com o JSON.`;

async function getUserFromToken(token: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const c = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await c.auth.getUser(token);
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return { userId: data.user.id, supabase: createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  }) };
}

async function callAI(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
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
  const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned);
}

export const generateWorkoutPlan = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => {
    if (!d?.token || typeof d.token !== "string") throw new Error("Missing token");
    return d;
  })
  .handler(async ({ data }) => {
    const { userId, supabase } = await getUserFromToken(data.token);

    const { data: profile, error: pErr } = await supabase
      .from("profiles").select("*").eq("user_id", userId).single();
    if (pErr || !profile) throw new Error("Perfil não encontrado");

    const { data: goalsRows } = await supabase
      .from("user_goals").select("goal").eq("user_id", userId);
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

    await supabase.from("workout_plans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
    const { data: inserted, error: insErr } = await supabase
      .from("workout_plans")
      .insert({ user_id: userId, plan_data: plan, is_active: true })
      .select().single();
    if (insErr) throw new Error(insErr.message);
    return inserted;
  });

export const replaceExercise = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    exercise: { name: string; muscle_group: string; sets: number; reps: string; rest_seconds: number; description?: string };
  }) => {
    if (!d?.token) throw new Error("Missing token");
    if (!d?.exercise?.name) throw new Error("Missing exercise");
    return d;
  })
  .handler(async ({ data }) => {
    const { userId, supabase } = await getUserFromToken(data.token);
    const { data: profile } = await supabase.from("profiles").select("experience").eq("user_id", userId).single();
    const { data: goalsRows } = await supabase.from("user_goals").select("goal").eq("user_id", userId);
    const goals = (goalsRows ?? []).map((g) => g.goal).join(", ");

    const sys = `És um personal trainer. Sugere UM exercício alternativo para o mesmo grupo muscular, adequado ao nível e objetivos do utilizador. Responde APENAS com JSON válido, sem markdown:
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
