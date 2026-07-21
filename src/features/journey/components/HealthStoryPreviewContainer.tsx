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
    <div className="card card-pad border-brand/20 bg-gradient-to-br from-brand/[0.02] to-secondary/35 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line/40 pb-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-brand" /> Health Story Preview
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Visualisasikan progres Journey Anda untuk dibagikan</p>
        </div>
        
        {/* Format selectors */}
        {displayData.shareEligible && (
          <div className="inline-flex rounded-full bg-secondary p-1 shrink-0 self-start sm:self-center">
            <button
              onClick={() => setFormat("square")}
              className={`rounded-full px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5 transition ${
                format === "square" ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid className="h-3.5 w-3.5" /> Square (1:1)
            </button>
            <button
              onClick={() => setFormat("vertical")}
              className={`rounded-full px-3 py-1 text-xs font-bold inline-flex items-center gap-1.5 transition ${
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
        <div className="flex-1 flex justify-center items-center py-4 bg-secondary/20 rounded-2xl border border-line/50 p-6 min-h-[400px]">
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

