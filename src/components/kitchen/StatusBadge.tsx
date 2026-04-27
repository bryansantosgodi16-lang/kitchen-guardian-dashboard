import type { SensorStatus } from "@/hooks/useKitchenMonitor";
import { cn } from "@/lib/utils";

const map: Record<SensorStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
  stable:  { label: "ESTÁVEL", dot: "bg-success", text: "text-success", bg: "bg-success/10", border: "border-success/30" },
  warning: { label: "ALERTA",  dot: "bg-warning", text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  danger:  { label: "PERIGO",  dot: "bg-danger",  text: "text-danger",  bg: "bg-danger/10",  border: "border-danger/40"  },
};

export function StatusBadge({
  status,
  label,
  pulse,
}: {
  status: SensorStatus;
  label?: string;
  pulse?: boolean;
}) {
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider",
        s.bg,
        s.border,
        s.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot, pulse && "animate-blink")} />
      {label ?? s.label}
    </span>
  );
}

export const statusStyles = map;
