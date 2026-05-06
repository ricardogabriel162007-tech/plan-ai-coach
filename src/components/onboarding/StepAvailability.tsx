import { OnboardingData, SessionTime } from "@/types/onboarding";
import { Label } from "@/components/ui/label";
import { SelectCard } from "./SelectCard";
import { cn } from "@/lib/utils";
import { Timer, Clock, Hourglass, Zap } from "lucide-react";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  errors: Record<string, string>;
}

const sessions: { value: SessionTime; label: string; icon: typeof Timer }[] = [
  { value: "30", label: "30 min", icon: Zap },
  { value: "45", label: "45 min", icon: Timer },
  { value: "60", label: "60 min", icon: Clock },
  { value: "90", label: "90 min", icon: Hourglass },
];

export const StepAvailability = ({ data, update, errors }: Props) => {
  return (
    <div className="space-y-7">
      <div>
        <Label className="text-sm font-medium mb-3 block">Quantos dias por semana?</Label>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => update({ daysPerWeek: d })}
              className={cn(
                "aspect-square rounded-xl border-2 font-bold text-lg transition-smooth",
                data.daysPerWeek === d
                  ? "bg-gradient-gold text-primary-foreground border-primary shadow-gold scale-105"
                  : "bg-card border-border text-foreground hover:border-primary/50",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Duração de cada sessão</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sessions.map((s) => (
            <SelectCard
              key={s.value}
              icon={s.icon}
              label={s.label}
              selected={data.sessionTime === s.value}
              onClick={() => update({ sessionTime: s.value })}
              compact
            />
          ))}
        </div>
        {errors.sessionTime && <p className="text-destructive text-xs mt-2">{errors.sessionTime}</p>}
      </div>
    </div>
  );
};
