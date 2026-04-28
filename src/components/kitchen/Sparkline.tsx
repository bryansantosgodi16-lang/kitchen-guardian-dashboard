import type { SensorStatus, SensorType } from "@/services/api";

const statusColor: Record<SensorStatus, string> = {
  stable: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  danger: "hsl(var(--danger))",
};

const sensorColor: Record<SensorType, string> = {
  heat: "hsl(var(--sensor-heat))",
  smoke: "hsl(var(--sensor-smoke))",
  gas: "hsl(var(--sensor-gas))",
  motion: "hsl(var(--sensor-motion))",
};

export function Sparkline({
  data,
  status,
  type,
  width = 280,
  height = 44,
}: {
  data: number[];
  status: SensorStatus;
  type?: SensorType;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-muted-foreground"
        style={{ height }}
      >
        Aguardando histórico…
      </div>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(2)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(2)}`)
    .join(" ");

  // Cor: status sobrepõe cor padrão do sensor quando há alerta
  const stroke =
    status === "stable" && type ? sensorColor[type] : statusColor[status];
  const gradId = `grad-${type ?? "x"}-${status}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${gradId})`}
        stroke="none"
      />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
