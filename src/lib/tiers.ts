export type Tier = { name: string; slug: string; from: string; to: string; minXp: number };

export const TIERS: Tier[] = [
  { name: "Sprout", slug: "sprout", from: "#bbf7d0", to: "#4ade80", minXp: 0 },
  { name: "Seedling", slug: "seedling", from: "#86efac", to: "#22c55e", minXp: 1200 },
  { name: "Bloom", slug: "bloom", from: "#6ee7b7", to: "#10b981", minXp: 3000 },
  { name: "Vital", slug: "vital", from: "#5eead4", to: "#14b8a6", minXp: 6000 },
  { name: "Radiant", slug: "radiant", from: "#7dd3fc", to: "#0ea5e9", minXp: 10000 },
  { name: "Peak", slug: "peak", from: "#a5b4fc", to: "#6366f1", minXp: 16000 },
  { name: "Elite", slug: "elite", from: "#c4b5fd", to: "#8b5cf6", minXp: 24000 },
  { name: "Apex", slug: "apex", from: "#fcd34d", to: "#f59e0b", minXp: 34000 },
  { name: "Legend", slug: "legend", from: "#fda4af", to: "#e11d48", minXp: 50000 },
];

export function tierBySlug(slug: string): Tier {
  return TIERS.find((t) => t.slug === slug) ?? TIERS[0];
}

export function tierForXp(xp: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) if (xp >= t.minXp) current = t;
  return current;
}

export function nextTier(xp: number): Tier | null {
  const idx = TIERS.findIndex((t) => t.slug === tierForXp(xp).slug);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}
