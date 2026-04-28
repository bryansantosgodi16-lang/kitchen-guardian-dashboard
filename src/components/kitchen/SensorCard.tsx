import { Flame, Wind, Droplets, User } from "lucide-react";
import type { Sensor, SensorType } from "@/services/api";
import { StatusBadge } from "./StatusBadge";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";

const ICONS: Record<SensorType, React.ComponentType<{ className?: string }>> = {
  heat: Flame,
  smoke: Wind,
  gas: Droplets,
  motion: User,
};

const SENSOR_COLOR: Record<SensorType, string> = {
  heat: "text-sensor-heat",
  smoke: "text-sensor-smoke",
  gas: "text-sensor-gas",
  motion: "text-sensor-motion",
};

const SENSOR_BG: Record<SensorType, string> = {
  heat: "bg-sensor-heat/10 border-sensor-heat/30",
  smoke: "bg-sensor-smoke/10 border-sensor-smoke/30",
  gas: "bg-sensor-gas/10 border-sensor-gas/30",
  motion: "bg-sensor-motion/10 border-sensor-motion/30",
};

export function SensorCard({ sensor }: { sensor: Sensor }) {
  const Icon = ICONS[sensor.type] ?? Flame;
  return (
    <div className="card-tech p-4 flex flex-col gap-3 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-7 w-7 rounded-md border flex items-center justify-center", SENSOR_BG[sensor.type])}>
            <Icon className={cn("h-4 w-4", SENSOR_COLOR[sensor.type])} />
          </span>
          <h3 className="text-sm font-medium">{sensor.name}</h3>
        </div>
        <StatusBadge status={sensor.status} pulse={sensor.status !== "stable"} />
      </div>

      <div className="flex items-baseline gap-1 font-mono-tech">
        <span className="text-3xl font-semibold text-foreground">
          {sensor.type === "gas" ? sensor.value.toFixed(2) : sensor.value.toFixed(1)}
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
        <Sparkline data={sensor.history ?? []} status={sensor.status} type={sensor.type} />
      </div>
    </div>
  );
}
