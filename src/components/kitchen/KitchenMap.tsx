import type { SensorReading } from "@/hooks/useKitchenMonitor";
import kitchenImg from "@/assets/kitchen-floorplan.jpg";
import { cn } from "@/lib/utils";
import { statusStyles } from "./StatusBadge";

interface Pin {
  id: string;
  top: string;
  left: string;
}

const pins: Pin[] = [
  { id: "heat",   top: "32%", left: "16%" },
  { id: "smoke",  top: "36%", left: "46%" },
  { id: "gas",    top: "70%", left: "14%" },
  { id: "motion", top: "66%", left: "46%" },
];

export function KitchenMap({ sensors }: { sensors: SensorReading[] }) {
  const byId = Object.fromEntries(sensors.map((s) => [s.id, s]));
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

        {pins.map((p) => {
          const s = byId[p.id];
          if (!s) return null;
          const st = statusStyles[s.status];
          return (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: p.top, left: p.left }}
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
                  <span className="text-[10px] text-muted-foreground">{s.name}</span>
                </div>
                <div className="font-mono-tech text-sm font-semibold">
                  {s.id === "gas" ? s.value.toFixed(2) : s.value.toFixed(1)}
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

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <Legend color="bg-success" label="VERDE: ESTÁVEL" sub="Tudo normal" />
        <Legend color="bg-warning" label="AMARELO: ALERTA" sub="Atenção necessária" />
        <Legend color="bg-danger"  label="VERMELHO: PERIGO" sub="Ação imediata requerida" />
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
