"use client";

import Link from "next/link";
import { 
  Footprints, 
  Utensils, 
  Droplets, 
  Moon, 
  CalendarCheck, 
  Sprout, 
  Target, 
  Flame, 
  ArrowRight, 
  Info, 
  Sparkles,
  Trophy
} from "lucide-react";
import { TodayJourney, BehaviorGoal, HealthyDaySummary, StreakSummary, ChallengeSummary, GoalRewardPreview, HealthyDayHistoryPoint, HealthyDayStatus } from "../types";
import { 
  getGoalStatusLabel, 
  getGoalTrustLabel, 
  getHealthyDayStatusLabel, 
  getStreakStatusLabel, 
  getGoalCategoryTone,
  getHealthyDayAccessibleLabel
} from "../helpers";

// Helper to resolve Category Icons
export function GoalCategoryIcon({ category, className = "h-4 w-4" }: { category: string; className?: string }) {
  switch (category) {
    case "activity": return <Footprints className={className} />;
    case "nutrition": return <Utensils className={className} />;
    case "hydration": return <Droplets className={className} />;
    case "recovery": return <Moon className={className} />;
    case "consistency": return <CalendarCheck className={className} />;
    case "lifestyle": return <Sprout className={className} />;
    case "challenge": return <Target className={className} />;
    default: return <Sparkles className={className} />;
  }
}

