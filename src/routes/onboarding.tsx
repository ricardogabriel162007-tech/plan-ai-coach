import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/holygains-logo.png";
import { OnboardingData, initialData } from "@/types/onboarding";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { StepPhysiology } from "@/components/onboarding/StepPhysiology";
import { StepGoals } from "@/components/onboarding/StepGoals";
import { StepAvailability } from "@/components/onboarding/StepAvailability";
import { StepSummary } from "@/components/onboarding/StepSummary";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — Holy Gainz" }] }),
  component: OnboardingPage,
});

const steps = [
  { title: "O teu perfil", subtitle: "Conta-nos sobre ti", label: "Perfil" },
  { title: "Objetivos", subtitle: "O que queres conquistar?", label: "Objetivos" },
  { title: "Disponibilidade", subtitle: "Quanto tempo tens?", label: "Tempo" },
  { title: "Tudo pronto", subtitle: "Revê e gera o teu plano", label: "Resumo" },
];

function OnboardingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const update = (patch: Partial<OnboardingData>) => {
    setData((d) => ({ ...d, ...patch }));
    setErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!data.age || data.age < 10 || data.age > 100) e.age = "Idade entre 10 e 100";
      if (!data.sex) e.sex = "Seleciona uma opção";
    }
    if (step === 2) {
      if (data.goals.length === 0) e.goals = "Escolhe pelo menos um";
      if (!data.experience) e.experience = "Seleciona o teu nível";
    }
    if (step === 3) {
      if (!data.sessionTime) e.sessionTime = "Escolhe uma duração";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate() && setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error: pErr } = await supabase.from("profiles").update({
        age: data.age,
        weight: data.weight,
        height: data.height,
        sex: data.sex,
        experience: data.experience,
        days_per_week: data.daysPerWeek,
        session_time: parseInt(data.sessionTime!),
        onboarding_completed: true,
      }).eq("user_id", user.id);
      if (pErr) throw pErr;

      // Replace goals
      await supabase.from("user_goals").delete().eq("user_id", user.id);
      if (data.goals.length) {
        const { error: gErr } = await supabase
          .from("user_goals")
          .insert(data.goals.map((g) => ({ user_id: user.id, goal: g })));
        if (gErr) throw gErr;
      }

      toast.success("Perfil guardado!");
      navigate({ to: "/workout-plan" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSubmitting(false);
    }
  };

  const current = steps[step - 1];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-5 sm:px-8 pt-6 pb-4 border-b border-border/40">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <img src={logo} alt="Holy Gainz" className="w-9 h-9 rounded-lg object-contain" />
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">Holy</div>
            <div className="text-base font-bold text-gradient-gold -mt-0.5">Gainz</div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 sm:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <ProgressBar currentStep={step} totalSteps={4} labels={steps.map((s) => s.label)} />
          <div className="mt-8 mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{current.title}</h1>
            <p className="text-muted-foreground mt-2">{current.subtitle}</p>
          </div>
          <div className="mt-8 rounded-2xl bg-card/50 backdrop-blur border border-border p-5 sm:p-7 shadow-card">
            {step === 1 && <StepPhysiology data={data} update={update} errors={errors} />}
            {step === 2 && <StepGoals data={data} update={update} errors={errors} />}
            {step === 3 && <StepAvailability data={data} update={update} errors={errors} />}
            {step === 4 && <StepSummary data={data} />}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} disabled={step === 1} className="h-12">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {step < 4 ? (
              <Button onClick={next} className="h-12 px-8 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold font-semibold">
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting} className="h-12 px-6 sm:px-8 bg-gradient-fire text-primary-foreground hover:opacity-90 shadow-gold font-semibold">
                <Sparkles className="w-4 h-4 mr-2" />
                {submitting ? "A guardar..." : "Guardar e continuar"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
