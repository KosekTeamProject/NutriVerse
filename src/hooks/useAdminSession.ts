"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ADMIN_EVENT, ADMIN_STORAGE_KEY, type AdminSession } from "@/features/admin/session";

function subscribe(callback: () => void) {
  window.addEventListener(ADMIN_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(ADMIN_EVENT, callback); window.removeEventListener("storage", callback); };
}

export function useAdminSession(): AdminSession | null {
  const raw = useSyncExternalStore(subscribe, () => window.localStorage.getItem(ADMIN_STORAGE_KEY) ?? "", () => "");
  return useMemo(() => {
    if (!raw) return null;
    try { return JSON.parse(raw) as AdminSession; } catch { return null; }
  }, [raw]);
}
