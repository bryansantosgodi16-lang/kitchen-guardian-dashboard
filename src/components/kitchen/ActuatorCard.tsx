import type { Actuator } from "@/services/api";
import { Fan, Flame, Droplet, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const iconFor = (id: string) => {
  if (id.includes("vent")) return Fan;
  if (id.includes("gas")) return Flame;
  if (id.includes("water") || id.includes("pump") || id.includes("bomba")) return Droplet;
  if (id.includes("power") || id.includes("energia")) return Zap;
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
  const danger = actuator.dangerWhenActive && actuator.active;

  let btnClass = "bg-success/15 hover:bg-success/25 text-success border-success/30";
  if (danger) btnClass = "bg-danger/20 hover:bg-danger/30 text-danger border-danger/40";

  const stateLabel = actuator.active ? actuator.activeLabel : actuator.inactiveLabel;
  const stateColor = actuator.active
    ? actuator.dangerWhenActive
      ? "text-danger border-danger/30 bg-danger/10"
      : "text-success border-success/30 bg-success/10"
    : "text-muted-foreground border-border bg-muted/40";

  const btnLabel = actuator.active ? actuator.toggleOffLabel : actuator.toggleOnLabel;

  return (
    <div className="card-tech p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", actuator.active && !actuator.dangerWhenActive ? "text-success" : actuator.active ? "text-danger" : "text-muted-foreground")} />
          <h3 className="text-sm font-medium">{actuator.name}</h3>
        </div>
        <span className={cn("text-[10px] font-semibold tracking-wider rounded-full px-2 py-0.5 border", stateColor)}>
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
