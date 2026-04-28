import type { EventLogEntry } from "@/services/api";
import { cn } from "@/lib/utils";

const levelColor: Record<string, string> = {
  stable: "text-success border-success/30",
  warning: "text-warning border-warning/30",
  danger: "text-danger border-danger/40",
};

const typeLabel: Record<EventLogEntry["type"], string> = {
  SENSOR: "SENSOR",
  ATUADOR: "ATUADOR",
  SISTEMA: "SISTEMA",
  EMERGENCIA: "EMERGÊNCIA",
  BOMBEIROS: "BOMBEIROS",
};

const fmt = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour12: false });

export function EventLog({ events }: { events: EventLogEntry[] }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
          REGISTRO DE EVENTOS
        </h2>
        <span className="text-[10px] text-muted-foreground font-mono-tech">
          {events.length} entradas
        </span>
      </div>
      {events.length === 0 ? (
        <div className="rounded-md border border-border bg-muted/20 px-3 py-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs"
            >
              <span className="font-mono-tech text-[10px] text-muted-foreground shrink-0 pt-0.5">
                {fmt(e.timestamp)}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold tracking-wider",
                  levelColor[e.level],
                )}
              >
                {typeLabel[e.type]}
              </span>
              <span className="text-foreground/90 leading-snug">{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
