"use client";

import { useEffect, useCallback, useState, startTransition } from "react";
import {
  HealthStoryCaptionDraft,
  HealthStoryCaptionMode,
} from "../caption-types";
import {
  CAPTION_MAX_LENGTH,
  DEFAULT_TEMPLATE_CAPTION,
  createDefaultCaptionDraft,
  getEffectiveCaptionText,
  loadCaptionDraft,
  sanitizeCaptionText,
  saveCaptionDraft,
} from "../caption-helpers";

const EXPORT_SAFE_THRESHOLD = 140; // characters above which we warn about export clipping risk

interface HealthStoryCaptionEditorProps {
  readonly journeyId: string;
  readonly onCaptionChange: (effectiveCaption: string | null) => void;
}

export function HealthStoryCaptionEditor({
  journeyId,
  onCaptionChange,
}: HealthStoryCaptionEditorProps) {
  const [draft, setDraft] = useState<HealthStoryCaptionDraft>(() =>
    createDefaultCaptionDraft(journeyId)
  );

  // Load saved draft on mount — wrap in startTransition to avoid cascading render lint
  useEffect(() => {
    const saved = loadCaptionDraft(journeyId);
    startTransition(() => {
      setDraft(saved);
      onCaptionChange(getEffectiveCaptionText(saved));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId]);

  const updateDraft = useCallback(
    (next: HealthStoryCaptionDraft) => {
      setDraft(next);
      saveCaptionDraft(journeyId, next);
      onCaptionChange(getEffectiveCaptionText(next));
    },
    [journeyId, onCaptionChange]
  );

  const setMode = (mode: HealthStoryCaptionMode) => {
    updateDraft({ ...draft, mode });
  };

  const setCustomText = (raw: string) => {
    const text = raw.slice(0, CAPTION_MAX_LENGTH);
    updateDraft({ ...draft, customText: text });
  };

  const resetToTemplate = () => {
    updateDraft({
      ...draft,
      mode: "template",
      customText: "",
      templateText: DEFAULT_TEMPLATE_CAPTION,
    });
  };

  const charCount = sanitizeCaptionText(draft.customText).length;
  const isNearLimit = charCount > EXPORT_SAFE_THRESHOLD;
  const isAtLimit = charCount >= CAPTION_MAX_LENGTH;

  const modes: { value: HealthStoryCaptionMode; label: string }[] = [
    { value: "template", label: "Gunakan Template" },
    { value: "custom", label: "Tulis Caption" },
    { value: "none", label: "Tanpa Caption" },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-line/50 bg-secondary/20 p-4">
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
          Caption Health Story
        </p>

        {/* Mode selector */}
        <div className="inline-flex flex-wrap gap-1.5">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              aria-pressed={draft.mode === m.value}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                draft.mode === m.value
                  ? "bg-brand text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom caption textarea */}
      {draft.mode === "custom" && (
        <div className="space-y-1.5">
          <label
            htmlFor="caption-editor-textarea"
            className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Teks Caption
          </label>
          <textarea
            id="caption-editor-textarea"
            value={draft.customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={3}
            maxLength={CAPTION_MAX_LENGTH}
            placeholder="Ceritakan makna singkat dari aktivitas ini…"
            aria-describedby="caption-char-counter caption-helper-text"
            className="input resize-none w-full text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between gap-2">
            <p
              id="caption-char-counter"
              aria-live="polite"
              aria-atomic="true"
              className={`text-[10px] font-semibold tabular-nums ${
                isAtLimit
                  ? "text-destructive"
                  : isNearLimit
                  ? "text-amber"
                  : "text-muted-foreground"
              }`}
            >
              {charCount} / {CAPTION_MAX_LENGTH}
            </p>
            {isNearLimit && (
              <p className="text-[10px] text-amber leading-tight">
                ⚠ Teks mungkin terpotong dalam ekspor.
              </p>
            )}
          </div>
          <p
            id="caption-helper-text"
            className="text-[10px] text-muted-foreground leading-relaxed"
          >
            Caption akan tampil pada Health Story yang diekspor, tetapi tidak
            mengubah catatan Journey aslinya.
          </p>
        </div>
      )}

      {/* Template preview */}
      {draft.mode === "template" && (
        <div className="rounded-xl border border-brand/15 bg-brand/[0.04] px-3 py-2">
          <p className="text-xs text-brand-bright italic leading-relaxed">
            &ldquo;{draft.templateText || DEFAULT_TEMPLATE_CAPTION}&rdquo;
          </p>
          <button
            onClick={resetToTemplate}
            className="mt-1 text-[10px] text-muted-foreground underline hover:text-foreground"
          >
            Kembalikan ke template bawaan
          </button>
        </div>
      )}

      {/* None mode hint */}
      {draft.mode === "none" && (
        <p className="text-[10px] text-muted-foreground italic">
          Health Story akan diekspor tanpa caption.
        </p>
      )}
    </div>
  );
}
