"use client";

import { useEffect, useState } from "react";
import type { CompanionWeeklyLetter } from "@/features/companion/types";

export function useWeeklyLetter() {
  const [letter, setLetter] = useState<CompanionWeeklyLetter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/companion/weekly-letter", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => null)) as
          | {
              success?: boolean;
              letter?: CompanionWeeklyLetter | null;
            }
          | null;
        if (!cancelled && response.ok && result?.success) {
          setLetter(result.letter ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { letter, loading };
}
