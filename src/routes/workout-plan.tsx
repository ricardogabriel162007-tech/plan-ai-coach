import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateWorkoutPlan, replaceExercise } from "@/server/workout.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Dumbbell, Pencil, RefreshCw, Clock, Repeat, Hourglass, ChevronDown, LogOut, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import logo from "@/assets/holygains-logo.png";
import { goalLabels, experienceLabels, type Goal } from "@/types/onboarding";

export const Route = createFileRoute("/workout-plan")({
  head: () => ({ meta: [{ title: "Meu Plano — Holy Gainz" }] }),
  component: WorkoutPlanPage,
});

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  description?: string;
  image_search_term?: string;
}
interface DaySession {
  day: string;
  session_type: string;
  duration_minutes: number;
  exercises: Exercise[];
}
interface PlanData {
  plan_name: string;
  weekly_structure: DaySession[];
  notes?: string;
}

const dayShort: Record<string, string> = {
  "Segunda-feira": "Seg",
  "Terça-feira": "Ter",
  "Quarta-feira": "Qua",
  "Quinta-feira": "Qui",
  "Sexta-feira": "Sex",
  "Sábado": "Sáb",
  "Domingo": "Dom",
};

function WorkoutPlanPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const generateFn = useServerFn(generateWorkoutPlan);

  const [plan, setPlan] = useState<{ id: string; plan_data: PlanData; created_at: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [confirmRegen, setConfirmRegen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: prof }, { data: g }, { data: pl }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("user_goals").select("goal").eq("user_id", user.id),
      supabase.from("workout_plans").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (prof && !prof.onboarding_completed) {
      navigate({ to: "/onboarding" });
      return;
    }
    setProfile(prof);
    setGoals((g ?? []).map((x) => x.goal as Goal));
    if (pl) setPlan(pl as any);
    setLoading(false);
  }, [user, navigate]);

  useEffect(() => {
    if (user) loadAll();
  }, [user, loadAll]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");
      await (generateFn as any)({ data: { token: session.access_token } });
      await loadAll();
      toast.success("Plano gerado!");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      if (msg.includes("RATE_LIMIT")) toast.error("Muitos pedidos. Tenta dentro de 1 minuto.");
      else if (msg.includes("PAYMENT_REQUIRED")) toast.error("Créditos esgotados. Adiciona créditos na workspace.");
      else toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const updateExercise = async (dayIdx: number, exId: string, patch: Partial<Exercise>) => {
    if (!plan) return;
    const newPlan: PlanData = JSON.parse(JSON.stringify(plan.plan_data));
    const day = newPlan.weekly_structure[dayIdx];
    day.exercises = day.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e));
    const { error } = await supabase.from("workout_plans").update({ plan_data: newPlan as any }).eq("id", plan.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPlan({ ...plan, plan_data: newPlan });
    toast.success("Exercício atualizado!");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 py-4 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Holy Gainz" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-base font-bold text-gradient-gold">Gainz</span>
          </Link>
          <div className="flex items-center gap-2">
            {plan && (
              <Button variant="outline" size="sm" onClick={() => setConfirmRegen(true)} className="border-border">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Regenerar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 sm:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {!plan ? (
            <GenerateScreen profile={profile} goals={goals} onGenerate={generate} generating={generating} />
          ) : (
            <PlanView
              plan={plan.plan_data}
              createdAt={plan.created_at}
              activeDay={activeDay}
              setActiveDay={setActiveDay}
              onUpdateExercise={updateExercise}
            />
          )}
        </div>
      </main>

      <AlertDialog open={confirmRegen} onOpenChange={setConfirmRegen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerar plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Tens a certeza? O plano atual será substituído por um novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-fire text-primary-foreground"
              onClick={async () => {
                setConfirmRegen(false);
                setPlan(null);
                await generate();
              }}
            >
              Sim, regenerar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GenerateScreen({ profile, goals, onGenerate, generating }: any) {
  if (generating) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-fire flex items-center justify-center shadow-glow mb-6 animate-pulse">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">A criar o teu plano personalizado...</h2>
        <p className="text-muted-foreground max-w-md">A nossa IA está a desenhar treinos à tua medida. Demora cerca de 20 segundos.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Pronto para começar?</h1>
        <p className="text-muted-foreground">Vamos gerar o teu plano com base nestes dados:</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Idade" value={`${profile?.age}`} unit="anos" />
        <SummaryCard label="Peso" value={`${profile?.weight}`} unit="kg" />
        <SummaryCard label="Altura" value={`${profile?.height}`} unit="cm" />
        <SummaryCard label="Frequência" value={`${profile?.days_per_week}x`} unit="/sem" />
      </div>

      <div className="rounded-xl bg-card border border-border p-5 mb-8">
        <div className="text-xs uppercase tracking-widest text-primary font-bold mb-3">Objetivos</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {goals.map((g: Goal) => (
            <span key={g} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary">
              {goalLabels[g]}
            </span>
          ))}
        </div>
        <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Nível</div>
        <div className="text-sm">{profile?.experience ? experienceLabels[profile.experience as keyof typeof experienceLabels] : "-"}</div>
      </div>

      <div className="flex justify-center">
        <Button onClick={onGenerate} className="h-13 px-8 bg-gradient-fire text-primary-foreground hover:opacity-90 shadow-gold font-semibold text-base">
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar o Meu Plano de Treino
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-bold">
        {value} <span className="text-xs text-muted-foreground font-normal">{unit}</span>
      </div>
    </div>
  );
}

function PlanView({
  plan,
  createdAt,
  activeDay,
  setActiveDay,
  onUpdateExercise,
}: {
  plan: PlanData;
  createdAt: string;
  activeDay: number;
  setActiveDay: (i: number) => void;
  onUpdateExercise: (dayIdx: number, exId: string, patch: Partial<Exercise>) => Promise<void>;
}) {
  const day = plan.weekly_structure[activeDay];
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{plan.plan_name}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Criado em {new Date(createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {plan.weekly_structure.map((d, i) => {
          const isRest = d.session_type.toLowerCase().includes("descanso") || d.exercises.length === 0;
          return (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={cn(
                "shrink-0 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-smooth min-w-[60px]",
                i === activeDay
                  ? "bg-gradient-gold text-primary-foreground border-primary shadow-gold"
                  : isRest
                    ? "bg-card border-border text-muted-foreground"
                    : "bg-card border-border hover:border-primary/50",
              )}
            >
              {dayShort[d.day] ?? d.day.slice(0, 3)}
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold">{day.session_type}</h2>
            <p className="text-xs text-muted-foreground">{day.day}</p>
          </div>
          {day.duration_minutes > 0 && (
            <span className="text-xs px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-medium">
              {day.duration_minutes} min
            </span>
          )}
        </div>
      </div>

      {day.exercises.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Hourglass className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold mb-1">Dia de descanso</h3>
          <p className="text-sm text-muted-foreground">Recupera bem para o próximo treino.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {day.exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              ex={ex}
              onSave={(patch) => onUpdateExercise(activeDay, ex.id, patch)}
            />
          ))}
        </div>
      )}

      {plan.notes && (
        <div className="mt-8 rounded-xl bg-card border border-border p-5">
          <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Notas</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{plan.notes}</p>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ ex, onSave }: { ex: Exercise; onSave: (patch: Partial<Exercise>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Exercise>(ex);
  const [replacing, setReplacing] = useState(false);
  const replaceFn = useServerFn(replaceExercise);

  const startEdit = () => {
    setDraft(ex);
    setEditOpen(true);
  };

  const doReplace = async () => {
    setReplacing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");
      const newEx: any = await (replaceFn as any)({ data: { token: session.access_token, exercise: ex } });
      setDraft({ ...newEx, id: ex.id });
      toast.success("Sugestão pronta. Confirma e guarda.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      if (msg.includes("RATE_LIMIT")) toast.error("Muitos pedidos. Espera 1 min.");
      else if (msg.includes("PAYMENT_REQUIRED")) toast.error("Créditos esgotados.");
      else toast.error(msg);
    } finally {
      setReplacing(false);
    }
  };

  const save = async () => {
    await onSave({
      name: draft.name,
      muscle_group: draft.muscle_group,
      sets: draft.sets,
      reps: draft.reps,
      rest_seconds: draft.rest_seconds,
      description: draft.description,
      image_search_term: draft.image_search_term,
    });
    setEditOpen(false);
  };

  return (
    <div className="rounded-xl bg-card border border-border hover:border-primary/40 transition-smooth overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight">{ex.name}</h3>
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-[10px] font-bold uppercase tracking-wider text-primary">
              {ex.muscle_group}
            </span>
          </div>
          <button
            onClick={startEdit}
            className="w-8 h-8 rounded-lg border border-border hover:border-primary hover:text-primary flex items-center justify-center transition-smooth shrink-0"
            aria-label="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-4 text-sm">
          <Metric icon={Repeat} label="Séries" value={ex.sets.toString()} />
          <Metric icon={Dumbbell} label="Reps" value={ex.reps} />
          <Metric icon={Clock} label="Descanso" value={`${ex.rest_seconds}s`} />
        </div>

        {ex.description && (
          <button
            onClick={() => setOpen(!open)}
            className="mt-4 flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
            {open ? "Ocultar instruções" : "Ver instruções"}
          </button>
        )}
        {open && ex.description && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
            {ex.description}
          </p>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{draft.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="bg-input border-border mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Séries</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.sets}
                  onChange={(e) => setDraft({ ...draft, sets: parseInt(e.target.value) || 0 })}
                  className="bg-input border-primary/40 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Reps</Label>
                <Input
                  value={draft.reps}
                  onChange={(e) => setDraft({ ...draft, reps: e.target.value })}
                  className="bg-input border-primary/40 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Descanso (s)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.rest_seconds}
                  onChange={(e) => setDraft({ ...draft, rest_seconds: parseInt(e.target.value) || 0 })}
                  className="bg-input border-primary/40 mt-1"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={doReplace}
                disabled={replacing}
                className="w-full border-primary/40 text-primary hover:bg-primary/10"
              >
                {replacing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Substituir por outro exercício
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} className="bg-gradient-gold text-primary-foreground font-semibold">
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-bold text-foreground">{value}</span>
    </div>
  );
}
