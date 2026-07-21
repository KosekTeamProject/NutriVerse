// Health Story Caption presentation types.
// Caption data is separate from the canonical JourneyRecord.
// Changing a caption never modifies journey.reflection, journey.meaning,
// journey.summary, or any other source domain.

export type HealthStoryCaptionMode = "template" | "custom" | "none";

export interface HealthStoryCaptionDraft {
  readonly journeyId: string;
  readonly mode: HealthStoryCaptionMode;
  readonly customText: string;
  readonly templateText: string;
  readonly updatedAt?: string;
  readonly version: string;
}
