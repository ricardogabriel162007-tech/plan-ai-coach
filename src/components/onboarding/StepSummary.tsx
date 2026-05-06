import { OnboardingData, sexLabels, goalLabels, experienceLabels } from "@/types/onboarding";
import { Sparkles } from "lucide-react";

const Row = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-foreground text-right">{value}</span>
  </div>
);

export const StepSummary = ({ data }: { data: OnboardingData }) => (
  <div className="space-y-5">
    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/30">
      <Sparkles className="w-5 h-5 text-primary shrink-0" />
      <p className="text-sm text-foreground/90">
        Tudo pronto. Vamos guardar e gerar o teu plano.
      </p>
    </div>

    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Perfil</h3>
      <Row label="Idade" value={`${data.age} anos`} />
      <Row label="Peso" value={`${data.weight} kg`} />
      <Row label="Altura" value={`${data.height} cm`} />
      <Row label="Sexo" value={data.sex ? sexLabels[data.sex] : "-"} />
    </div>

    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Treino</h3>
      <Row label="Objetivos" value={data.goals.map((g) => goalLabels[g]).join(", ") || "-"} />
      <Row label="Nível" value={data.experience ? experienceLabels[data.experience] : "-"} />
      <Row label="Frequência" value={`${data.daysPerWeek}x / semana`} />
      <Row label="Duração" value={data.sessionTime ? `${data.sessionTime} min` : "-"} />
    </div>
  </div>
);
