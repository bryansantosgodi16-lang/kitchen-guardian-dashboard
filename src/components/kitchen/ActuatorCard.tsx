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
  const isActive = actuator.active;

  // Estado: verde quando ATIVO, vermelho quando DESATIVADO
  const stateColor = isActive
    ? "text-success border-success/40 bg-success/10"
    : "text-danger border-danger/40 bg-danger/10";

  // Botão: mostra a ação inversa, mantendo o esquema verde (ativo) / vermelho (desativado)
  const btnClass = isActive
    ? "bg-danger/15 hover:bg-danger/25 text-danger border-danger/40"
    : "bg-success/15 hover:bg-success/25 text-success border-success/40";

  const stateLabel = isActive ? "ATIVO" : "DESATIVADO";
  const btnLabel = isActive ? actuator.toggleOffLabel : actuator.toggleOnLabel;

  return (
    <div className="card-tech p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "h-4 w-4 transition-colors",
              isActive ? "text-success" : "text-danger",
            )}
          />
          <h3 className="text-sm font-medium">{actuator.name}</h3>
        </div>
        <span
          className={cn(
            "text-[10px] font-semibold tracking-wider rounded-full px-2 py-0.5 border transition-colors",
            stateColor,
          )}
        >
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
