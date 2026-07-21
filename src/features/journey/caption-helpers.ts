// Caption helper utilities — server-safe (no "use client").
// These run in Server Components and Client Components alike.

import { HealthStoryCaptionDraft, HealthStoryCaptionMode } from "./caption-types";

export const CAPTION_MAX_LENGTH = 180;
export const CAPTION_STORAGE_KEY = "nv-health-story-caption-drafts-v1";
export const CAPTION_VERSION = "1.0.0";

// Default template caption (Indonesian, aligns with product language).
export const DEFAULT_TEMPLATE_CAPTION =
  "Tindakan kecil mulai menjadi bagian dari Journey-mu.";

// Strip control characters and HTML from user-supplied caption text.
// Does NOT allow Markdown rendering or script injection.
export function sanitizeCaptionText(raw: string): string {
  // 1. Trim surrounding whitespace
  let s = raw.trim();
  // 2. Collapse repeated internal spaces
  s = s.replace(/[ \t]{2,}/g, " ");
  // 3. Strip HTML tags
  s = s.replace(/<[^>]*>/g, "");
  // 4. Strip control characters (except normal newline)
  s = s.replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
  return s;
}

// Resolve the effective caption text from a draft.
// Returns null when mode is "none" or when mode is "custom" with empty text
// (treat empty custom as "no caption" per spec).
export function getEffectiveCaptionText(
  draft: HealthStoryCaptionDraft
): string | null {
  if (draft.mode === "none") return null;
  if (draft.mode === "template") return draft.templateText || DEFAULT_TEMPLATE_CAPTION;
  // custom
  const trimmed = sanitizeCaptionText(draft.customText);
  if (!trimmed) return null;
  return trimmed.slice(0, CAPTION_MAX_LENGTH);
}

// Create a default draft for a journey ID.
export function createDefaultCaptionDraft(
  journeyId: string,
  templateText = DEFAULT_TEMPLATE_CAPTION
): HealthStoryCaptionDraft {
  return {
    journeyId,
    mode: "template",
    customText: "",
    templateText,
    version: CAPTION_VERSION,
  };
}

// Safe localStorage load — tolerates corrupted or missing storage.
export function loadCaptionDraft(journeyId: string): HealthStoryCaptionDraft {
  const fallback = createDefaultCaptionDraft(journeyId);
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(CAPTION_STORAGE_KEY);
    if (!raw) return fallback;
    const map = JSON.parse(raw) as Record<string, unknown>;
    const entry = map[journeyId];
    if (!entry || typeof entry !== "object") return fallback;
    const e = entry as Record<string, unknown>;
    const mode = (e.mode as HealthStoryCaptionMode) ?? "template";
    return {
      journeyId,
      mode: ["template", "custom", "none"].includes(mode) ? mode : "template",
      customText: typeof e.customText === "string" ? e.customText : "",
      templateText:
        typeof e.templateText === "string"
          ? e.templateText
          : DEFAULT_TEMPLATE_CAPTION,
      updatedAt: typeof e.updatedAt === "string" ? e.updatedAt : undefined,
      version: CAPTION_VERSION,
    };
  } catch {
    return fallback;
  }
}

// Safe localStorage save.
export function saveCaptionDraft(
  journeyId: string,
  draft: HealthStoryCaptionDraft
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CAPTION_STORAGE_KEY);
    const map: Record<string, unknown> = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    map[journeyId] = { ...draft, updatedAt: new Date().toISOString() };
    localStorage.setItem(CAPTION_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors (private mode, quota exceeded, etc.)
  }
}
