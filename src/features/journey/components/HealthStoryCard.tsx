"use client";

import { Leaf, Flame, ShieldCheck } from "lucide-react";
import { HealthStoryDisplayData } from "../types";

interface HealthStoryCardProps {
  readonly data: HealthStoryDisplayData;
  readonly format: "square" | "vertical";
  readonly className?: string;
  readonly containerRef?: React.RefObject<HTMLDivElement | null>;
  readonly effectiveCaption?: string | null;
}

export function HealthStoryCard({ data, format, className = "", containerRef, effectiveCaption }: HealthStoryCardProps) {
  const isVertical = format === "vertical";

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden bg-gradient-to-br from-[#07140f] via-[#0f1f18] to-[#0a1711] text-[#e8f0eb] border border-[#162e24] shadow-lift transition-all duration-300 rounded-3xl ${
        isVertical ? "aspect-[9/16] w-full max-w-[340px] p-4 min-[380px]:p-6 sm:p-8 flex flex-col justify-between" : "aspect-square w-full max-w-[380px] p-4 min-[380px]:p-5 sm:p-6 flex flex-col justify-between"
      } ${className}`}
      data-story-format={format}
    >
      {/* Decorative Grid Dots background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:16px_16px] opacity-75" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-lime/5 blur-3xl" />

      {/* Top Branding Section */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand to-lime text-white shadow-sm">
            <Leaf className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xs font-extrabold tracking-tight">
            Nutri<span className="text-brand-bright">Verse</span>
          </span>
        </div>
        <div className="text-right text-[10px] text-[#96aa9e] font-medium uppercase tracking-wider">
          {data.consistencyLabel}
        </div>
      </div>

      {/* Center Details Section */}
      <div className={`space-y-4 my-auto ${isVertical ? "py-8" : "py-3"}`}>
        <div className="space-y-1">
          <span className="inline-block rounded-full bg-brand-soft/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-bright border border-brand/20">
            {data.categoryLabel}
          </span>
          <h2 className={`font-display font-extrabold leading-tight tracking-tight text-white ${isVertical ? "text-3xl" : "text-2xl"}`}>
            {data.title}
          </h2>
          <p className="text-[11px] text-[#96aa9e]">{data.subtitle}</p>
        </div>

        {/* Pulse / Metric displays inside a card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2.5">
          {data.healthPulseAfter !== undefined && data.healthPulseBefore !== undefined && (
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-semibold text-[#96aa9e] uppercase tracking-wider">Health Pulse</span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="text-[#96aa9e] font-normal line-through">{data.healthPulseBefore.toFixed(1)}</span>
                <span className="text-brand-bright">&rarr;</span>
                <span className="text-brand-bright font-extrabold">{data.healthPulseAfter.toFixed(1)}</span>
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#96aa9e] uppercase tracking-wider">
              {data.primaryMetricLabel || "Progress"}
            </span>
            <span className="text-sm font-extrabold text-white flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber" /> {data.primaryMetricValue}
            </span>
          </div>
        </div>

        {/* Caption / Reflection — caption prop takes precedence */}
        {(() => {
          const displayText = effectiveCaption !== undefined
            ? effectiveCaption
            : data.safeReflection ?? null;
          if (!displayText) return null;
          return (
            <div className="border-l-2 border-brand-bright/40 pl-3 italic text-xs text-[#b8c6be] leading-relaxed">
              &ldquo;{displayText}&rdquo;
            </div>
          );
        })()}
      </div>

      {/* Bottom Footer Section */}
      <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between text-[10px] text-[#96aa9e]">
          <span className="font-semibold">By {data.travelerDisplayName}</span>
          <span className="font-mono text-[9px]">{data.dateLabel}</span>
        </div>
        
        <div className="flex items-center gap-1.5 justify-center rounded-lg bg-white/[0.03] p-1.5 text-[9px] text-[#96aa9e] border border-white/5">
          <ShieldCheck className="h-3 w-3 text-brand-bright" />
          <span>Competitive Health Progression System</span>
        </div>
      </div>
    </div>
  );
}
