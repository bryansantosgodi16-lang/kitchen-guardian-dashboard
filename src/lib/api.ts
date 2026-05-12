import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  SensorReading,
  ActuatorState,
  EventLogEntry,
  AlertMessage,
  SensorStatus,
} from "@/hooks/useKitchenMonitor";

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file."
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------------
// Raw DB row types (mirrors what Supabase will return)
// ---------------------------------------------------------------------------

export interface SensorRow {
  id: string;
  name: string;
  unit: string;
  zone: string;
  value: number | null;
  history: number[];
  status: SensorStatus;
  description: string;
  updated_at: string;
}

export interface ActuatorRow {
  id: string;
  name: string;
  active: boolean;
  active_label: string;
  inactive_label: string;
  toggle_on_label: string;
  toggle_off_label: string;
  danger_when_active: boolean;
  updated_at: string;
}

export interface EventRow {
  id: string;
  timestamp: string;
  type: "SENSOR" | "ACTUATOR" | "SYSTEM" | "EMERGENCY";
  level: SensorStatus;
  message: string;
}

export interface AlertRow {
  id: string;
  level: "warning" | "danger";
  message: string;
  since: string;
  resolved: boolean;
}

// ---------------------------------------------------------------------------
// Mappers — DB rows → domain types used in the hook / components
// ---------------------------------------------------------------------------

export function mapSensorRow(row: SensorRow): SensorReading {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    zone: row.zone,
    value: row.value,
    history: row.history ?? [],
    status: row.status,
    description: row.description,
  };
}

export function mapActuatorRow(row: ActuatorRow): ActuatorState {
  return {
    id: row.id,
    name: row.name,
    active: row.active,
    activeLabel: row.active_label,
    inactiveLabel: row.inactive_label,
    toggleOnLabel: row.toggle_on_label,
    toggleOffLabel: row.toggle_off_label,
    dangerWhenActive: row.danger_when_active,
  };
}

export function mapEventRow(row: EventRow): EventLogEntry {
  return {
    id: row.id,
    timestamp: new Date(row.timestamp),
    type: row.type,
    level: row.level,
    message: row.message,
  };
}

export function mapAlertRow(row: AlertRow): AlertMessage {
  return {
    id: row.id,
    level: row.level,
    message: row.message,
    since: new Date(row.since),
  };
}

// ---------------------------------------------------------------------------
// Sensors API
// ---------------------------------------------------------------------------

/** Fetch all sensors ordered by name. */
export async function fetchSensors(): Promise<SensorReading[]> {
  const { data, error } = await supabase
    .from("sensors")
    .select("*")
    .order("name");

  if (error) throw new Error(`fetchSensors: ${error.message}`);
  return (data as SensorRow[]).map(mapSensorRow);
}

