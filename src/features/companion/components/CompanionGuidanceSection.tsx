"use client";

import { CompanionInsight } from "../types";
import { CompanionCard } from "./CompanionComponents";
import { useCompanionName } from "@/hooks/useCompanionName";

interface CompanionGuidanceSectionProps {
  readonly insight: CompanionInsight;
  readonly type?: "guidance" | "reflection" | "interpretation";
  readonly variant?: "hero" | "compact" | "reflection";
  readonly showPriority?: boolean;
  readonly showExplanation?: boolean;
}

export function CompanionGuidanceSection({
  insight,
  type = "guidance",
  variant = "compact",
  showPriority = false,
  showExplanation = false,
}: CompanionGuidanceSectionProps) {
  const { displayName } = useCompanionName();

  const titleText = {
    guidance: `Panduan dari ${displayName}`,
    reflection: `Refleksi dari ${displayName}`,
    interpretation: `Interpretasi dari ${displayName}`,
  }[type];

  return (
    <div className="space-y-3">
      <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {titleText}
      </h3>
      <CompanionCard
        insight={insight}
        variant={variant}
        showExplanation={showExplanation}
        showPriority={showPriority}
      />
    </div>
  );
}
