/**
 * Camada de integração com a API de monitoramento.
 *
 * Configurar a URL base através da variável de ambiente:
 *   VITE_API_BASE_URL=https://api.seu-dominio.com
 *
 * Endpoints esperados (REST):
 *   GET    /sensors                 -> Sensor[]
 *   GET    /actuators               -> Actuator[]
 *   GET    /alerts                  -> Alert[]
 *   GET    /events?limit=100        -> EventLogEntry[]
 *   POST   /actuators/:id/toggle    -> Actuator
 *   POST   /emergency               -> { ok: true }
 *   POST   /emergency/firefighters  -> { ok: true, dispatchedAt: string }
 */

export type SensorType = "heat" | "smoke" | "gas" | "motion";
export type SensorStatus = "stable" | "warning" | "danger";

export interface Sensor {
  id: string;
  type: SensorType;
  name: string;
  unit: string;
  zone: string;
  value: number;
  status: SensorStatus;
  description: string;
  history: number[];
  updatedAt: string; // ISO
}

export interface Actuator {
  id: string;
  name: string;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  toggleOnLabel: string;
  toggleOffLabel: string;
  dangerWhenActive?: boolean;
}

export interface Alert {
  id: string;
  sensorId: string;
  level: "warning" | "danger";
  message: string;
  since: string; // ISO
}

export interface EventLogEntry {
  id: string;
  timestamp: string; // ISO
  type: "SENSOR" | "ATUADOR" | "SISTEMA" | "EMERGENCIA" | "BOMBEIROS";
  level: SensorStatus;
  message: string;
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiNotConfiguredError extends Error {
  constructor() {
    super("API não configurada. Defina VITE_API_BASE_URL para conectar.");
    this.name = "ApiNotConfiguredError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE_URL) throw new ApiNotConfiguredError();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Erro na requisição (${res.status}): ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  isConfigured: () => Boolean(BASE_URL),
  getSensors: () => request<Sensor[]>("/sensors"),
  getActuators: () => request<Actuator[]>("/actuators"),
  getAlerts: () => request<Alert[]>("/alerts"),
  getEvents: (limit = 100) => request<EventLogEntry[]>(`/events?limit=${limit}`),
  toggleActuator: (id: string) =>
    request<Actuator>(`/actuators/${id}/toggle`, { method: "POST" }),
  triggerEmergency: () =>
    request<{ ok: boolean }>("/emergency", { method: "POST" }),
  dispatchFirefighters: (payload: { reason: string; sensorIds: string[] }) =>
    request<{ ok: boolean; dispatchedAt: string }>("/emergency/firefighters", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
