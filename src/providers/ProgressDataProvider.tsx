"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ProgressOverview } from "@/features/progress/types";

type ProgressContextValue = {
  overview: ProgressOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressDataProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/progress/overview", {
        cache: "no-store",
      });
      const result = (await response.json().catch(() => null)) as
        | {
            success?: boolean;
            overview?: ProgressOverview;
            error?: string;
          }
        | null;
      if (!response.ok || !result?.success || !result.overview) {
        if (response.status !== 401) {
          setError(result?.error ?? "Data progres belum dapat dimuat.");
        }
        return;
      }
      setOverview(result.overview);
      setError(null);
    } catch {
      setError("Koneksi data progres terputus sementara.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const onFocus = () => void refresh();
    const onDataChanged = () => void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("nutriverse:data-changed", onDataChanged);
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("nutriverse:data-changed", onDataChanged);
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ overview, loading, error, refresh }),
    [overview, loading, error, refresh],
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgressData() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgressData must be used inside ProgressDataProvider");
  }
  return context;
}
