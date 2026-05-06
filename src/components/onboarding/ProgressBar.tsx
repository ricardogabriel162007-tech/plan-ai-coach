import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export const ProgressBar = ({ currentStep, totalSteps, labels }: Props) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Passo {currentStep} de {totalSteps}
        </span>
        <span className="text-xs font-semibold text-primary">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>
      <div className="relative h-1.5 bg-secondary rounded-full overflow-hidden mb-6">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-fire rounded-full transition-smooth shadow-glow"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <div className="hidden sm:flex justify-between gap-2">
        {labels.map((label, idx) => {
          const step = idx + 1;
          const completed = step < currentStep;
          const active = step === currentStep;
          return (
            <div key={label} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-smooth border",
                  completed && "bg-gradient-gold text-primary-foreground border-primary shadow-gold",
                  active && "bg-background text-primary border-primary shadow-glow",
                  !completed && !active && "bg-secondary text-muted-foreground border-border",
                )}
              >
                {completed ? <Check className="w-4 h-4" /> : step}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-smooth text-center",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
