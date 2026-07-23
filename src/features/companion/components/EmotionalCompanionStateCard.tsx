"use client";

import { Sparkles, Heart, RefreshCw, Sun, CheckCircle2, Award, Lightbulb } from "lucide-react";
import { useCompanionName } from "@/hooks/useCompanionName";

export type CompanionStateType = "empty" | "success" | "recovery" | "contextual-tip";

export type EmotionalCompanionStateCardProps = {
  readonly state: CompanionStateType;
  readonly title?: string;
  readonly message?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly className?: string;
};

export function EmotionalCompanionStateCard({
  state,
  title,
  message,
  actionLabel,
  onAction,
  className = ""
}: EmotionalCompanionStateCardProps) {
  const { displayName } = useCompanionName();

  const getConfig = () => {
    switch (state) {
      case "empty":
        return {
          icon: Sun,
          badge: "Awal Langkah Sehat",
          defaultTitle: `Mulai Bersama ${displayName}`,
          defaultMessage: "Belum ada catatan hari ini? Tidak apa-apa, perjalanan sehatmu bukan tentang kesempurnaan. Mari mulai dari satu langkah kecil.",
          accentClass: "border-brand/20 bg-gradient-to-br from-card via-card to-brand-soft/20 text-brand"
        };

      case "success":
        return {
          icon: CheckCircle2,
          badge: "Perayaan Progres 🎉",
          defaultTitle: "Langkah Kecil yang Luar Biasa!",
          defaultMessage: "Hebat! Kamu telah menyelesaikan kebiasaan sehat hari ini. Setiap konsistensi kecil membangun kesehatan jangka panjangmu.",
          accentClass: "border-emerald-500/30 bg-gradient-to-br from-card via-card to-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        };

      case "recovery":
        return {
          icon: RefreshCw,
          badge: "Selamat Datang Kembali ❤️",
          defaultTitle: `Senang Melihatmu Lagi di NutriVerse`,
          defaultMessage: "Tidak masalah jika sempat beristirahat sejenak. Yang paling penting adalah kamu terus kembali. Yuk lanjutkan dari langkah ringan.",
          accentClass: "border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/10 text-amber-600 dark:text-amber-400"
        };

      case "contextual-tip":
        return {
          icon: Lightbulb,
          badge: "Tips Kebiasaan Sehat",
          defaultTitle: "Gizi & Stamina Seimbang",
          defaultMessage: "Menjaga asupan air putih jernih dan aktivitas santai 10 menit di sore hari akan membantu menjaga energi tubuhmu tetap stabil.",
          accentClass: "border-sky-500/30 bg-gradient-to-br from-card via-card to-sky-500/10 text-sky-600 dark:text-sky-400"
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={`card card-pad relative overflow-hidden border ${config.accentClass} shadow-soft transition-all duration-300 ${className}`}>
      <div className="flex items-start gap-3.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-card border border-line shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[9px] py-0.5 px-2 bg-card/80 border border-line font-bold">
              {config.badge}
            </span>
          </div>
          <h4 className="font-display text-base font-extrabold text-foreground">
            {title || config.defaultTitle}
          </h4>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {message || config.defaultMessage}
          </p>

          {actionLabel && onAction && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onAction}
                className="btn btn-primary btn-xs font-bold inline-flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" /> {actionLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
