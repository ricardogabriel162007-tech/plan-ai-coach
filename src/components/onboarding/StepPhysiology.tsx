import { OnboardingData, Sex } from "@/types/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SelectCard } from "./SelectCard";
import { User, UserRound } from "lucide-react";

interface Props {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  errors: Record<string, string>;
}

export const StepPhysiology = ({ data, update, errors }: Props) => {
  return (
    <div className="space-y-7">
      <div>
        <Label className="text-sm font-medium mb-2 block">Idade</Label>
        <Input
          type="number"
          min={10}
          max={100}
          value={data.age || ""}
          onChange={(e) => update({ age: parseInt(e.target.value) || 0 })}
          className="h-12 text-lg bg-input border-border focus-visible:ring-primary"
        />
        {errors.age && <p className="text-destructive text-xs mt-1">{errors.age}</p>}
      </div>

      <div>
        <div className="flex justify-between items-baseline mb-3">
          <Label className="text-sm font-medium">Peso atual</Label>
          <span className="text-2xl font-bold text-gradient-gold tabular-nums">
            {data.weight} <span className="text-sm text-muted-foreground font-normal">kg</span>
          </span>
        </div>
        <Slider min={30} max={200} step={1} value={[data.weight]} onValueChange={([v]) => update({ weight: v })} />
      </div>

      <div>
        <div className="flex justify-between items-baseline mb-3">
          <Label className="text-sm font-medium">Altura</Label>
          <span className="text-2xl font-bold text-gradient-gold tabular-nums">
            {data.height} <span className="text-sm text-muted-foreground font-normal">cm</span>
          </span>
        </div>
        <Slider min={120} max={230} step={1} value={[data.height]} onValueChange={([v]) => update({ height: v })} />
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Sexo</Label>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "masculino", label: "Masculino", icon: User },
              { value: "feminino", label: "Feminino", icon: UserRound },
            ] as { value: Sex; label: string; icon: typeof User }[]
          ).map((opt) => (
            <SelectCard
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={data.sex === opt.value}
              onClick={() => update({ sex: opt.value })}
              compact
            />
          ))}
        </div>
        {errors.sex && <p className="text-destructive text-xs mt-2">{errors.sex}</p>}
      </div>
    </div>
  );
};
