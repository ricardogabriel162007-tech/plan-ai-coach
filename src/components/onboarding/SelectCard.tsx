import { cn } from "@/lib/utils";
import { LucideIcon, Check } from "lucide-react";

interface SelectCardProps {
  icon?: LucideIcon;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
  showCheck?: boolean;
}

export const SelectCard = ({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
  compact,
  showCheck,
}: SelectCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full text-left rounded-xl border-2 transition-smooth overflow-hidden",
        compact ? "p-3" : "p-4",
        selected
          ? "border-primary bg-primary/5 shadow-gold"
          : "border-border bg-card hover:border-primary/50",
      )}
    >
      {selected && (
        <div className="absolute inset-0 bg-gradient-fire opacity-[0.07] pointer-events-none" />
      )}
      <div className="relative flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-smooth",
              selected
                ? "bg-gradient-gold text-primary-foreground"
                : "bg-secondary text-muted-foreground group-hover:text-primary",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground text-sm">{label}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
          )}
        </div>
        {showCheck && selected && (
          <Check className="w-4 h-4 text-primary shrink-0" />
        )}
      </div>
    </button>
  );
};
