import type { ActuatorState } from "@/hooks/useKitchenMonitor";
import { Fan, Flame, Droplet, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const iconFor = (id: string) => {
  switch (id) {
    case "vent": return Fan;
    case "gas_valve": return Flame;
    case "water_pump": return Droplet;
    case "power": return Zap;
    default: return Zap;
  }
};

export function ActuatorCard({
  actuator,
  onToggle,
}: {
  actuator: ActuatorState;
  onToggle: (id: string) => void;
}) {
  const Icon = iconFor(actuator.id);
  // Button color logic:
  // - If active: button lets user deactivate. Red if turning off a "safe ON" system (ventilation), otherwise red for stopping.
  // - Keep the visual: green action buttons for safe activations, red for deactivation of safe systems & dangerous ones.
  const danger = actuator.dangerWhenActive && actuator.active;
  const safeActive = !actuator.dangerWhenActive && actuator.active;

  let btnClass = "bg-success/15 hover:bg-success/25 text-success border-success/30";
  if (danger) btnClass = "bg-danger/20 hover:bg-danger/30 text-danger border-danger/40";
  else if (safeActive) btnClass = "bg-success/15 hover:bg-success/25 text-success border-success/30";
  else if (!actuator.active) btnClass = "bg-success/15 hover:bg-success/25 text-success border-success/30";

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
        className={cn(
          "w-full rounded-md border px-3 py-2 text-xs font-semibold tracking-wider transition-colors",
          btnClass,
        )}
      >
        {btnLabel}
      </button>
    </div>
  );
}
