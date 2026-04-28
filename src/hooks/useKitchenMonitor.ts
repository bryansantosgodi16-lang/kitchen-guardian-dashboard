import { useEffect, useRef, useState } from "react";

export type SensorStatus = "stable" | "warning" | "danger";
export type SystemStatus = "NORMAL" | "ALERTA" | "PERIGO";

export interface SensorReading {
  id: string;
  name: string;
  unit: string;
  zone: string;
  value: number;
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

const HISTORY_LEN = 40;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const drift = (prev: number, volatility: number, min: number, max: number) => {
  const next = prev + (Math.random() - 0.5) * volatility;
  return clamp(next, min, max);
};

const initHistory = (base: number, volatility: number, min: number, max: number) => {
  const arr: number[] = [];
  let v = base;
  for (let i = 0; i < HISTORY_LEN; i++) {
    v = drift(v, volatility, min, max);
    arr.push(v);
  }
  return arr;
};

const initialSensors = (): SensorReading[] => [
  {
    id: "heat",
    name: "Sensor Calor",
    unit: "°C",
    zone: "Fogão Industrial",
    value: 24,
    history: initHistory(24, 0.6, 20, 30),
    status: "stable",
    description: "Temperatura ambiente",
  },
  {
    id: "smoke",
    name: "Sensor Fumaça",
    unit: "ppm",
    zone: "Área de Cocção",
    value: 12,
    history: initHistory(12, 1.2, 5, 20),
    status: "warning",
    description: "Densidade de fumaça",
  },
  {
    id: "gas",
    name: "Sensor Gás (GLP)",
    unit: "%LEL",
    zone: "Central de Gás",
    value: 0.2,
    history: initHistory(0.2, 0.05, 0, 1),
    status: "stable",
    description: "Gás Liquefeito de Petróleo",
  },
  {
    id: "motion",
    name: "Sensor Movimento",
    unit: "",
    zone: "Área de Preparo",
    value: 1,
    history: initHistory(1, 0.3, 0, 3),
    status: "stable",
    description: "Detecção de movimento",
  },
];

const initialActuators = (): ActuatorState[] => [
  {
    id: "vent",
    name: "Sistema de Ventilação",
    active: true,
    activeLabel: "ATIVO",
    inactiveLabel: "INATIVO",
    toggleOnLabel: "Ativar",
    toggleOffLabel: "Desativar",
  },
  {
    id: "gas_valve",
    name: "Válvula de Gás",
    active: true,
    activeLabel: "ABERTA",
    inactiveLabel: "FECHADA",
    toggleOnLabel: "Abrir Válvula",
    toggleOffLabel: "Fechar Válvula",
    dangerWhenActive: true,
  },
  {
    id: "water_pump",
    name: "Bomba de Água",
    active: false,
    activeLabel: "ATIVA",
    inactiveLabel: "INATIVA",
    toggleOnLabel: "Ativar",
    toggleOffLabel: "Desativar",
  },
  {
    id: "power",
    name: "Tomadas de Energia",
    active: true,
    activeLabel: "LIGADAS",
    inactiveLabel: "DESLIGADAS",
    toggleOnLabel: "Ligar",
    toggleOffLabel: "Desligar",
    dangerWhenActive: true,
  },
];

const evalStatus = (id: string, v: number): SensorStatus => {
  switch (id) {
    case "heat":
      if (v >= 60) return "danger";
      if (v >= 40) return "warning";
      return "stable";
    case "smoke":
      if (v >= 25) return "danger";
      if (v >= 10) return "warning";
      return "stable";
    case "gas":
      if (v >= 1) return "danger";
      if (v >= 0.5) return "warning";
      return "stable";
    case "motion":
      return "stable";
    default:
      return "stable";
  }
};

const alertMessageFor = (s: SensorReading): string => {
  if (s.id === "smoke")
    return s.status === "danger"
      ? "Fumaça em nível crítico na Área de Cocção"
      : "Nível de fumaça elevado na Área de Cocção";
  if (s.id === "gas")
    return s.status === "danger"
      ? "Possível vazamento de gás detectado"
      : "Concentração de gás acima do normal";
  if (s.id === "heat")
    return s.status === "danger"
      ? "Temperatura crítica no fogão industrial"
      : "Temperatura elevada detectada";
  return `${s.name}: leitura anormal`;
};

export function useKitchenMonitor() {
  const [running, setRunning] = useState(true);
  const [sensors, setSensors] = useState<SensorReading[]>(initialSensors);
  const [actuators, setActuators] = useState<ActuatorState[]>(initialActuators);
  const [events, setEvents] = useState<EventLogEntry[]>([
    {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type: "SYSTEM",
      level: "stable",
      message: "Sistema inicializado — Monitoramento ativo",
    },
  ]);
  const [startedAt] = useState<Date>(new Date(Date.now() - 24 * 3600 * 1000 - 32 * 60 * 1000));
  const [now, setNow] = useState(new Date());
  const prevStatus = useRef<Record<string, SensorStatus>>({});

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

  // sensor tick
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => {
          let vol = 0.6;
          let min = 0;
          let max = 100;
          if (s.id === "heat") { vol = 0.8; min = 20; max = 80; }
          if (s.id === "smoke") { vol = 1.5; min = 2; max = 40; }
          if (s.id === "gas") { vol = 0.06; min = 0; max = 1.4; }
          if (s.id === "motion") { vol = 0.4; min = 0; max = 3; }
          const nextVal = Number(drift(s.value, vol, min, max).toFixed(s.id === "gas" ? 2 : 1));
          const status = evalStatus(s.id, nextVal);
          const history = [...s.history.slice(1), nextVal];

          // emit event on status change
          if (prevStatus.current[s.id] && prevStatus.current[s.id] !== status) {
            pushEvent({
              type: "SENSOR",
              level: status,
              message:
                status === "stable"
                  ? `${s.name} normalizado (${nextVal}${s.unit})`
                  : alertMessageFor({ ...s, value: nextVal, status }),
            });
          }
          prevStatus.current[s.id] = status;

          return { ...s, value: nextVal, history, status };
        }),
      );
    }, 1500);
    return () => clearInterval(t);
  }, [running]);

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
      message: "BOTOEIRA DE EMERGÊNCIA ACIONADA — Gás fechado, energia desligada, ventilação e bomba ativadas",
    });
  };

  // derive system status & alerts
  const worst: SensorStatus = sensors.some((s) => s.status === "danger")
    ? "danger"
    : sensors.some((s) => s.status === "warning")
      ? "warning"
      : "stable";

  const systemStatus: SystemStatus =
    worst === "danger" ? "PERIGO" : worst === "warning" ? "ALERTA" : "NORMAL";

  const alerts: AlertMessage[] = sensors
    .filter((s) => s.status !== "stable")
    .map((s) => ({
      id: s.id,
      level: s.status === "danger" ? "danger" : "warning",
      message: alertMessageFor(s),
      since: new Date(),
    }));

  // uptime
  const uptimeMs = now.getTime() - startedAt.getTime();
  const uptime = formatUptime(uptimeMs);

  return {
    running,
    setRunning,
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
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}
