type ProgressRingProps = {
  value?: number;
  progress?: number;
  size?: number;
  stroke?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  from?: string;
  to?: string;
  gradientId?: string;
  showText?: boolean;
  children?: React.ReactNode;
};

export function ProgressRing({
  value,
  progress,
  size = 120,
  stroke,
  strokeWidth = 10,
  color,
  label,
  from,
  to,
  gradientId = "pr",
  showText = true,
  children
}: ProgressRingProps) {
  const actualValue = value ?? progress ?? 0;
  const actualStroke = stroke ?? strokeWidth;
  const actualFrom = color ?? from ?? "var(--brand-bright)";
  const actualTo = color ?? to ?? "var(--lime)";
  
  const r = (size - actualStroke) / 2;
  const c = 2 * Math.PI * r;
  const gid = `ring-${gradientId}`;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2={size} y2={size}>
            <stop stopColor={actualFrom} />
            <stop offset="1" stopColor={actualTo} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--secondary)" strokeWidth={actualStroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={actualStroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - actualValue / 100)}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 grid place-items-center">{children}</div>
      ) : showText && (
        <div className="absolute text-center select-none">
          <p className="stat-num text-3xl leading-none">{actualValue}</p>
          {label && <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>}
        </div>
      )}
    </div>
  );
}
