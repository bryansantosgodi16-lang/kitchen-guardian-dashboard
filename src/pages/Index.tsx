import { Flame, ShieldAlert, ShieldCheck, Clock, Siren, HelpCircle, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useKitchenMonitor } from "@/hooks/useKitchenMonitor";
import { SensorCard } from "@/components/kitchen/SensorCard";
import { ActuatorCard } from "@/components/kitchen/ActuatorCard";
import { KitchenMap } from "@/components/kitchen/KitchenMap";
import { AlertsPanel } from "@/components/kitchen/AlertsPanel";
import { EventLog } from "@/components/kitchen/EventLog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Index = () => {
  const m = useKitchenMonitor();
  const [helpOpen, setHelpOpen] = useState(false);

  const statusStyle = {
    NORMAL: { text: "text-success", border: "border-success/40", bg: "bg-success/10", icon: ShieldCheck, sub: "Todos os sistemas operacionais" },
    ALERTA: { text: "text-warning", border: "border-warning/40", bg: "bg-warning/10", icon: ShieldAlert, sub: "Atenção necessária" },
    PERIGO: { text: "text-danger", border: "border-danger/40", bg: "bg-danger/10", icon: ShieldAlert, sub: "Ação imediata requerida" },
  }[m.systemStatus];
  const StatusIcon = statusStyle.icon;

  const onEmergency = () => {
    const motionSensor = m.sensors.find((s) => s.id === "motion");
    const motionActive = motionSensor?.value !== null && (motionSensor?.value ?? 0) > 0;

    m.triggerEmergency();

    toast.error("Botoeira de Emergência acionada", {
      description: motionActive
        ? "Gás fechado, energia desligada, ventilação ativada. Bomba bloqueada — movimento detectado."
        : "Gás fechado, energia desligada, ventilação e bomba ativadas.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 space-y-6">
        {/* CABEÇALHO */}
        <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-danger/15 border border-danger/30 flex items-center justify-center">
              <Flame className="h-5 w-5 text-danger" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Sistema de Segurança para Cozinha Industrial
              </h1>
              <p className="text-xs text-muted-foreground">
                Painel de Monitoramento de Sensores Industriais
              </p>
            </div>
          </div>
          <div className="text-right font-mono-tech text-[11px] text-muted-foreground">
            <div>
              {m.now.toLocaleDateString("pt-BR")}{" "}
              {m.now.toLocaleTimeString("pt-BR", { hour12: false })}
            </div>
          </div>
        </header>

        {/* BARRA SUPERIOR */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Status do sistema */}
          <div className={cn("card-tech flex items-center gap-3 px-4 py-3 border", statusStyle.border, statusStyle.bg)}>
            <StatusIcon className={cn("h-6 w-6", statusStyle.text)} />
            <div>
              <div className={cn("text-lg font-semibold tracking-widest", statusStyle.text)}>
                {m.systemStatus}
              </div>
              <div className="text-[11px] text-muted-foreground">{statusStyle.sub}</div>
            </div>
          </div>

          {/* Monitoramento 24h */}
          <div className="card-tech flex items-center justify-center gap-4 px-4 py-3">
            <div className="relative h-12 w-12 rounded-full border-2 border-success/50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-success" />
              <span className="absolute -top-1 -right-1 rounded-full bg-success text-success-foreground text-[8px] font-bold px-1">
                24h
              </span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wider">MONITORAMENTO ATIVO</div>
              <div className="text-[11px] text-muted-foreground">24 HORAS POR DIA</div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onEmergency}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wider bg-danger text-danger-foreground hover:bg-danger/90 transition-colors glow-danger"
            >
              <Siren className="h-4 w-4" />
              EMERGÊNCIA
            </button>
          </div>
        </section>

        {/* GRID PRINCIPAL */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <KitchenMap sensors={m.sensors} />

          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground mb-3">
                SENSORES — MONITORAMENTO EM TEMPO REAL
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {m.sensors.map((s) => <SensorCard key={s.id} sensor={s} />)}
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold tracking-[0.2em] text-muted-foreground mb-3">
                ATUADORES / SISTEMAS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {m.actuators.map((a) => (
                  <ActuatorCard key={a.id} actuator={a} onToggle={m.toggleActuator} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ALERTAS + REGISTRO */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertsPanel alerts={m.alerts} />
          <EventLog events={m.events} />
        </section>

        {/* RODAPÉ */}
        <footer className="panel grid grid-cols-2 md:grid-cols-4 gap-4 px-5 py-4 text-xs">
          <FooterItem label="STATUS DO SISTEMA" value={m.systemStatus} color={statusStyle.text} />
          <FooterItem label="TEMPO ATIVO" value={m.uptime} />
          <FooterItem
            label="ÚLTIMA ATUALIZAÇÃO"
            value={m.now.toLocaleTimeString("pt-BR", { hour12: false })}
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

export default Index;
