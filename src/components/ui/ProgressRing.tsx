type ProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  from?: string;
  to?: string;
  gradientId?: string;
  showText?: boolean;
};

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  from = "var(--brand-bright)",
  to = "var(--lime)",
  gradientId = "pr",
  showText = true,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gid = `ring-${gradientId}`;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2={size} y2={size}>
            <stop stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--secondary)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      {showText && (
        <div className="absolute text-center select-none">
          <p className="stat-num text-3xl leading-none">{value}</p>
          {label && <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>}
        </div>
      )}
    </div>
  );
}
