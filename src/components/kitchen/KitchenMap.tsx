import type { Sensor } from "@/services/api";
import kitchenImg from "@/assets/kitchen-floorplan.jpg";
import { cn } from "@/lib/utils";
import { statusStyles } from "./StatusBadge";

const PIN_POSITIONS: Record<string, { top: string; left: string }> = {
  heat: { top: "32%", left: "16%" },
  smoke: { top: "36%", left: "46%" },
  gas: { top: "70%", left: "14%" },
  motion: { top: "66%", left: "46%" },
};

const SENSOR_DOT: Record<string, string> = {
  heat: "bg-sensor-heat",
  smoke: "bg-sensor-smoke",
  gas: "bg-sensor-gas",
  motion: "bg-sensor-motion",
};

export function KitchenMap({ sensors }: { sensors: Sensor[] }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
          COZINHA INDUSTRIAL — PLANTA BAIXA
        </h2>
      </div>
      <div className="relative rounded-lg overflow-hidden border border-border aspect-[16/10] bg-black">
        <img
          src={kitchenImg}
          alt="Planta baixa da cozinha industrial"
          width={1280}
          height={832}
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/40 pointer-events-none" />

        {sensors.map((s) => {
          const pos = PIN_POSITIONS[s.type];
          if (!pos) return null;
          const st = statusStyles[s.status];
          return (
            <div
              key={s.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: pos.top, left: pos.left }}
            >
              <div
                className={cn(
                  "rounded-md border px-2.5 py-1.5 backdrop-blur-md text-xs min-w-[120px]",
                  "bg-background/80",
                  st.border,
                  s.status === "warning" && "shadow-[0_0_20px_-4px_hsl(var(--warning)/0.6)]",
                  s.status === "danger" && "shadow-[0_0_20px_-4px_hsl(var(--danger)/0.7)]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className={cn("h-1.5 w-1.5 rounded-full", SENSOR_DOT[s.type])} />
                    {s.name}
                  </span>
                </div>
                <div className="font-mono-tech text-sm font-semibold">
                  {s.type === "gas" ? s.value.toFixed(2) : s.value.toFixed(1)}
                  <span className="text-[9px] text-muted-foreground ml-1">{s.unit}</span>
                </div>
                <div className={cn("mt-0.5 flex items-center gap-1 text-[9px] font-semibold tracking-wider", st.text)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", st.dot, s.status !== "stable" && "animate-blink")} />
                  {st.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <SensorLegend color="bg-sensor-heat" label="CALOR" />
        <SensorLegend color="bg-sensor-smoke" label="FUMAÇA" />
        <SensorLegend color="bg-sensor-gas" label="GÁS (GLP)" />
        <SensorLegend color="bg-sensor-motion" label="MOVIMENTO" />
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <Legend color="bg-success" label="ESTÁVEL" sub="Tudo normal" />
        <Legend color="bg-warning" label="ALERTA" sub="Atenção necessária" />
        <Legend color="bg-danger"  label="PERIGO" sub="Ação imediata" />
      </div>
    </div>
  );
}

function Legend({ color, label, sub }: { color: string; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/30 border border-border px-3 py-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <div>
        <div className="font-semibold tracking-wider text-[11px]">{label}</div>
        <div className="text-muted-foreground text-[10px]">{sub}</div>
      </div>
    </div>
  );
}

function SensorLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/20 border border-border px-2.5 py-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-[10px] font-semibold tracking-wider">{label}</span>
    </div>
  );
}
