import type { Actuator } from "@/services/api";
import { Fan, Flame, Droplet, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const iconFor = (id: string) => {
  if (id.includes("vent")) return Fan;
  if (id.includes("gas")) return Flame;
  if (id.includes("water") || id.includes("pump") || id.includes("bomba")) return Droplet;
  if (id.includes("power") || id.includes("energia") || id.includes("tomada")) return Zap;
  return Zap;
};

export function ActuatorCard({
  actuator,
  onToggle,
  disabled,
}: {
  actuator: Actuator;
  onToggle: (id: string) => void;
  disabled?: boolean;
}) {
  const Icon = iconFor(actuator.id);
  const isActive = actuator.active;

  // Padrão visual unificado: ATIVO = verde, DESATIVADO = cinza
  const stateBadgeClass = isActive
    ? "text-success border-success/30 bg-success/10"
    : "text-muted-foreground border-border bg-muted/40";

  const iconClass = isActive ? "text-success" : "text-muted-foreground";

  const btnClass = isActive
    ? "bg-success/15 hover:bg-success/25 text-success border-success/30"
    : "bg-muted/40 hover:bg-muted/60 text-muted-foreground border-border";

  const stateLabel = isActive ? actuator.activeLabel : actuator.inactiveLabel;
  const btnLabel = isActive ? actuator.toggleOffLabel : actuator.toggleOnLabel;

  return (
    <div className="card-tech p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4 transition-colors", iconClass)} />
          <h3 className="text-sm font-medium">{actuator.name}</h3>
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold tracking-wider rounded-full px-2 py-0.5 border transition-colors",
            stateBadgeClass,
          )}
        >
          {stateLabel}
        </span>
      </div>
      <button
        onClick={() => onToggle(actuator.id)}
        disabled={disabled}
        className={cn(
          "w-full rounded-md border px-3 py-2 text-xs font-semibold tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          btnClass,
        )}
      >
        {btnLabel}
      </button>
    </div>
  );
}
