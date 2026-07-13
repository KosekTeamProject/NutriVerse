type RankCrestProps = {
  id: string;
  from: string;
  to: string;
  size?: number;
  className?: string;
};

export function RankCrest({ id, from, to, size = 56, className }: RankCrestProps) {
  const h = Math.round(size * 1.14);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 64 73"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`crest-${id}`} x1="6" y1="2" x2="58" y2="71" gradientUnits="userSpaceOnUse">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={`gloss-${id}`} x1="32" y1="2" x2="32" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M32 2 6 13v20c0 18 11 31 26 38 15-7 26-20 26-38V13L32 2Z" fill={`url(#crest-${id})`} />
      <path d="M32 2 6 13v20c0 18 11 31 26 38 15-7 26-20 26-38V13L32 2Z" fill={`url(#gloss-${id})`} />
      <path d="M32 2 6 13v20c0 18 11 31 26 38 15-7 26-20 26-38V13L32 2Z" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
      <path d="M32 21c8.5 3 11.5 12 8 24-8.5-3-11.5-12-8-24Z" fill="#ffffff" fillOpacity="0.95" />
      <path d="M33 24c-.5 7 .3 14 4.5 19" stroke={to} strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
