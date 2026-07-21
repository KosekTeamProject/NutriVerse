"use client";

import { useState } from "react";
import { Share2, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { HealthStoryDisplayData, HealthStoryFormat } from "../types";
import { sanitizeHealthStoryFilename } from "../helpers";

interface HealthStoryActionsProps {
  readonly data: HealthStoryDisplayData;
  readonly format: HealthStoryFormat;
  readonly effectiveCaption?: string | null;
}

export function HealthStoryActions({ data, format, effectiveCaption }: HealthStoryActionsProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isBlocked = !data.shareEligible;

  // Offscreen Canvas Drawing function
  async function generateCanvasBlob(): Promise<{ blob: Blob; url: string }> {
    const isVertical = format === "vertical";
    const width = 1080;
    const height = isVertical ? 1920 : 1080;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not acquire 2D canvas context");

    // 1. Draw Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#06130e");
    bgGrad.addColorStop(0.5, "#0b1b15");
    bgGrad.addColorStop(1, "#081410");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Subtle Radial Accent (Blur light)
    const radGrad = ctx.createRadialGradient(width * 0.8, height * 0.1, 50, width * 0.8, height * 0.1, 600);
    radGrad.addColorStop(0, "rgba(16, 185, 129, 0.18)");
    radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, width, height);

    // 3. Draw Grid Dots
    ctx.fillStyle = "rgba(16, 185, 129, 0.05)";
    for (let x = 40; x < width; x += 60) {
      for (let y = 40; y < height; y += 60) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // 4. Draw Header Section (Logo + Day Context)
    const pad = 90;
    const headerY = isVertical ? 150 : 130;

    // Draw Leaf Logo Symbol
    const logoSize = 48;
    const logoX = pad;
    const logoY = headerY - logoSize / 2 - 10;
    
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.roundRect(logoX, logoY, logoSize, logoSize, 14);
    ctx.fill();

    // Leaf Icon symbol (a simple vector shape inside the box)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(logoX + 14, logoY + 34);
    ctx.bezierCurveTo(logoX + 14, logoY + 18, logoX + 34, logoY + 14, logoX + 34, logoY + 14);
    ctx.bezierCurveTo(logoX + 34, logoY + 30, logoX + 14, logoY + 34, logoX + 14, logoY + 34);
    ctx.moveTo(logoX + 14, logoY + 34);
    ctx.lineTo(logoX + 26, logoY + 22);
    ctx.stroke();

    // Logo Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Nutri", logoX + 66, headerY + 6);
    ctx.fillStyle = "#10b981";
    ctx.fillText("Verse", logoX + 158, headerY + 6);

    // Consistency Day (Top Right)
    ctx.fillStyle = "#96aa9e";
    ctx.font = "bold 26px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(data.consistencyLabel, width - pad, headerY + 4);

    // Header Divider Line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, headerY + 50);
    ctx.lineTo(width - pad, headerY + 50);
    ctx.stroke();

    // 5. Category Pill & Title
    const contentY = isVertical ? 500 : 320;
    
    // Category pill
    ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
    ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pad, contentY, 260, 50, 25);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#34d399";
    ctx.font = "bold 22px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(data.categoryLabel.toUpperCase(), pad + 130, contentY + 33);

    // Main Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "extrabold 72px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(data.title, pad, contentY + 150);

    // Subtitle
    ctx.fillStyle = "#96aa9e";
    ctx.font = "500 28px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(data.subtitle, pad, contentY + 210);

    // 6. Stats Dashboard Box
    const boxY = contentY + 280;
    const boxH = 200;
    ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pad, boxY, width - 2 * pad, boxH, 24);
    ctx.fill();
    ctx.stroke();

    // Pulse stats inside the box
    const boxMiddle = boxY + boxH / 2;
    ctx.fillStyle = "#96aa9e";
    ctx.font = "bold 24px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("HEALTH PULSE", pad + 40, boxMiddle + 8);

    // Pulse before & after numbers
    if (data.healthPulseAfter !== undefined && data.healthPulseBefore !== undefined) {
      ctx.textAlign = "right";
      ctx.fillStyle = "#96aa9e";
      ctx.font = "normal 26px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.fillText(data.healthPulseBefore.toFixed(1), width - pad - 230, boxMiddle + 8);
      
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 30px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.fillText("→", width - pad - 180, boxMiddle + 8);
      
      ctx.fillStyle = "#10b981";
      ctx.font = "extrabold 32px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.fillText(data.healthPulseAfter.toFixed(1), width - pad - 90, boxMiddle + 8);
      
      ctx.font = "bold 24px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.fillText(`(+${data.healthPulseChange?.toFixed(1)})`, width - pad - 40, boxMiddle + 8);
    }

    // Secondary metric box
    const secondBoxY = boxY + boxH + 30;
    const secondBoxH = 120;
    ctx.fillStyle = "rgba(255, 255, 255, 0.01)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.roundRect(pad, secondBoxY, width - 2 * pad, secondBoxH, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#96aa9e";
    ctx.font = "bold 22px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(data.primaryMetricLabel.toUpperCase(), pad + 30, secondBoxY + secondBoxH / 2 + 7);

    ctx.fillStyle = "#ffffff";
    ctx.font = "extrabold 30px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(data.primaryMetricValue, width - pad - 30, secondBoxY + secondBoxH / 2 + 9);

    // 7. Caption / Reflection
    const quoteY = secondBoxY + secondBoxH + 60;
    // Resolve caption: effectiveCaption prop takes precedence over safeReflection
    const captionSource =
      effectiveCaption !== undefined
        ? effectiveCaption
        : data.safeReflection ?? null;
    if (captionSource) {
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(pad, quoteY);
      ctx.lineTo(pad, quoteY + 90);
      ctx.stroke();

      ctx.fillStyle = "#e8f0eb";
      ctx.font = "italic 26px 'Plus Jakarta Sans', system-ui, sans-serif";
      ctx.textAlign = "left";
      const quoteText = `"${captionSource}"`;

      // Simple text wrapping
      const maxLineChars = 55;
      if (quoteText.length > maxLineChars) {
        const splitIndex = quoteText.lastIndexOf(" ", maxLineChars);
        const line1 = quoteText.substring(0, splitIndex > 0 ? splitIndex : maxLineChars);
        const line2 = quoteText.substring(splitIndex > 0 ? splitIndex + 1 : maxLineChars);
        const line3 = line2.length > maxLineChars
          ? line2.substring(0, maxLineChars - 3) + "…"
          : line2;
        ctx.fillText(line1, pad + 25, quoteY + 35);
        ctx.fillText(line3, pad + 25, quoteY + 75);
      } else {
        ctx.fillText(quoteText, pad + 25, quoteY + 50);
      }
    }

    // 8. Footer Section
    const footerY = isVertical ? 1750 : 960;
    
    // Divider
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, footerY);
    ctx.lineTo(width - pad, footerY);
    ctx.stroke();

    // Traveler Display & Date
    ctx.fillStyle = "#96aa9e";
    ctx.font = "bold 24px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`By ${data.travelerDisplayName}`, pad, footerY + 50);
    
    ctx.textAlign = "right";
    ctx.font = "normal 22px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.fillText(data.dateLabel, width - pad, footerY + 50);

    // Core validation standard label
    const indicatorY = footerY + 90;
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.roundRect(width / 2 - 250, indicatorY, 500, 50, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#96aa9e";
    ctx.font = "600 18px 'Plus Jakarta Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("COMPETITIVE HEALTH PROGRESSION SYSTEM", width / 2, indicatorY + 31);

    // Convert offscreen canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) {
          const url = URL.createObjectURL(b);
          resolve({ blob: b, url });
        } else {
          reject(new Error("Canvas blob extraction returned empty"));
        }
      }, "image/png");
    });
  }

  // Unified execution trigger (Share or Download fallback)
  async function handleShareOrDownload() {
    if (isBlocked) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const { blob, url } = await generateCanvasBlob();
      const filename = sanitizeHealthStoryFilename(data.title);

      // Check for Web Share capabilities
      const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;
      const testFile = new File([blob], filename, { type: "image/png" });

      if (hasNativeShare && navigator.canShare && navigator.canShare({ files: [testFile] })) {
        try {
          await navigator.share({
            files: [testFile],
            title: `NutriVerse Health Story - ${data.title}`,
            text: `Here is my Health Story progress for ${data.title} on NutriVerse!`
          });
          setStatus("success");
          URL.revokeObjectURL(url);
          return;
        } catch (shareErr) {
          // If traveler cancelled the share flow, reset state gracefully without downloading or error
          if (shareErr instanceof DOMException && shareErr.name === "AbortError") {
            setStatus("idle");
            URL.revokeObjectURL(url);
            return;
          }
          // Other unexpected share errors fall back to automatic download
        }
      }

      // Fallback: Programmatic download trigger
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatus("success");
      // Delay revoking URL to let download complete
      setTimeout(() => URL.revokeObjectURL(url), 100);

    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Internal rendering error");
    }
  }

  return (
    <div className="space-y-3.5 w-full">
      {status === "error" && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="font-bold">We could not prepare the image. Please try again.</p>
            <p className="text-xs text-destructive/80 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-brand/20 bg-brand-soft/20 p-4 text-sm text-brand">
          <CheckCircle className="h-5 w-5 shrink-0 text-brand" />
          <p className="font-bold">Health Story is ready.</p>
        </div>
      )}

      <button
        onClick={handleShareOrDownload}
        disabled={isBlocked || status === "loading"}
        className={`btn w-full btn-lg flex items-center justify-center gap-2 ${
          isBlocked 
            ? "btn-outline opacity-40 cursor-not-allowed" 
            : "btn-primary"
        }`}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Preparing your Health Story…
          </>
        ) : (
          <>
            <Share2 className="h-5 w-5" /> Share Health Story
          </>
        )}
      </button>
      
      {isBlocked && (
        <p className="text-xs text-muted-foreground text-center italic leading-relaxed">
          * This Journey is not eligible for public sharing ({data.blockedReasons.join(" ")}).
        </p>
      )}
    </div>
  );
}
