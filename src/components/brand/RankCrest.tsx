import type { ComponentType } from "react";
import {
  Crown,
  Flower2,
  Gem,
  HeartPulse,
  Leaf,
  Mountain,
  Sprout,
  Sun,
  Trophy,
  type LucideProps,
} from "lucide-react";
import { TIER_EMBLEM_NAMES, type TierSlug } from "@/lib/tiers";

type RankCrestProps = {
  id: string;
  tier: TierSlug;
  from: string;
  to: string;
  size?: number;
  className?: string;
};

type RankEmblem = ComponentType<LucideProps>;

const EMBLEM_BY_TIER: Record<TierSlug, RankEmblem> = {
  sprout: Sprout,
  seedling: Leaf,
  bloom: Flower2,
  vital: HeartPulse,
  radiant: Sun,
  peak: Mountain,
  elite: Gem,
  apex: Crown,
  legend: Trophy,
};

export function RankCrest({ id, tier, from, to, size = 56, className }: RankCrestProps) {
  const h = Math.round(size * 1.14);
  const iconSize = Math.max(15, Math.round(size * 0.56));
  const emblemName = TIER_EMBLEM_NAMES[tier];
  const EmblemIcon = EMBLEM_BY_TIER[tier];

  return (
    <span
      className={`relative inline-block shrink-0 align-middle ${className ?? ""}`}
      style={{ width: size, height: h }}
      data-rank-tier={tier}
      data-rank-emblem={emblemName}
      role="img"
      aria-label={`Lambang rank ${emblemName}`}
    >
      <svg width={size} height={h} viewBox="0 0 64 73" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
        <defs>
          <linearGradient id={`crest-${id}`} x1="9" y1="4" x2="55" y2="69" gradientUnits="userSpaceOnUse">
            <stop stopColor={from} />
            <stop offset="0.34" stopColor={from} />
            <stop offset="0.82" stopColor={to} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
          <radialGradient id={`light-${id}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(19 12) rotate(53) scale(46 42)">
            <stop stopColor="#ffffff" stopOpacity="0.58" />
            <stop offset="0.38" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`depth-${id}`} x1="32" y1="21" x2="32" y2="71" gradientUnits="userSpaceOnUse">
            <stop offset="0.35" stopColor="#071b18" stopOpacity="0" />
            <stop offset="1" stopColor="#071b18" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`sheen-${id}`} x1="8" y1="14" x2="57" y2="51" gradientUnits="userSpaceOnUse">
            <stop offset="0.2" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="0.48" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="0.67" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`medallion-${id}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(26 29) rotate(48) scale(24)">
            <stop stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="0.58" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.04" />
          </radialGradient>
          <clipPath id={`clip-${id}`}>
            <path d="M32 2 6 13v20c0 18 11 31 26 38 15-7 26-20 26-38V13L32 2Z" />
          </clipPath>
          <filter id={`shadow-${id}`} x="-30%" y="-20%" width="160%" height="160%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={to} floodOpacity="0.34" />
          </filter>
        </defs>
        <g filter={`url(#shadow-${id})`}>
          <path d="M32 2 6 13v20c0 18 11 31 26 38 15-7 26-20 26-38V13L32 2Z" fill={`url(#crest-${id})`} />
          <path d="M32 2 6 13v20c0 18 11 31 26 38 15-7 26-20 26-38V13L32 2Z" fill={`url(#light-${id})`} />
          <path d="M32 2 6 13v20c0 18 11 31 26 38 15-7 26-20 26-38V13L32 2Z" fill={`url(#depth-${id})`} />
          <path d="M-1 29 28 3l37 28-29 28L-1 29Z" fill={`url(#sheen-${id})`} clipPath={`url(#clip-${id})`} />
          <path d="M32 2 6 13v20c0 18 11 31 26 38 15-7 26-20 26-38V13L32 2Z" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.6" />
          <path d="M32 6 10 15v18c0 15.4 8.9 26.6 22 33.2C45.1 59.6 54 48.4 54 33V15L32 6Z" stroke="#ffffff" strokeOpacity="0.2" strokeWidth="1" />
        </g>
        <circle cx="32" cy="36" r="17" fill={`url(#medallion-${id})`} />
        <circle cx="32" cy="36" r="15.5" stroke="#ffffff" strokeOpacity="0.24" />
        <path d="M18 57c4.1 4 8.8 7.2 14 9.9 5.2-2.7 9.9-5.9 14-9.9" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="20" cy="14" rx="7" ry="3.2" fill="#ffffff" fillOpacity="0.12" transform="rotate(-22 20 14)" />
      </svg>
      <EmblemIcon
        size={iconSize}
        strokeWidth={2.35}
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-white [filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.18))]"
        style={{ top: Math.round((h * 36) / 73 - iconSize / 2) }}
      />
    </span>
  );
}
