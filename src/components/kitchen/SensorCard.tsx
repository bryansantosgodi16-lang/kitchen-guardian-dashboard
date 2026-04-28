import { Flame, Wind, Droplets, User } from "lucide-react";
import type { SensorReading } from "@/hooks/useKitchenMonitor";
import { StatusBadge } from "./StatusBadge";
import { Sparkline } from "./Sparkline";

const iconFor = (id: string) => {
  switch (id) {
    case "heat": return Flame;
    case "smoke": return Wind;
    case "gas": return Droplets;
    case "motion": return User;
    default: return Flame;
  }
};

export function SensorCard({ sensor }: { sensor: SensorReading }) {
  const Icon = iconFor(sensor.id);
  return (
    <div className="card-tech p-4 flex flex-col gap-3 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{sensor.name}</h3>
        </div>
        <StatusBadge status={sensor.status} pulse={sensor.status !== "stable"} />
      </div>

      <div className="flex items-baseline gap-1 font-mono-tech">
        <span className="text-3xl font-semibold text-foreground">
          {sensor.id === "gas" ? sensor.value.toFixed(2) : sensor.value.toFixed(1)}
        </span>
        {sensor.unit && (
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{sensor.unit}</span>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">{sensor.description}</p>
        <p className="text-xs text-muted-foreground">Zona: {sensor.zone}</p>
      </div>

      <div className="-mx-1">
        <Sparkline data={sensor.history} status={sensor.status} />
      </div>
    </div>
  );
}
