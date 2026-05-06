import { OnboardingData, Goal, Experience } from "@/types/onboarding";
import { Label } from "@/components/ui/label";
import { SelectCard } from "./SelectCard";
import { Dumbbell, Flame, Heart, StretchHorizontal, Sprout, Mountain, Trophy, Zap, PersonStanding, Activity } from "lucide-react";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  errors: Record<string, string>;
}

const goals: { value: Goal; label: string; icon: typeof Dumbbell }[] = [
  { value: "massa", label: "Ganho de Massa", icon: Dumbbell },
  { value: "gordura", label: "Perda de Peso", icon: Flame },
  { value: "forca", label: "Força", icon: Zap },
  { value: "resistencia", label: "Resistência", icon: Heart },
  { value: "flexibilidade", label: "Flexibilidade", icon: StretchHorizontal },
  { value: "calistenia", label: "Calistenia", icon: PersonStanding },
  { value: "crossfit", label: "CrossFit", icon: Activity },
];

const levels: { value: Experience; label: string; description: string; icon: typeof Sprout }[] = [
  { value: "iniciante", label: "Iniciante", description: "< 6 meses", icon: Sprout },
  { value: "intermediario", label: "Intermédio", description: "6m - 2a", icon: Mountain },
  { value: "avancado", label: "Avançado", description: "> 2 anos", icon: Trophy },
];

export const StepGoals = ({ data, update, errors }: Props) => {
  const toggleGoal = (g: Goal) => {
    const has = data.goals.includes(g);
    update({ goals: has ? data.goals.filter((x) => x !== g) : [...data.goals, g] });
  };
  return (
    <div className="space-y-7">
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Quais os teus objetivos? <span className="text-muted-foreground">(podes escolher vários)</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((g) => (
            <SelectCard
              key={g.value}
              icon={g.icon}
              label={g.label}
              selected={data.goals.includes(g.value)}
              onClick={() => toggleGoal(g.value)}
              compact
              showCheck
            />
          ))}
        </div>
        {errors.goals && <p className="text-destructive text-xs mt-2">{errors.goals}</p>}
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Nível de experiência</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {levels.map((l) => (
            <SelectCard
              key={l.value}
              icon={l.icon}
              label={l.label}
              description={l.description}
              selected={data.experience === l.value}
              onClick={() => update({ experience: l.value })}
              compact
            />
          ))}
        </div>
        {errors.experience && <p className="text-destructive text-xs mt-2">{errors.experience}</p>}
      </div>
    </div>
  );
};
