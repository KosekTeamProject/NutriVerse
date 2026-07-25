"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useRef } from "react";
import { Sparkles, Bot, Ghost, Cat, Bird, Trees } from "lucide-react";

import { useAuthSession } from "@/hooks/useAuthSession";
import { useCompanionName } from "@/hooks/useCompanionName";

interface NoraDialogueBubbleProps {
  text: string;
  isTyping?: boolean;
  onTypingComplete?: () => void;
  typingSpeed?: number;
  subtext?: string;
  overrideName?: string;
}

export function NoraDialogueBubble({
  text,
  isTyping = false,
  onTypingComplete,
  typingSpeed = 30,
  subtext,
  overrideName
}: NoraDialogueBubbleProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [typing, setTyping] = useState(isTyping);
  const { displayName } = useCompanionName();
  
  // Use a ref to keep track of the latest callback without triggering re-renders
  const latestOnTypingComplete = useRef(onTypingComplete);
  useEffect(() => {
    latestOnTypingComplete.current = onTypingComplete;
  }, [onTypingComplete]);

  const finalName = overrideName || displayName;

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text);
      setTyping(false);
      return;
    }

    setDisplayedText("");
    setTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayedText(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setTyping(false);
        if (latestOnTypingComplete.current) {
          latestOnTypingComplete.current();
        }
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [text, isTyping, typingSpeed]); // Excluded onTypingComplete to prevent reset

  const remainingText = text.slice(displayedText.length);

  return (
    <div className="card card-pad mx-auto w-full max-w-lg border-brand/20 bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-soft animate-fade-up">
      <div className="flex items-center gap-2 mb-4 justify-center">
        <span className="h-1.5 w-1.5 rounded-full bg-brand/60" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand/80">{finalName} AI Companion</span>
      </div>
      
      {/* Lightweight Typewriter: Dual-Span Masking */}
      <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground whitespace-pre-line leading-relaxed text-center">
        <span>{displayedText}</span>
        {typing && <span className="absolute animate-pulse text-brand/50">|</span>}
        <span className="opacity-0 select-none pointer-events-none" aria-hidden="true">{remainingText}</span>
      </h2>

      {subtext && !typing && (
        <p className="mt-5 text-[13px] text-center text-muted-foreground leading-relaxed animate-fade-up">
          {subtext}
        </p>
      )}
    </div>
  );
}

export function NoraAvatar({ floating = true, pulsing = true, size = "md", overrideAvatarId }: { floating?: boolean; pulsing?: boolean; size?: "sm" | "md" | "lg", overrideAvatarId?: string }) {
  const session = useAuthSession();
  const avatarId = overrideAvatarId || session?.companionAvatarId || "sparkles";

  const sizeMap = {
    sm: "h-16 w-16 rounded-2xl",
    md: "h-24 w-24 rounded-3xl",
    lg: "h-32 w-32 rounded-[2rem]",
  };
  const iconSizeMap = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const getIcon = () => {
    switch(avatarId) {
      case "bot": return <Bot className={`${iconSizeMap[size]} text-white animate-breathe`} />;
      case "ghost": return <Ghost className={`${iconSizeMap[size]} text-white animate-breathe`} />;
      case "cat": return <Cat className={`${iconSizeMap[size]} text-white animate-breathe`} />;
      case "bird": return <Bird className={`${iconSizeMap[size]} text-white animate-breathe`} />;
      case "trees": return <Trees className={`${iconSizeMap[size]} text-white animate-breathe`} />;
      default: return <Sparkles className={`${iconSizeMap[size]} text-white animate-breathe`} />;
    }
  };

  return (
    <div className="relative mx-auto mb-6 flex justify-center">
      {pulsing && <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-brand to-lime opacity-10 blur-xl animate-pulse" />}
      <div className={`relative grid ${sizeMap[size]} place-items-center bg-gradient-to-tr from-brand to-lime text-white shadow-2xl ${floating ? 'animate-float' : ''}`}>
        {getIcon()}
      </div>
    </div>
  );
}
