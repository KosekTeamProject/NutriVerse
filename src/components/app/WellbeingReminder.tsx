"use client";

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

  useEffect(() => {
    const initialRead = window.setTimeout(() => setPreference(readPreference()), 0);

    const update = () => setPreference(readPreference());
    const preview = () => {
      setStarted(false);
      setVisible(true);
    };

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

  return (
    <aside className="fixed bottom-4 right-4 z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-brand/20 bg-card p-4 shadow-2xl sm:bottom-6 sm:right-6" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
          {started ? <Check className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand">Pengingat dari Nora</p>
              <h2 className="mt-0.5 font-display text-sm font-bold text-foreground">
                {started ? "Waktunya bergerak sebentar" : "Mau ambil jeda satu menit?"}
              </h2>
            </div>
            <button onClick={() => setVisible(false)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary" aria-label="Tutup pengingat">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {started
              ? "Putar bahu perlahan, berdiri jika nyaman, lalu tarik napas. Berhenti jika terasa sakit atau pusing."
              : "Kalau kamu sedang duduk, berdiri atau lakukan peregangan ringan dapat membantu tubuh terasa lebih nyaman."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!started && (
              <button onClick={() => setStarted(true)} className="btn btn-primary btn-xs">
                <BellRing className="h-3.5 w-3.5" /> Mulai peregangan
              </button>
            )}
            <button onClick={() => setVisible(false)} className="btn btn-ghost btn-xs">
              {started ? "Selesai" : "Nanti dulu"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
