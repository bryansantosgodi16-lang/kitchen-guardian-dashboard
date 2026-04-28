import type { Actuator } from "@/services/api";
import { Fan, Flame, Droplet, Zap, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

const iconFor = (id: string, name: string) => {
  const k = `${id} ${name}`.toLowerCase();
  if (k.includes("vent")) return Fan;
  if (k.includes("gas") || k.includes("gás")) return Flame;
  if (k.includes("water") || k.includes("pump") || k.includes("bomba") || k.includes("água")) return Droplet;
  if (k.includes("calor") || k.includes("heat") || k.includes("temp")) return Thermometer;
  if (k.includes("power") || k.includes("energia") || k.includes("tomada")) return Zap;
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
  const Icon = iconFor(actuator.id, actuator.name);

  // Padrão visual unificado:
  //  - Ativo  => verde
  //  - Inativo => vermelho
  const isActive = actuator.active;

  const stateClass = isActive
    ? "text-success border-success/40 bg-success/10"
    : "text-danger border-danger/40 bg-danger/10";

  const btnClass = isActive
    ? "bg-success/15 hover:bg-success/25 text-success border-success/40"
    : "bg-danger/15 hover:bg-danger/25 text-danger border-danger/40";

  const iconClass = isActive ? "text-success" : "text-danger";

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
            stateClass,
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
