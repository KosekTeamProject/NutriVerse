"use client";

import { useState, useEffect } from "react";

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setDark(isDark);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggleTheme = () => {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("nv-theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  };

  return { dark, toggleTheme };
}
