"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { BellRing, Check, Sparkles, X } from "lucide-react";

export const BREAK_REMINDER_KEY = "nutriverse.break-reminder";
export const BREAK_REMINDER_EVENT = "nutriverse:break-reminder-updated";
export const BREAK_REMINDER_PREVIEW_EVENT = "nutriverse:break-reminder-preview";

export type BreakReminderPreference = {
  readonly enabled: boolean;
  readonly intervalMinutes: number;
};

const DEFAULT_PREFERENCE: BreakReminderPreference = {
  enabled: false,
  intervalMinutes: 60,
};

function readPreference(): BreakReminderPreference {
  if (typeof window === "undefined") return DEFAULT_PREFERENCE;
  try {
    const saved = window.localStorage.getItem(BREAK_REMINDER_KEY);
    return saved ? { ...DEFAULT_PREFERENCE, ...JSON.parse(saved) } : DEFAULT_PREFERENCE;
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

export function WellbeingReminder() {
  const [preference, setPreference] = useState<BreakReminderPreference>(DEFAULT_PREFERENCE);
  const [visible, setVisible] = useState(false);
  const [started, setStarted] = useState(false);
  const [absenceDays, setAbsenceDays] = useState<number>(0);

  useEffect(() => {
    const initialRead = window.setTimeout(() => setPreference(readPreference()), 0);

    const update = () => setPreference(readPreference());
    const preview = () => {
      setStarted(false);
      setVisible(true);
    };

    // Calculate absence gap from localStorage session
    try {
      const raw = window.localStorage.getItem("nutriverse.auth-session");
      if (raw) {
        const session = JSON.parse(raw);
        if (session.lastLoginTimestamp) {
          const diffMs = Date.now() - session.lastLoginTimestamp;
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          setAbsenceDays(days);
          if (days >= 1) {
            setVisible(true);
          }
        }
      }
    } catch {
      // fallback
    }

    window.addEventListener(BREAK_REMINDER_EVENT, update);
    window.addEventListener(BREAK_REMINDER_PREVIEW_EVENT, preview);
    window.addEventListener("storage", update);
    return () => {
      window.clearTimeout(initialRead);
      window.removeEventListener(BREAK_REMINDER_EVENT, update);
      window.removeEventListener(BREAK_REMINDER_PREVIEW_EVENT, preview);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    if (!preference.enabled) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setStarted(false);
        setVisible(true);
      }
    }, preference.intervalMinutes * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [preference]);

  if (!visible) return null;

  // Determine Smart AI Reminder Content based on absence days
  const getSmartReminderContent = () => {
    if (absenceDays >= 7) {
      return {
        title: "Selamat datang kembali ❤️",
        message: "Tidak masalah jika sempat berhenti. Mari mulai lagi dari langkah kecil.",
        buttonText: "Mulai Langkah Kecil"
      };
    }
    if (absenceDays >= 3) {
      return {
        title: "Aku merindukan progresmu 😊",
        message: "Yuk kembali. Tidak perlu langsung sempurna.",
        buttonText: "Kembali Beraksi"
      };
    }
    if (absenceDays >= 1) {
      return {
        title: "Hai 👋",
        message: "Hari ini belum sempat membuka NutriVerse. Bagaimana kalau kita mulai lagi dengan satu langkah kecil?",
        buttonText: "Mulai Langkah Kecil"
      };
    }

    // Default wellbeing break prompt
    return {
      title: started ? "Waktunya bergerak sebentar" : "Mau ambil jeda satu menit?",
      message: started
        ? "Putar bahu perlahan, berdiri jika nyaman, lalu tarik napas. Berhenti jika terasa sakit atau pusing."
        : "Kalau kamu sedang duduk, berdiri atau lakukan peregangan ringan dapat membantu tubuh terasa lebih nyaman.",
      buttonText: "Mulai peregangan"
    };
  };

  const content = getSmartReminderContent();

  return (
    <aside className="fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-brand/20 bg-card p-4 shadow-2xl sm:bottom-6 sm:right-6 animate-fade-up" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand to-lime text-white shadow-md">
          {started ? <Check className="h-5 w-5" /> : <Sparkles className="h-5 w-5 animate-breathe" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Smart Engagement &middot; Nora</p>
              <h2 className="mt-0.5 font-display text-sm font-bold text-foreground">
                {content.title}
              </h2>
            </div>
            <button onClick={() => setVisible(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Tutup pengingat">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {content.message}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!started && (
              <button onClick={() => setVisible(false)} className="btn btn-primary btn-xs">
                <BellRing className="h-3.5 w-3.5" /> {content.buttonText}
              </button>
            )}
            <button onClick={() => setVisible(false)} className="btn btn-ghost btn-xs">
              Nanti dulu
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
