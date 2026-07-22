"use client";

import { useMemo, useSyncExternalStore } from "react";
import { AUTH_EVENT, AUTH_STORAGE_KEY, type AuthSession } from "@/features/auth/session";

function subscribe(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(AUTH_STORAGE_KEY) ?? "";
}

function getServerSnapshot() {
  return "";
}

export function useAuthSession(): AuthSession | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }, [raw]);
}
