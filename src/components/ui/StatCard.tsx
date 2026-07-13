import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: "brand" | "amber" | "sky" | "lime";
};

const accentMap: Record<string, string> = {
  brand: "text-brand bg-brand-soft",
  amber: "text-amber bg-amber/15",
  sky: "text-sky bg-sky/10",
  lime: "text-lime bg-lime/15",
};

export function StatCard({ icon: Icon, label, value, hint, accent = "brand" }: StatCardProps) {
  return (
    <div className="card card-pad card-hover">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${accentMap[accent]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="stat-num mt-3 text-3xl">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
