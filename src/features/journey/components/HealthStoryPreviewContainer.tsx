"use client";

import { useState, useCallback } from "react";
import { Sparkles, Layout, Grid } from "lucide-react";
import { HealthStoryDisplayData, HealthStoryFormat } from "../types";
import { HealthStoryCard } from "./HealthStoryCard";
import { HealthStoryActions } from "./HealthStoryActions";
import { HealthStoryCaptionEditor } from "./HealthStoryCaptionEditor";

interface HealthStoryPreviewContainerProps {
  readonly displayData: HealthStoryDisplayData;
  readonly journeyId?: string;
}

export function HealthStoryPreviewContainer({ displayData, journeyId = "journey-default" }: HealthStoryPreviewContainerProps) {
  const [format, setFormat] = useState<HealthStoryFormat>("square");
  const [effectiveCaption, setEffectiveCaption] = useState<string | null>(null);

  const handleCaptionChange = useCallback((caption: string | null) => {
    setEffectiveCaption(caption);
  }, []);

  return (
    <div className="card card-pad min-w-0 border-brand/20 bg-gradient-to-br from-brand/[0.02] to-secondary/35 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/40 pb-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-brand" /> Health Story Preview
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Visualisasikan progres Journey Anda untuk dibagikan</p>
        </div>
        
        {/* Format selectors */}
        {displayData.shareEligible && (
          <div className="grid w-full grid-cols-1 gap-1 rounded-2xl bg-secondary p-1 min-[380px]:grid-cols-2 sm:w-auto sm:shrink-0 sm:rounded-full">
            <button
              onClick={() => setFormat("square")}
              className={`justify-center rounded-full px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5 transition ${
                format === "square" ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid className="h-3.5 w-3.5" /> Square (1:1)
            </button>
            <button
              onClick={() => setFormat("vertical")}
              className={`justify-center rounded-full px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5 transition ${
                format === "vertical" ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layout className="h-3.5 w-3.5" /> Vertical (9:16)
            </button>
          </div>
        )}
      </div>

      {/* Caption Customization Editor */}
      {displayData.shareEligible && (
        <HealthStoryCaptionEditor
          journeyId={journeyId}
          onCaptionChange={handleCaptionChange}
        />
      )}

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:justify-center">
        {/* Canvas Visual Card Preview */}
        <div className="flex min-h-[320px] min-w-0 flex-1 items-center justify-center rounded-2xl border border-line/50 bg-secondary/20 p-3 py-4 sm:min-h-[400px] sm:p-6">
          <HealthStoryCard data={displayData} format={format} effectiveCaption={effectiveCaption} />
        </div>

        {/* Action controllers and descriptions */}
        <div className="w-full lg:w-[320px] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h4 className="font-display text-sm font-bold text-foreground">Standar Berbagi Aman</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Format ekspor disesuaikan persis ke ukuran <span className="font-semibold">1080×1080px</span> (Square) atau <span className="font-semibold">1080×1920px</span> (Vertical).
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hanya pencapaian tervalidasi, label kategori, caption pilihan, dan metrik publik yang disertakan pada gambar. Peta privat dan data sensitif tetap terlindungi.
            </p>
          </div>

          <HealthStoryActions data={displayData} format={format} effectiveCaption={effectiveCaption} />
        </div>
      </div>
    </div>
  );
}

