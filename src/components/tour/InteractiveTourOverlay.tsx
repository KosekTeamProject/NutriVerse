"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, useRef } from "react";
import { useGuidedTour, TOUR_STEPS } from "@/providers/GuidedTourProvider";
import { NoraAvatar } from "@/features/companion/components/NoraDialogueBubble";
import { ArrowLeft, ArrowRight, Pause, Play, SkipForward, X } from "lucide-react";

type Rect = { top: number; left: number; width: number; height: number };

export function InteractiveTourOverlay() {
  const { 
    isActive, 
    isPaused, 
    currentStep, 
    currentStepIndex,
    isNavigating,
    nextStep, 
    prevStep, 
    stopTour, 
    pauseTour, 
    resumeTour 
  } = useGuidedTour();
  
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [dialogueText, setDialogueText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const maskRef = useRef<SVGRectElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    if (isActive) {
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isActive]);

  // Find target element and scroll to it
  useEffect(() => {
    if (!isActive || isPaused || !currentStep || isNavigating) return;

    setDialogueText(currentStep.dialogue);
    setIsTyping(true);

    if (currentStep.selector === "body") {
      setTargetRect(null);
      return;
    }

    let activeEl: Element | null = null;
    let scrollTimeout: NodeJS.Timeout | null = null;

    const updateRect = () => {
      const el = document.querySelector(currentStep.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Add some padding
        setTargetRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16
        });

        // Add spotlight target class to elevate and highlight
        if (activeEl !== el) {
          if (activeEl) {
            activeEl.classList.remove("tour-active-target");
          }
          activeEl = el;
          el.classList.add("tour-active-target");
        }
        
        // Auto scroll into view smoothly if not fully visible
        const isMobile = window.innerWidth < 768;
        if (rect.top < 0 || rect.bottom > window.innerHeight - (isMobile ? 300 : 0)) {
          el.scrollIntoView({ behavior: "smooth", block: isMobile ? "start" : "center" });
        }
      } else {
        setTargetRect(null);
      }
    };

    const handleScroll = () => {
      if (maskRef.current && boxRef.current) {
        maskRef.current.style.transition = "none";
        boxRef.current.style.transition = "none";
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (maskRef.current) maskRef.current.style.transition = "";
          if (boxRef.current) boxRef.current.style.transition = "";
        }, 100);
      }
      updateRect();
    };

    // Initial find
    updateRect();
    
    // Poll for a short time in case the element is still rendering/animating
    const interval = setInterval(updateRect, 500);
    const timeout = setTimeout(() => clearInterval(interval), 3000);

    // Listen to scroll events to update highlight position
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updateRect);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updateRect);
      if (activeEl) {
        activeEl.classList.remove("tour-active-target");
      }
    };
  }, [isActive, isPaused, currentStep, windowSize, isNavigating]); // re-run if window resizes

  // Typing effect
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(dialogueText);
      return;
    }
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      if (i <= dialogueText.length) {
        setDisplayedText(dialogueText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20); // Faster typing for longer texts
    return () => clearInterval(interval);
  }, [dialogueText, isTyping]);

  if (!isActive) return null;

  const isEnding = currentStep?.id === "ending";
  const isMobile = windowSize.width > 0 && windowSize.width < 768;
  const isTargetInBottomHalf = targetRect ? (targetRect.top + targetRect.height / 2) > windowSize.height / 2 : false;

  // The dialogue bubble opacity depends on navigation status
  const bubbleOpacity = isNavigating ? 0 : 1;

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-hidden pointer-events-none transition-opacity duration-500"
      style={{ opacity: isPaused ? 0 : 1 }}
    >
      {/* SVG Mask Definition */}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {!isEnding && targetRect && !isNavigating && (
              <rect
                ref={maskRef}
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="16"
                fill="black"
                className="transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
            )}
          </mask>
        </defs>
      </svg>

      {/* Background Dimmer & Blur (Masked) */}
      <div 
        className="absolute inset-0 bg-[#040806]/85 backdrop-blur-md transition-opacity duration-700 pointer-events-none" 
        style={{ 
          mask: "url(#spotlight-mask)", 
          WebkitMask: "url(#spotlight-mask)" 
        }} 
      />
      
      {/* Spotlight Border Glow */}
      {!isEnding && targetRect && !isNavigating && (
        <div 
          ref={boxRef}
          className="absolute rounded-2xl bg-transparent transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        >
          {/* Animated border/glow around spotlight */}
          <div className="absolute -inset-1 rounded-2xl border-2 border-brand/50 spotlight-active-highlight pointer-events-none" />
          
          {/* Sonar ripple wave 1 */}
          <div className="absolute -inset-3 rounded-2xl border border-brand/30 sonar-wave pointer-events-none" />
          
          {/* Sonar ripple wave 2 */}
          <div className="absolute -inset-6 rounded-2xl border border-brand/10 sonar-wave pointer-events-none" style={{ animationDelay: "0.8s" }} />
        </div>
      )}

      {/* Floating Nora Companion & Dialogue */}
      <div 
        className="absolute transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] w-[92%] max-w-[420px] pointer-events-auto"
        style={
          isEnding 
            ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: bubbleOpacity }
            : isMobile
              ? isTargetInBottomHalf
                ? { top: "80px", left: "50%", transform: "translateX(-50%)", opacity: bubbleOpacity }
                : { bottom: "20px", left: "50%", transform: "translateX(-50%)", opacity: bubbleOpacity }
              : targetRect
                ? { 
                    top: Math.max(20, Math.min(windowSize.height - 390, targetRect.top + (currentStep?.placement === "bottom" ? targetRect.height + 20 : -120))),
                    left: Math.max(20, Math.min(windowSize.width - 440, targetRect.left + (currentStep?.placement === "right" ? targetRect.width + 20 : targetRect.width / 2 - 200))),
                    opacity: bubbleOpacity
                  }
                : { top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: bubbleOpacity } // Fallback to center if not found, DO NOT hide!
        }
      >
        <div className="flex flex-col items-center">
          <div className="scale-75 origin-bottom mb-[-1rem]">
            <NoraAvatar size="md" />
          </div>
          <div className="card card-pad bg-card/95 backdrop-blur-xl border-brand/30 shadow-premium w-full text-center relative overflow-hidden flex flex-col min-h-[200px] h-auto pb-5">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand to-lime opacity-50" />
            
            {/* Progress indicator */}
            {!isEnding && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Langkah {currentStepIndex + 1} dari {TOUR_STEPS.length - 1}
              </p>
            )}

            <h3 className="font-display font-bold text-[14px] sm:text-base whitespace-pre-line leading-relaxed text-foreground mb-4 flex-1 overflow-visible px-2 py-1 flex items-center justify-center">
              <div>
                {displayedText}
                {isTyping && <span className="animate-pulse text-brand ml-1">|</span>}
              </div>
            </h3>
            
            {/* Navigation Controls */}
            <div className="pt-3 mt-auto shrink-0 border-t border-line/45 flex items-center justify-between w-full">
              {isEnding ? (
                <div className="w-full flex justify-center">
                  <button onClick={stopTour} className="btn btn-primary w-full max-w-[200px] shadow-soft font-bold">
                    Mulai Perjalanan <ArrowRight className="h-4 w-4 ml-1.5" />
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={stopTour} 
                    className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition mr-auto p-2"
                  >
                    Lewati Tur
                  </button>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={prevStep} 
                      disabled={currentStepIndex === 0 || isTyping} 
                      className="btn btn-ghost btn-sm disabled:opacity-30 rounded-xl px-3 font-bold"
                      aria-label="Kembali"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={nextStep} 
                      disabled={isTyping}
                      className="btn btn-primary btn-sm shadow-soft rounded-xl px-4 font-bold disabled:opacity-50"
                    >
                      Lanjut <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Right Global Controls (Only Pause now) */}
      <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
        <button onClick={pauseTour} className="btn btn-secondary btn-sm rounded-full px-3 text-xs font-bold shadow-soft">
          <Pause className="h-3.5 w-3.5 mr-1" /> Jeda Tur
        </button>
      </div>

      {/* Paused Overlay State (Hidden, handled by outer div opacity, but we need a resume button) */}
      {isPaused && (
        <div className="fixed inset-0 z-[101] bg-background/80 backdrop-blur-sm grid place-items-center pointer-events-auto">
          <div className="text-center animate-fade-up">
            <NoraAvatar size="sm" floating={false} />
            <h2 className="mt-4 font-display text-2xl font-bold">Tur Dijeda</h2>
            <p className="mt-2 text-muted-foreground max-w-sm">Kamu bebas mengeksplorasi aplikasi sekarang. Lanjutkan tur kapanpun kamu siap.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={stopTour} className="btn btn-ghost">Akhiri Tur</button>
              <button onClick={resumeTour} className="btn btn-primary font-bold"><Play className="h-4 w-4 mr-1.5" /> Lanjutkan Berkeliling</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
