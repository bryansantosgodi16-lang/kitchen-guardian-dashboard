import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Sensor, type Actuator, type Alert, type EventLogEntry, type SensorStatus } from "@/services/api";

export type { Sensor, Actuator, Alert, EventLogEntry, SensorStatus } from "@/services/api";
export type SystemStatus = "NORMAL" | "ALERTA" | "PERIGO";

const POLL_MS = 3000;
const FIREFIGHTERS_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos

export interface FirefightersDispatch {
  dispatchedAt: Date;
  reason: string;
  sensorIds: string[];
  status: "pending" | "success" | "error";
  error?: string;
}

export function useKitchenMonitor() {
  const qc = useQueryClient();
  const apiConfigured = api.isConfigured();
  const [now, setNow] = useState(new Date());
  const [startedAt] = useState<Date>(new Date());
  const dangerSinceRef = useRef<Date | null>(null);
  const [firefighters, setFirefighters] = useState<FirefightersDispatch | null>(null);

  // clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const sensorsQ = useQuery({
    queryKey: ["sensors"],
    queryFn: api.getSensors,
    refetchInterval: POLL_MS,
    enabled: apiConfigured,
    retry: 1,
  });
  const actuatorsQ = useQuery({
    queryKey: ["actuators"],
    queryFn: api.getActuators,
    refetchInterval: POLL_MS,
    enabled: apiConfigured,
    retry: 1,
  });
  const alertsQ = useQuery({
    queryKey: ["alerts"],
    queryFn: api.getAlerts,
    refetchInterval: POLL_MS,
    enabled: apiConfigured,
    retry: 1,
  });
  const eventsQ = useQuery({
    queryKey: ["events"],
    queryFn: () => api.getEvents(100),
    refetchInterval: POLL_MS * 2,
    enabled: apiConfigured,
    retry: 1,
  });

  const sensors: Sensor[] = sensorsQ.data ?? [];
  const actuators: Actuator[] = actuatorsQ.data ?? [];
  const alerts: Alert[] = alertsQ.data ?? [];
  const events: EventLogEntry[] = eventsQ.data ?? [];

  const worst: SensorStatus = sensors.some((s) => s.status === "danger")
    ? "danger"
    : sensors.some((s) => s.status === "warning")
      ? "warning"
      : "stable";

  const systemStatus: SystemStatus =
    worst === "danger" ? "PERIGO" : worst === "warning" ? "ALERTA" : "NORMAL";

  // Lógica de auto-acionamento dos bombeiros após 5 min em PERIGO
  useEffect(() => {
    if (systemStatus === "PERIGO") {
      if (!dangerSinceRef.current) dangerSinceRef.current = new Date();
    } else {
      dangerSinceRef.current = null;
      if (firefighters?.status === "pending" || firefighters?.status === "error") {
        // libera novo acionamento quando situação normalizar
      }
    }
  }, [systemStatus, firefighters]);

  const dangerSince = dangerSinceRef.current;
  const dangerElapsedMs = dangerSince ? now.getTime() - dangerSince.getTime() : 0;
  const dangerRemainingMs = dangerSince
    ? Math.max(0, FIREFIGHTERS_THRESHOLD_MS - dangerElapsedMs)
    : 0;

  useEffect(() => {
    if (
      systemStatus === "PERIGO" &&
      dangerSince &&
      dangerElapsedMs >= FIREFIGHTERS_THRESHOLD_MS &&
      !firefighters
    ) {
      const dangerSensors = sensors.filter((s) => s.status === "danger").map((s) => s.id);
      const reason = `Estado de PERIGO contínuo por mais de 5 minutos (sensores: ${dangerSensors.join(", ") || "n/d"})`;
      const dispatch: FirefightersDispatch = {
        dispatchedAt: new Date(),
        reason,
        sensorIds: dangerSensors,
        status: "pending",
      };
      setFirefighters(dispatch);

      if (apiConfigured) {
        api
          .dispatchFirefighters({ reason, sensorIds: dangerSensors })
          .then(() => {
            setFirefighters({ ...dispatch, status: "success" });
            qc.invalidateQueries({ queryKey: ["events"] });
          })
          .catch((err: Error) => {
            setFirefighters({ ...dispatch, status: "error", error: err.message });
          });
      } else {
        // Sem API: marca como pendente para feedback visual
        setFirefighters({ ...dispatch, status: "pending" });
      }
    }
  }, [systemStatus, dangerSince, dangerElapsedMs, sensors, firefighters, apiConfigured, qc]);

  const toggleActuatorMut = useMutation({
    mutationFn: (id: string) => api.toggleActuator(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actuators"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const emergencyMut = useMutation({
    mutationFn: () => api.triggerEmergency(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["actuators"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const acknowledgeFirefighters = () => setFirefighters(null);

  const uptime = useMemo(() => formatUptime(now.getTime() - startedAt.getTime()), [now, startedAt]);

  const isLoading =
    sensorsQ.isLoading || actuatorsQ.isLoading || alertsQ.isLoading || eventsQ.isLoading;
  const error =
    sensorsQ.error || actuatorsQ.error || alertsQ.error || eventsQ.error || null;

  return {
    apiConfigured,
    isLoading,
    error: error as Error | null,
    sensors,
    actuators,
    alerts,
    events,
    systemStatus,
    worst,
    now,
    uptime,
    toggleActuator: (id: string) => toggleActuatorMut.mutate(id),
    triggerEmergency: () => emergencyMut.mutate(),
    refetchAll: () => {
      sensorsQ.refetch();
      actuatorsQ.refetch();
      alertsQ.refetch();
      eventsQ.refetch();
    },
    // Bombeiros
    dangerSince,
    dangerElapsedMs,
    dangerRemainingMs,
    firefighters,
    acknowledgeFirefighters,
  };
}

function formatUptime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}
