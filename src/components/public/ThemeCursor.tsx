"use client";

import { useEffect, useRef } from "react";
import { Leaf } from "lucide-react";

export function ThemeCursor({ hostSelector = ".public-landing" }: { readonly hostSelector?: string }) {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const host = document.querySelector<HTMLElement>(hostSelector);
    const media = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!cursor || !host || !media.matches) return;

    host.classList.add("custom-cursor-enabled");
    let frame = 0;

    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        cursor.style.setProperty("--cursor-x", `${event.clientX}px`);
        cursor.style.setProperty("--cursor-y", `${event.clientY}px`);
        cursor.style.opacity = "1";
      });
    };

    const over = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      cursor.classList.toggle(
        "is-interactive",
        Boolean(target?.closest("a, button, summary, input, select, textarea, label")),
      );
    };

    const leave = () => {
      cursor.style.opacity = "0";
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);

    return () => {
      cancelAnimationFrame(frame);
      host.classList.remove("custom-cursor-enabled");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("mouseleave", leave);
    };
  }, [hostSelector]);

  return (
    <div ref={cursorRef} className="public-theme-cursor" aria-hidden="true">
      <Leaf className="h-3.5 w-3.5" strokeWidth={2.2} />
    </div>
  );
}
