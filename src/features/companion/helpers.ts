import { CompanionInsight, CompanionInsightType, CompanionTone, CompanionPriority, CompanionSurface, CompanionWeeklyLetter } from "./types";
import { companionInsights, currentWeeklyLetter } from "./data";

export function getCompanionInsightTypeLabel(type: CompanionInsightType): string {
  switch (type) {
    case "morning-brief": return "Morning Brief";
    case "activity-reflection": return "Activity Reflection";
    case "nutrition-insight": return "Nutrition Insight";
    case "recovery-insight": return "Recovery Insight";
    case "consistency-insight": return "Consistency Insight";
    case "journey-reflection": return "Journey Reflection";
    case "health-pulse-interpretation": return "Health Pulse Interpretation";
    case "challenge-guidance": return "Challenge Guidance";
    case "weekly-letter": return "Weekly Letter";
    case "monthly-reflection": return "Monthly Reflection";
    case "general-guidance": return "General Guidance";
    case "safety-reminder": return "Safety Reminder";
    default: return type;
  }
}

export function getCompanionToneLabel(tone: CompanionTone): string {
  switch (tone) {
    case "encouraging": return "Encouraging";
    case "calm": return "Calm";
    case "reflective": return "Reflective";
    case "informative": return "Informative";
    case "celebratory": return "Celebratory";
    case "recovery-focused": return "Recovery-focused";
    case "cautious": return "Cautious";
    default: return tone;
  }
}

export function getCompanionPriorityLabel(priority: CompanionPriority): string {
  switch (priority) {
    case "low": return "Low";
    case "normal": return "Normal";
    case "high": return "High";
    case "safety": return "Safety";
    default: return priority;
  }
}

export function getCompanionInsightsForSurface(surface: CompanionSurface): readonly CompanionInsight[] {
  return companionInsights.filter((ins) => ins.status === "active" && ins.surfaces.includes(surface));
}

export function getPrimaryCompanionInsight(surface: CompanionSurface): CompanionInsight | undefined {
  const active = getCompanionInsightsForSurface(surface);
  if (active.length === 0) return undefined;

  // On Home screen: Morning Brief must win unless there's a safety priority insight
  if (surface === "home") {
    const safety = active.find((ins) => ins.priority === "safety");
    if (safety) return safety;
    const morningBrief = active.find((ins) => ins.type === "morning-brief");
    if (morningBrief) return morningBrief;
  }

  // Priority sorting: safety > high > normal > low, then newest occurredAt first
  const sorted = [...active].sort((a, b) => {
    const pVal = { safety: 4, high: 3, normal: 2, low: 1 };
    const pDiff = pVal[b.priority] - pVal[a.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });

  return sorted[0];
}

export function getRecentCompanionInsights(
  surface: CompanionSurface,
  excludeHeroId?: string
): readonly CompanionInsight[] {
  const active = getCompanionInsightsForSurface(surface);
  
  // Filter out expired, dismissed, and the primary hero item if provided
  const filtered = active.filter((ins) => ins.id !== excludeHeroId);

  // Sort newest first
  return [...filtered].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export function isCompanionInsightActive(insight: CompanionInsight): boolean {
  return insight.status === "active";
}

export function getCompanionFallbackCopy(surface: CompanionSurface, companionName = "Nora"): { title: string; message: string } {
  switch (surface) {
    case "home":
      return {
        title: `${companionName} is still learning from today’s Journey.`,
        message: "Complete a healthy action and a helpful reflection will appear here."
      };
    case "health-pulse":
      return {
        title: `${companionName} is still preparing an interpretation.`,
        message: "We need more historical pulse entries to provide dynamic insights."
      };
    case "journey":
      return {
        title: `${companionName} is still learning from your Journey.`,
        message: "Keep moving consistently, and logs will form here."
      };
    default:
      return {
        title: "Your reflection is still forming.",
        message: "Check back later as you log more progress parameters."
      };
  }
}

export function getCompanionSourceLabels(insight: CompanionInsight): string {
  if (insight.sourceReference?.title) {
    return `Source: ${insight.sourceReference.title}`;
  }
  return "";
}

export function getWeeklyLetterById(id: string): CompanionWeeklyLetter | undefined {
  if (id === "weekly-letter-current") return currentWeeklyLetter;
  return undefined;
}
