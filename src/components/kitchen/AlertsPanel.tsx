import type { AlertMessage } from "@/hooks/useKitchenMonitor";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function AlertsPanel({ alerts }: { alerts: AlertMessage[] }) {
  return (
    <div className="panel p-4">
      <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground mb-3">
        ALERTAS ATIVOS
      </h2>
      {alerts.length === 0 ? (
        <div className="rounded-md border border-success/20 bg-success/5 px-3 py-6 text-center">
          <p className="text-sm text-success font-medium">Nenhum alerta ativo</p>
          <p className="text-xs text-muted-foreground mt-1">Todos os sensores operando em níveis normais</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const Icon = a.level === "danger" ? ShieldAlert : AlertTriangle;
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-start gap-3 rounded-md border px-3 py-2.5",
                  a.level === "danger"
                    ? "border-danger/40 bg-danger/10"
                    : "border-warning/40 bg-warning/10",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0 animate-blink",
                    a.level === "danger" ? "text-danger" : "text-warning",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", a.level === "danger" ? "text-danger" : "text-warning")}>
                    {a.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-0.5">
                    Prioridade: {a.level === "danger" ? "CRÍTICA" : "MÉDIA"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
