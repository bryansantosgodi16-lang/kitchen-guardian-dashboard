import { useEffect, useState } from "react";

export type SensorStatus = "stable" | "warning" | "danger";
export type SystemStatus = "NORMAL" | "ALERTA" | "PERIGO";

export interface SensorReading {
  id: string;
  name: string;
  unit: string;
  zone: string;
  value: number | null;
  history: number[];
  status: SensorStatus;
  description: string;
}

export interface ActuatorState {
  id: string;
  name: string;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  toggleOnLabel: string;
  toggleOffLabel: string;
  /** if true, dangerous when active (gas valve open) */
  dangerWhenActive?: boolean;
}

export interface EventLogEntry {
  id: string;
  timestamp: Date;
  type: "SENSOR" | "ACTUATOR" | "SYSTEM" | "EMERGENCY";
  level: SensorStatus;
  message: string;
}

export interface AlertMessage {
  id: string;
  level: "warning" | "danger";
  message: string;
  since: Date;
}

const initialSensors = (): SensorReading[] => [
  {
    id: "heat",
    name: "Sensor de Calor",
    unit: "°C",
    zone: "Fogão Industrial",
    value: null,
    history: [],
    status: "stable",
    description: "Temperatura ambiente",
  },
  {
    id: "smoke",
    name: "Sensor de Fumaça",
    unit: "ppm",
    zone: "Área de Cocção",
    value: null,
    history: [],
    status: "stable",
    description: "Densidade de fumaça",
  },
  {
    id: "gas",
    name: "Sensor de Gás (GLP)",
    unit: "%LEL",
    zone: "Central de Gás",
    value: null,
    history: [],
    status: "stable",
    description: "Gás Liquefeito de Petróleo",
  },
  {
    id: "motion",
    name: "Sensor de Movimento",
    unit: "",
    zone: "Área de Preparo",
    value: null,
    history: [],
    status: "stable",
    description: "Detecção de movimento",
  },
];

const initialActuators = (): ActuatorState[] => [
  {
    id: "vent",
    name: "Sistema de Ventilação",
    active: false,
    activeLabel: "ATIVO",
    inactiveLabel: "DESATIVADO",
    toggleOnLabel: "Ativar",
    toggleOffLabel: "Desativar",
  },
  {
    id: "gas_valve",
    name: "Válvula de Gás",
    active: false,
    activeLabel: "ATIVO",
    inactiveLabel: "DESATIVADO",
    toggleOnLabel: "Abrir Válvula",
    toggleOffLabel: "Fechar Válvula",
  },
  {
    id: "water_pump",
    name: "Bomba de Água",
    active: false,
    activeLabel: "ATIVO",
    inactiveLabel: "DESATIVADO",
    toggleOnLabel: "Ativar",
    toggleOffLabel: "Desativar",
  },
  {
    id: "power",
    name: "Tomadas de Energia",
    active: false,
    activeLabel: "ATIVO",
    inactiveLabel: "DESATIVADO",
    toggleOnLabel: "Ligar",
    toggleOffLabel: "Desligar",
  },
];

export function useKitchenMonitor() {
  const [sensors] = useState<SensorReading[]>(initialSensors);
  const [actuators, setActuators] = useState<ActuatorState[]>(initialActuators);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [startedAt] = useState<Date>(new Date());
  const [now, setNow] = useState(new Date());

  const pushEvent = (e: Omit<EventLogEntry, "id" | "timestamp">) => {
    setEvents((prev) =>
      [
        { ...e, id: crypto.randomUUID(), timestamp: new Date() },
        ...prev,
      ].slice(0, 100),
    );
  };

  // clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleActuator = (id: string) => {
    setActuators((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = { ...a, active: !a.active };
        pushEvent({
          type: "ACTUATOR",
          level: "stable",
          message: `${a.name}: ${next.active ? next.activeLabel : next.inactiveLabel}`,
        });
        return next;
      }),
    );
  };

  const triggerEmergency = () => {
    setActuators((prev) =>
      prev.map((a) => {
        if (a.id === "gas_valve" || a.id === "power") return { ...a, active: false };
        if (a.id === "vent" || a.id === "water_pump") return { ...a, active: true };
        return a;
      }),
    );
    pushEvent({
      type: "EMERGENCY",
      level: "danger",
      message:
        "BOTOEIRA DE EMERGÊNCIA ACIONADA — Gás fechado, energia desligada, ventilação e bomba ativadas",
    });
  };

  const systemStatus: SystemStatus = "NORMAL";
  const worst: SensorStatus = "stable";
  const alerts: AlertMessage[] = [];

  const uptimeMs = now.getTime() - startedAt.getTime();
  const uptime = formatUptime(uptimeMs);

  return {
    sensors,
    actuators,
    events,
    alerts,
    systemStatus,
    worst,
    now,
    uptime,
    toggleActuator,
    triggerEmergency,
  };
}

function formatUptime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}
