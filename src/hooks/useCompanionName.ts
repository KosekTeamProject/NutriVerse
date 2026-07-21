"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { 
  DEFAULT_COMPANION_NAME, 
  COMPANION_NAME_STORAGE_KEY, 
  sanitizeCompanionDisplayName 
} from "@/features/companion/companion-name-helpers";

export const COMPANION_NAME_CHANGE_EVENT = "nv-companion-name-change";

export function useCompanionName() {
  const [displayName, setDisplayNameState] = useState<string>(DEFAULT_COMPANION_NAME);

  // Load from localStorage after mount and subscribe to change events
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(COMPANION_NAME_STORAGE_KEY);
        startTransition(() => {
          setDisplayNameState(saved ? sanitizeCompanionDisplayName(saved) : DEFAULT_COMPANION_NAME);
        });
      } catch {
        // Fallback to default Nora on storage error
      }
    };

    handleSync();

    window.addEventListener("storage", handleSync);
    window.addEventListener(COMPANION_NAME_CHANGE_EVENT, handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(COMPANION_NAME_CHANGE_EVENT, handleSync);
    };
  }, []);

  const setDisplayName = useCallback((name: string) => {
    const clean = sanitizeCompanionDisplayName(name);
    setDisplayNameState(clean);
    try {
      localStorage.setItem(COMPANION_NAME_STORAGE_KEY, clean);
      window.dispatchEvent(new CustomEvent(COMPANION_NAME_CHANGE_EVENT, { detail: clean }));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setDisplayNameState(DEFAULT_COMPANION_NAME);
    try {
      localStorage.removeItem(COMPANION_NAME_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(COMPANION_NAME_CHANGE_EVENT, { detail: DEFAULT_COMPANION_NAME }));
    } catch {
      // Ignore storage errors
    }
  }, []);

  return {
    displayName,
    setDisplayName,
    resetToDefault,
    isDefault: displayName === DEFAULT_COMPANION_NAME
  };
}

// Alias helper matching Phase 2 requested naming convention
export function useCompanionDisplayName() {
  return useCompanionName();
}