// 1. GoalProgressRow
export function GoalProgressRow({ 
  goal, 
  showTrust = false, 
  showAction = false 
}: { 
  readonly goal: BehaviorGoal; 
  readonly showTrust?: boolean; 
  readonly showAction?: boolean;
}) {
  const tone = getGoalCategoryTone(goal.category);
  
  const statusColors = {
    "completed": "bg-lime/10 text-lime border-lime/20",
    "in-progress": "bg-brand-soft/30 text-brand border-brand/20",
    "still-growing": "bg-sky/15 text-sky border-sky/20",
    "paused": "bg-secondary text-muted-foreground border-line",
    "not-started": "bg-secondary text-muted-foreground border-line",
    "unavailable": "bg-secondary/40 text-muted-foreground border-line/10"
  }[goal.status];

  const trustColors = {
    "verified": "bg-brand-soft/20 text-brand border-brand/20",
    "partially-verified": "bg-sky/10 text-sky border-sky/20",
    "self-reported": "bg-secondary text-muted-foreground border-line",
    "simulated": "bg-secondary text-muted-foreground border-line border-dashed",
    "missing": "bg-secondary text-muted-foreground/50 border-line"
  }[goal.trustLevel];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line/50 p-4 bg-card/65 justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-foreground`}>
            <GoalCategoryIcon category={goal.category} />
          </span>
          <div>
            <h4 className="font-display text-sm font-bold text-foreground">{goal.title}</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{goal.description}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`pill text-[9px] font-bold uppercase ${statusColors}`}>
            {getGoalStatusLabel(goal.status)}
          </span>
          {showTrust && (
            <span className={`pill text-[9px] font-bold uppercase ${trustColors}`}>
              {getGoalTrustLabel(goal.trustLevel)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold">
          <span className="text-muted-foreground">Progress ({goal.progressPercent}%)</span>
          <span className="text-foreground">
            {goal.currentValue} / {goal.targetValue} <span className="text-muted-foreground">{goal.unit}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div 
            className="h-full rounded-full transition-all duration-500 bg-brand" 
            style={{ 
              width: `${goal.progressPercent}%`,
              backgroundColor: tone === "lime" ? "var(--lime)" : tone === "sky" ? "var(--sky)" : tone === "amber" ? "var(--amber)" : "var(--brand)"
            }} 
          />
        </div>
      </div>

      {showAction && goal.actionHref && goal.actionLabel && (
        <div className="pt-1 flex items-center justify-between border-t border-line/40 text-[11px]">
          <span className="text-muted-foreground italic truncate max-w-[70%]">{goal.explanation}</span>
          <Link href={goal.actionHref} className="btn btn-outline btn-xs font-bold leading-none inline-flex items-center gap-1">
            {goal.actionLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// 2. HealthyDaySummaryCard
export function HealthyDaySummaryCard({ summary }: { readonly summary: HealthyDaySummary }) {
  const completenessColors = summary.dataCompleteness >= 80 ? "text-brand" : "text-amber";

  return (
    <div className="card card-pad space-y-4 bg-gradient-to-br from-card to-secondary/30">
      <div className="flex items-center justify-between border-b border-line/45 pb-3">
        <div>
          <span className="pill bg-brand-soft text-brand text-[9px] font-bold uppercase tracking-wider">Alignment Indicator</span>
          <h3 className="font-display text-base font-bold text-foreground mt-1.5">Healthy Day Summary</h3>
        </div>
        <span className="pill bg-brand-soft text-brand font-bold capitalize">
          {getHealthyDayStatusLabel(summary.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Meaningful actions</p>
          <p className="text-lg font-extrabold text-foreground">{summary.meaningfulActionCount} / {summary.minimumActionCount}</p>
        </div>

        <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Data Completeness</p>
          <p className="text-lg font-extrabold text-foreground flex items-center gap-1">
            <span className={completenessColors}>{summary.dataCompleteness}%</span>
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed leading-normal bg-secondary/50 rounded-xl p-3 border border-line/30">
        {summary.explanation}
      </p>

      {summary.recoveryQualified && (
        <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 text-brand mt-0.5" />
          <p>Rest, sleep, and recovery qualify as meaningful wellness progress.</p>
        </div>
      )}
    </div>
  );
}

// 3. StreakSummaryCard
export function StreakSummaryCard({ summary }: { readonly summary: StreakSummary }) {
  return (
    <div className="card card-pad space-y-4">
      <div className="flex items-start justify-between border-b border-line/45 pb-3">
        <div>
          <span className="pill bg-amber/10 text-amber text-[9px] font-bold uppercase tracking-wider">Consistency Record</span>
          <h3 className="font-display text-base font-bold text-foreground mt-1.5">Consistency Streak</h3>
        </div>
        <span className="pill bg-amber/10 text-amber font-bold flex items-center gap-1 text-[11px]">
          <Flame className="h-3.5 w-3.5" /> {getStreakStatusLabel(summary.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Current Streak</p>
          <p className="text-lg font-extrabold text-brand flex items-center gap-1">
            <Flame className="h-5 w-5 text-brand" /> {summary.currentDays} Days
          </p>
        </div>

        <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Longest Streak</p>
          <p className="text-lg font-extrabold text-foreground">{summary.longestDays} Days</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed leading-normal bg-secondary/50 rounded-xl p-3 border border-line/30">
        {summary.explanation}
      </p>

      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        {summary.freezeAvailable && (
          <span className="pill bg-secondary/80 border border-line flex items-center gap-1">
            ❄️ 1 Streak Freeze Available
          </span>
        )}
        {summary.recoveryProtected && (
          <span className="pill bg-secondary/80 border border-line flex items-center gap-1">
            💤 Recovery Protected Active
          </span>
        )}
      </div>
    </div>
  );
}

// 4. ChallengePreviewCard
export function ChallengePreviewCard({ summary }: { readonly summary: ChallengeSummary }) {
  return (
    <div className="card card-pad space-y-4 border-line bg-card">
      <div className="flex items-start justify-between border-b border-line/45 pb-3">
        <div className="space-y-1">
          <span className="pill bg-amber/10 text-amber text-[9px] font-bold uppercase tracking-wider">Challenge Tracker</span>
          <h3 className="font-display text-base font-bold text-foreground mt-1">{summary.title}</h3>
        </div>
        <span className="pill bg-secondary text-muted-foreground font-semibold text-[10px]">
          {summary.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
          <span>Accumulated Challenge Progress</span>
          <span className="stat-num text-foreground">{summary.currentValue} / {summary.targetValue} {summary.unit} ({summary.progressPercent}%)</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-amber to-brand transition-all duration-500" 
            style={{ width: `${summary.progressPercent}%` }}
          />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground bg-secondary/35 p-3 rounded-xl border border-line/20 italic">
        * {summary.explanation}
      </p>

      {summary.actionHref && summary.actionLabel && (
        <div className="pt-1">
          <Link href={summary.actionHref} className="btn btn-outline w-full text-center text-sm font-semibold justify-center">
            {summary.actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}

// 5. RewardPreviewCard
export function RewardPreviewCard({ reward }: { readonly reward: GoalRewardPreview }) {
  return (
    <div className="card card-pad bg-gradient-to-br from-brand/5 to-secondary/35 border-brand/20 space-y-4">
      <div>
        <h4 className="text-xs text-brand font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Trophy className="h-4.5 w-4.5 text-brand" /> Potential reward after verified completion
        </h4>
        <p className="text-xs text-muted-foreground mt-1">Estimates based on current consistency targets</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Potential XP</p>
          <p className="text-lg font-extrabold text-foreground">+{reward.progressXp} XP</p>
        </div>

        <div className="rounded-xl border border-line bg-card/65 p-3.5 space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Potential HP Gain</p>
          <p className="text-lg font-extrabold text-brand">+{reward.hp} HP</p>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground italic leading-normal bg-secondary/40 rounded-xl p-2.5 border border-line/20">
        * {reward.explanation}
      </p>
    </div>
  );
}

// 6. HealthyDayHeatmap
interface HealthyDayHeatmapProps {
  readonly history: readonly HealthyDayHistoryPoint[];
}

export function HealthyDayHeatmap({ history }: HealthyDayHeatmapProps) {
  // 7 rows (Sunday - Saturday), 4 columns (Weeks)
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Arrange history into columns of weeks
  // Since we have exactly 28 points, we can divide it into 4 weeks of 7 days
  const weeks: HealthyDayHistoryPoint[][] = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(history.slice(i * 7, (i + 1) * 7));
  }

  const toneMap: Record<HealthyDayStatus, string> = {
    "achieved": "bg-brand hover:bg-brand/90 border-brand/20",
    "recovery-day": "bg-sky hover:bg-sky/90 border-sky/20",
    "forming": "bg-teal-500/40 hover:bg-teal-500/50 border-teal-500/10",
    "incomplete-data": "bg-secondary/70 hover:bg-secondary border-line"
  };

  return (
    <div className="card card-pad space-y-4">
      <div>
        <h3 className="font-display text-base font-bold text-foreground">28-Day Consistency Heatmap</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Reflecting daily consistency coordinates across activity and recovery days</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* Heatmap Grid */}
        <div className="grid grid-cols-5 gap-2 max-w-xs select-none">
          {/* Weekday labels Y axis */}
          <div className="grid grid-rows-7 gap-2 pr-2 text-right justify-end pt-1">
            {weekdays.map((d) => (
              <span key={d} className="text-[10px] text-muted-foreground font-semibold leading-[28px] h-7">{d}</span>
            ))}
          </div>

          {/* 4 week columns */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-2">
              {week.map((pt) => (
                <div
                  key={pt.date}
                  role="img"
                  aria-label={getHealthyDayAccessibleLabel(pt)}
                  className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all cursor-help relative group ${toneMap[pt.status]}`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-xl bg-card border border-line p-2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lift z-50 leading-normal">
                    <p className="font-bold text-foreground">{pt.date}</p>
                    <p className="mt-0.5 capitalize">{getHealthyDayStatusLabel(pt.status)}</p>
                    <p className="mt-0.5 italic">{pt.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend Panel */}
        <div className="flex-1 space-y-3 pt-2">
          <h4 className="font-display text-xs font-bold text-foreground">Legend</h4>
          <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-brand shrink-0" />
              <div>
                <p className="font-bold text-foreground">Healthy Day Achieved</p>
                <p className="text-[10px] text-muted-foreground">3+ contributing targets completed</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-sky shrink-0" />
              <div>
                <p className="font-bold text-foreground">Recovery Day</p>
                <p className="text-[10px] text-muted-foreground">Recovery qualified and rest targets met</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-teal-500/40 shrink-0" />
              <div>
                <p className="font-bold text-foreground">Still Forming</p>
                <p className="text-[10px] text-muted-foreground">Current day progress under evaluation</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-secondary border border-line shrink-0" />
              <div>
                <p className="font-bold text-foreground">More Data Needed</p>
                <p className="text-[10px] text-muted-foreground">Missing/partial logging index details</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 7. TodayJourneyCard
interface TodayJourneyCardProps {
  readonly journey: TodayJourney;
  readonly variant?: "hero" | "compact" | "detailed";
  readonly className?: string;
  readonly showGoalTrust?: boolean;
  readonly showHealthyDay?: boolean;
  readonly showStreak?: boolean;
  readonly showChallenge?: boolean;
  readonly showRewardPreview?: boolean;
  readonly maxGoals?: number;
}

export function TodayJourneyCard({
  journey,
  variant = "compact",
  className = "",
  showGoalTrust = false,
  showHealthyDay = true,
  showStreak = true,
  showChallenge = false,
  showRewardPreview = false,
  maxGoals = 3
}: TodayJourneyCardProps) {
  const isHero = variant === "hero";
  const isDetailed = variant === "detailed";

  const visibleGoals = journey.goals.slice(0, maxGoals);

  if (isHero) {
    return (
      <div className={`card card-pad space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Today’s Journey</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{journey.summary}</p>
          </div>
          <span className="stat-num text-xl font-extrabold text-brand">
            {journey.progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 overflow-hidden rounded-full bg-secondary">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-brand to-lime transition-all duration-500" 
            style={{ width: `${journey.progressPercent}%` }}
          />
        </div>

        {/* Goals lists */}
        <div className="space-y-2">
          {visibleGoals.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-xl border border-line/50 p-2.5 bg-card">
              <div>
                <p className="text-sm font-bold text-foreground">{g.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {g.currentValue} / {g.targetValue} {g.unit}
                </p>
              </div>
              <span className={`pill text-[9px] font-bold uppercase ${
                g.status === "completed" ? "bg-lime/10 text-lime border-lime/20" : "bg-brand-soft/30 text-brand border-brand/20"
              }`}>
                {getGoalStatusLabel(g.status)}
              </span>
            </div>
          ))}
        </div>

        {/* Dynamic Streak + Healthy Day summaries */}
        <div className="grid grid-cols-2 gap-3 border-t border-line/50 pt-4 text-xs">
          {showHealthyDay && (
            <div className="rounded-xl bg-secondary/40 p-2.5 border border-line/20 flex flex-col justify-between">
              <p className="text-[10px] text-muted-foreground font-semibold">Healthy Day</p>
              <p className="text-xs font-bold text-foreground mt-1 capitalize">{getHealthyDayStatusLabel(journey.healthyDay.status)}</p>
            </div>
          )}
          {showStreak && (
            <div className="rounded-xl bg-secondary/40 p-2.5 border border-line/20 flex flex-col justify-between">
              <p className="text-[10px] text-muted-foreground font-semibold">Streak Konsistensi</p>
              <p className="text-xs font-bold text-brand mt-1 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> {journey.streak.currentDays} Hari
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col gap-2 sm:flex-row">
          <Link href="/todays-journey" className="btn btn-outline flex-1 text-center text-sm font-semibold justify-center">
            Lanjutkan Journey
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`card card-pad flex flex-col justify-between space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold">Today’s Pacing</h3>
          <span className="stat-num text-sm text-brand font-bold">{journey.completedGoalCount} / {journey.totalGoalCount} Completed</span>
        </div>

        <div className="space-y-2">
          {visibleGoals.slice(0, 2).map((g) => (
            <div key={g.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">{g.title}</span>
              <span className="font-semibold text-foreground">{g.currentValue} / {g.targetValue} {g.unit}</span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-line/45 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Healthy Day: {getHealthyDayStatusLabel(journey.healthyDay.status)}</span>
          <Link href="/todays-journey" className="btn btn-outline btn-xs inline-flex items-center gap-1 text-xs">
            Detail <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  // Detailed Variant for /todays-journey
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="card card-pad space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold">Progress Dashboard</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{journey.summary}</p>
          </div>
          <span className="stat-num text-2xl font-extrabold text-brand">
            {journey.progressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 overflow-hidden rounded-full bg-secondary">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-brand to-lime transition-all duration-500" 
            style={{ width: `${journey.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Goal items list sorted by priority */}
      <div className="space-y-3.5">
        <h3 className="font-display text-sm font-bold text-foreground">Four Daily targets</h3>
        <div className="grid gap-3.5">
          {journey.goals.map((g) => (
            <GoalProgressRow key={g.id} goal={g} showTrust={showGoalTrust} showAction={isDetailed} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Healthy Day Card */}
        {showHealthyDay && <HealthyDaySummaryCard summary={journey.healthyDay} />}

        {/* Streak Card */}
        {showStreak && <StreakSummaryCard summary={journey.streak} />}
      </div>

      {/* Active Challenge widgets */}
      {showChallenge && (
        <ChallengePreviewCard summary={journey.challengeSummary} />
      )}

      {/* Reward Preview Card */}
      {showRewardPreview && (
        <RewardPreviewCard reward={journey.rewardPreview} />
      )}
    </div>
  );
}