/** Upsert a sensor reading (used when a new value arrives). */
export async function upsertSensorReading(
  sensor: Pick<SensorRow, "id" | "value" | "history" | "status">
): Promise<void> {
  const { error } = await supabase
    .from("sensors")
    .update({
      value: sensor.value,
      history: sensor.history,
      status: sensor.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sensor.id);

  if (error) throw new Error(`upsertSensorReading: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Actuators API
// ---------------------------------------------------------------------------

/** Fetch all actuators. */
export async function fetchActuators(): Promise<ActuatorState[]> {
  const { data, error } = await supabase
    .from("actuators")
    .select("*")
    .order("name");

  if (error) throw new Error(`fetchActuators: ${error.message}`);
  return (data as ActuatorRow[]).map(mapActuatorRow);
}

/** Toggle an actuator's active state. */
export async function toggleActuator(
  id: string,
  active: boolean
): Promise<ActuatorState> {
  const { data, error } = await supabase
    .from("actuators")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`toggleActuator: ${error.message}`);
  return mapActuatorRow(data as ActuatorRow);
}

/**
 * Trigger the emergency protocol:
 *  - Close gas valve and cut power
 *  - Activate ventilation and water pump
 */
export async function triggerEmergencyProtocol(): Promise<void> {
  const now = new Date().toISOString();

  // Close gas & power
  const { error: closeError } = await supabase
    .from("actuators")
    .update({ active: false, updated_at: now })
    .in("id", ["gas_valve", "power"]);

  if (closeError) throw new Error(`triggerEmergency (close): ${closeError.message}`);

  // Activate ventilation & water pump
  const { error: openError } = await supabase
    .from("actuators")
    .update({ active: true, updated_at: now })
    .in("id", ["vent", "water_pump"]);

  if (openError) throw new Error(`triggerEmergency (open): ${openError.message}`);

  // Log the emergency event
  await insertEvent({
    type: "EMERGENCY",
    level: "danger",
    message:
      "BOTOEIRA DE EMERGÊNCIA ACIONADA — Gás fechado, energia desligada, ventilação e bomba ativadas",
  });
}

// ---------------------------------------------------------------------------
// Events API
// ---------------------------------------------------------------------------

/** Fetch the latest N event log entries (default 100). */
export async function fetchEvents(limit = 100): Promise<EventLogEntry[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`fetchEvents: ${error.message}`);
  return (data as EventRow[]).map(mapEventRow);
}

/** Insert a new event log entry. */
export async function insertEvent(
  event: Omit<EventRow, "id" | "timestamp">
): Promise<EventLogEntry> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...event,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`insertEvent: ${error.message}`);
  return mapEventRow(data as EventRow);
}

// ---------------------------------------------------------------------------
// Alerts API
// ---------------------------------------------------------------------------

/** Fetch all active (unresolved) alerts. */
export async function fetchActiveAlerts(): Promise<AlertMessage[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("resolved", false)
    .order("since", { ascending: false });

  if (error) throw new Error(`fetchActiveAlerts: ${error.message}`);
  return (data as AlertRow[]).map(mapAlertRow);
}

/** Create a new alert. */
export async function createAlert(
  alert: Pick<AlertRow, "level" | "message">
): Promise<AlertMessage> {
  const { data, error } = await supabase
    .from("alerts")
    .insert({
      ...alert,
      since: new Date().toISOString(),
      resolved: false,
    })
    .select()
    .single();

  if (error) throw new Error(`createAlert: ${error.message}`);
  return mapAlertRow(data as AlertRow);
}

/** Resolve (dismiss) an alert by id. */
export async function resolveAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from("alerts")
    .update({ resolved: true })
    .eq("id", id);

  if (error) throw new Error(`resolveAlert: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Real-time subscriptions (Supabase Realtime channels)
// ---------------------------------------------------------------------------

type UnsubscribeFn = () => void;

/** Subscribe to live sensor updates. Calls `onUpdate` on every row change. */
export function subscribeSensors(
  onUpdate: (sensor: SensorReading) => void
): UnsubscribeFn {
  const channel = supabase
    .channel("sensors-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sensors" },
      (payload) => {
        if (payload.new) {
          onUpdate(mapSensorRow(payload.new as SensorRow));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Subscribe to live actuator updates. */
export function subscribeActuators(
  onUpdate: (actuator: ActuatorState) => void
): UnsubscribeFn {
  const channel = supabase
    .channel("actuators-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "actuators" },
      (payload) => {
        if (payload.new) {
          onUpdate(mapActuatorRow(payload.new as ActuatorRow));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Subscribe to new event log entries. */
export function subscribeEvents(
  onInsert: (event: EventLogEntry) => void
): UnsubscribeFn {
  const channel = supabase
    .channel("events-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "events" },
      (payload) => {
        if (payload.new) {
          onInsert(mapEventRow(payload.new as EventRow));
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Subscribe to alert changes (new alerts or resolutions). */
export function subscribeAlerts(
  onChange: (alert: AlertRow, eventType: "INSERT" | "UPDATE") => void
): UnsubscribeFn {
  const channel = supabase
    .channel("alerts-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "alerts" },
      (payload) => onChange(payload.new as AlertRow, "INSERT")
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "alerts" },
      (payload) => onChange(payload.new as AlertRow, "UPDATE")
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// React Query query keys (centralised — import these in your hooks/pages)
// ---------------------------------------------------------------------------

export const queryKeys = {
  sensors: ["sensors"] as const,
  actuators: ["actuators"] as const,
  events: (limit?: number) => ["events", limit] as const,
  activeAlerts: ["alerts", "active"] as const,
};
