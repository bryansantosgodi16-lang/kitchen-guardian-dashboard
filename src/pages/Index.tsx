import { Flame, ShieldAlert, ShieldCheck, Clock, Siren, RefreshCw, Loader2, WifiOff, Truck } from "lucide-react";
import { useKitchenMonitor } from "@/hooks/useKitchenMonitor";
import { SensorCard } from "@/components/kitchen/SensorCard";
import { ActuatorCard } from "@/components/kitchen/ActuatorCard";
import { KitchenMap } from "@/components/kitchen/KitchenMap";
import { AlertsPanel } from "@/components/kitchen/AlertsPanel";
import { EventLog } from "@/components/kitchen/EventLog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const APP_NAME = "Sistema de Segurança para Cozinha Industrial";

const Index = () => {
  const m = useKitchenMonitor();

  const statusStyle = {
    NORMAL: { text: "text-success", border: "border-success/40", bg: "bg-success/10", icon: ShieldCheck, sub: "Todos os sistemas operacionais" },
    ALERTA: { text: "text-warning", border: "border-warning/40", bg: "bg-warning/10", icon: ShieldAlert, sub: "Atenção necessária" },
    PERIGO: { text: "text-danger",  border: "border-danger/40",  bg: "bg-danger/10",  icon: ShieldAlert, sub: "Ação imediata requerida" },
  }[m.systemStatus];
  const StatusIcon = statusStyle.icon;

  const onEmergency = () => {
    m.triggerEmergency();
    toast.error("Botoeira de Emergência acionada", {
      description: "Comando enviado ao sistema: gás fechado, energia desligada, ventilação e bomba ativadas.",
    });
  };

  // Não conectado
  if (!m.apiConfigured) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="card-tech max-w-lg w-full p-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-lg bg-warning/15 border border-warning/30 flex items-center justify-center">
            <WifiOff className="h-6 w-6 text-warning" />
          </div>
          <h1 className="text-xl font-semibold">{APP_NAME}</h1>
          <p className="text-sm text-muted-foreground">
            A integração com a API ainda não foi configurada.
          </p>
          <div className="text-left text-xs font-mono-tech bg-muted/40 border border-border rounded-md p-3 text-muted-foreground">
            Defina a variável de ambiente:<br />
            <span className="text-foreground">VITE_API_BASE_URL=https://sua-api.exemplo.com</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Endpoints esperados: <span className="font-mono-tech">/sensors</span>, <span className="font-mono-tech">/actuators</span>, <span className="font-mono-tech">/alerts</span>, <span className="font-mono-tech">/events</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 space-y-6">
        {/* Banner de bombeiros acionados */}
        {m.firefighters && (
          <div
            role="alert"
            className="rounded-xl border-2 border-danger/60 bg-danger/15 px-5 py-4 flex items-start gap-4 glow-danger"
          >
            <Truck className="h-7 w-7 text-danger shrink-0 animate-blink" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-wider text-danger">
                  CORPO DE BOMBEIROS ACIONADO AUTOMATICAMENTE
                </h2>
                <span className={cn(
                  "text-[10px] font-semibold tracking-wider rounded-full px-2 py-0.5 border",
                  m.firefighters.status === "success" && "border-success/40 bg-success/10 text-success",
                  m.firefighters.status === "pending" && "border-warning/40 bg-warning/10 text-warning",
                  m.firefighters.status === "error" && "border-danger/40 bg-danger/10 text-danger",
                )}>
                  {m.firefighters.status === "success" && "CONFIRMADO"}
                  {m.firefighters.status === "pending" && "ENVIANDO..."}
                  {m.firefighters.status === "error" && "FALHA NO ENVIO"}
                </span>
              </div>
              <p className="text-sm text-foreground/90 mt-1">{m.firefighters.reason}</p>
              <p className="text-[11px] text-muted-foreground font-mono-tech mt-1">
                Acionado em {m.firefighters.dispatchedAt.toLocaleTimeString("pt-BR", { hour12: false })}
                {m.firefighters.error && ` · ${m.firefighters.error}`}
              </p>
            </div>
            <button
              onClick={m.acknowledgeFirefighters}
              className="text-xs font-semibold tracking-wider text-muted-foreground hover:text-foreground"
            >
              OCULTAR
            </button>
          </div>
        )}

        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-danger/15 border border-danger/30 flex items-center justify-center">
              <Flame className="h-5 w-5 text-danger" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
              <p className="text-xs text-muted-foreground">Painel de monitoramento de sensores e atuadores</p>
            </div>
          </div>
          <div className="text-right font-mono-tech text-[11px] text-muted-foreground">
            <div>{m.now.toLocaleDateString("pt-BR")} {m.now.toLocaleTimeString("pt-BR", { hour12: false })}</div>
          </div>
        </header>

        {/* TOP BAR */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <div className={cn("card-tech flex items-center gap-3 px-4 py-3 border", statusStyle.border, statusStyle.bg)}>
            <StatusIcon className={cn("h-6 w-6", statusStyle.text)} />
            <div>
              <div className={cn("text-lg font-semibold tracking-widest", statusStyle.text)}>
                {m.systemStatus}
              </div>
              <div className="text-[11px] text-muted-foreground">{statusStyle.sub}</div>
            </div>
          </div>

          <div className="card-tech flex items-center justify-center gap-4 px-4 py-3">
            <div className="relative h-12 w-12 rounded-full border-2 border-success/50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-success" />
              <span className="absolute -top-1 -right-1 rounded-full bg-success text-success-foreground text-[8px] font-bold px-1">24h</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wider">MONITORAMENTO ATIVO</div>
              <div className="text-[11px] text-muted-foreground">
                {m.systemStatus === "PERIGO" && m.dangerSince
                  ? `Bombeiros em ${formatCountdown(m.dangerRemainingMs)}`
                  : "24 HORAS POR DIA"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={m.refetchAll}
              className="card-tech inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wider hover:bg-muted/40 transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", m.isLoading && "animate-spin")} />
              ATUALIZAR
            </button>
            <button
              onClick={onEmergency}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wider bg-danger text-danger-foreground hover:bg-danger/90 transition-colors glow-danger"
            >
              <Siren className="h-4 w-4" />
              EMERGÊNCIA
            </button>
          </div>
        </section>

        {/* Estado de erro global */}
        {m.error && (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            Falha ao comunicar com a API: {m.error.message}
          </div>
        )}

        {/* MAIN GRID */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <KitchenMap sensors={m.sensors} />

          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground mb-3">
                SENSORES — MONITORAMENTO EM TEMPO REAL
              </h2>
              {m.isLoading && m.sensors.length === 0 ? (
                <LoadingBlock label="Carregando sensores..." />
              ) : m.sensors.length === 0 ? (
                <EmptyBlock label="Nenhum sensor disponível" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {m.sensors.map((s) => <SensorCard key={s.id} sensor={s} />)}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground mb-3">
                ATUADORES / SISTEMAS
              </h2>
              {m.isLoading && m.actuators.length === 0 ? (
                <LoadingBlock label="Carregando atuadores..." />
              ) : m.actuators.length === 0 ? (
                <EmptyBlock label="Nenhum atuador disponível" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {m.actuators.map((a) => (
                    <ActuatorCard key={a.id} actuator={a} onToggle={m.toggleActuator} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ALERTS + LOG */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsPanel alerts={m.alerts} />
          <EventLog events={m.events} />
        </section>

        {/* FOOTER BAR */}
        <footer className="panel grid grid-cols-2 md:grid-cols-4 gap-4 px-5 py-4 text-xs">
          <FooterItem label="STATUS DO SISTEMA" value={m.systemStatus} color={statusStyle.text} />
          <FooterItem label="TEMPO DE SESSÃO" value={m.uptime} />
          <FooterItem label="ÚLTIMA ATUALIZAÇÃO" value={m.now.toLocaleTimeString("pt-BR", { hour12: false })} />
          <FooterItem
            label="PRÓXIMA VERIFICAÇÃO"
            value={new Date(m.now.getTime() + 3000).toLocaleTimeString("pt-BR", { hour12: false })}
          />
        </footer>
      </main>
    </div>
  );
};

function FooterItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={cn("font-mono-tech text-sm font-semibold mt-0.5", color)}>{value}</div>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="card-tech flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="card-tech flex items-center justify-center py-10 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default Index;
