"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

export type TourStep = {
  id: string;
  path: string;
  selector: string;
  title: string;
  dialogue: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    selector: '[data-tour="dashboard-summary"]',
    title: "Dashboard",
    dialogue: "Selamat datang di berandamu! Di sini, aku akan menyapamu setiap hari dan memberikan ringkasan status kesehatanmu.",
    placement: "bottom"
  },
  {
    id: "health-pulse",
    path: "/dashboard",
    selector: '[data-tour="health-pulse-widget"]',
    title: "Health Pulse",
    dialogue: "Ini adalah 'Health Pulse' milikmu. Bukan untuk menilai, melainkan sebagai kompas.\nNilainya akan naik secara alami jika kamu konsisten melakukan hal-hal kecil yang baik bagi tubuh.",
    placement: "bottom"
  },
  {
    id: "focus",
    path: "/dashboard",
    selector: '[data-tour="focus-widget"]',
    title: "Today's Focus",
    dialogue: "Ini adalah target fokus utama harianmu. Pilih satu tindakan kecil yang bisa dicapai terlebih dahulu, seperti minum segelas air atau mencatat makanan.",
    placement: "bottom"
  },
  {
    id: "rings",
    path: "/dashboard",
    selector: '[data-tour="rings-widget"]',
    title: "Visual Ring Harian",
    dialogue: "Pantau pencapaian langkah kaki, asupan air, dan menit aktif harianmu secara visual dalam bentuk cincin progres yang dinamis di sini.",
    placement: "bottom"
  },
  {
    id: "quick-actions",
    path: "/dashboard",
    selector: '[data-tour="quick-actions-widget"]',
    title: "Aksi Cepat",
    dialogue: "Gunakan menu aksi cepat ini untuk langsung mulai berlari dengan GPS, memindai makanan dengan kamera AI, atau mengobrol langsung denganku.",
    placement: "bottom"
  },
  {
    id: "weekly-stats",
    path: "/dashboard",
    selector: '[data-tour="weekly-stats-widget"]',
    title: "Kualitas Kebiasaan",
    dialogue: "Di sini kamu bisa melihat streak aktivitas sehatmu minggu ini. Ingat, fokus utama kita adalah menjaga konsistensi dengan santai.",
    placement: "bottom"
  },
  {
    id: "challenges",
    path: "/dashboard",
    selector: '[data-tour="challenges-widget"]',
    title: "Tantangan Aktif",
    dialogue: "Ingin sedikit bermain? Di sini ada tantangan-tantangan seru untuk memotivasi diri secara menyenangkan sekaligus mengumpulkan XP & HP.",
    placement: "bottom"
  },
  {
    id: "komunitas",
    path: "/dashboard",
    selector: '[data-tour="community-widget"]',
    title: "Komunitas",
    dialogue: "Kamu tidak berjalan sendirian. Di bagian komunitas ini, kamu bisa melihat pencapaian, leaderboard, serta saling mendukung dengan teman lainnya.",
    placement: "bottom"
  },
  {
    id: "ending",
    path: "/dashboard",
    selector: "body", // Fullscreen for ending
    title: "Selesai",
    dialogue: "Hore! Sekarang kamu sudah kenal bagian-bagian penting dari aplikasi ini.\nAku akan selalu ada di sisimu. Ingat, mari fokus pada satu langkah kecil saja hari ini. Yuk, kita mulai!",
    placement: "center"
  }
];

type GuidedTourContextType = {
  isActive: boolean;
  isPaused: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  isNavigating: boolean;
  startTour: () => void;
  stopTour: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
};

const GuidedTourContext = createContext<GuidedTourContextType | null>(null);

export function useGuidedTour() {
  const context = useContext(GuidedTourContext);
  if (!context) throw new Error("useGuidedTour must be used within GuidedTourProvider");
  return context;
}

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  const currentStep = isActive ? TOUR_STEPS[currentStepIndex] : null;

  // Auto-start tour on first dashboard entry if not completed yet
  useEffect(() => {
    const tourCompleted = localStorage.getItem("nutriverse.tour_completed");
    const needsTour = localStorage.getItem("nutriverse.needs_tour");
    
    if (pathname === "/dashboard" && tourCompleted !== "true") {
      setIsActive(true);
      setCurrentStepIndex(0);
      setIsPaused(false);
      localStorage.removeItem("nutriverse.needs_tour");
    } else if (needsTour === "true") {
      setIsActive(true);
      setCurrentStepIndex(0);
      setIsPaused(false);
      localStorage.removeItem("nutriverse.needs_tour");
    }
  }, [pathname]);

  // Handle route matching during tour
  useEffect(() => {
    if (isActive && !isPaused && currentStep && !isNavigating) {
      if (pathname !== currentStep.path) {
        setIsNavigating(true);
        router.push(currentStep.path);
      }
    }
  }, [isActive, isPaused, currentStep, pathname, router, isNavigating]);

  // Reset navigation lock when route matches
  useEffect(() => {
    if (isActive && isNavigating && currentStep && pathname === currentStep.path) {
      // Small delay to allow page render before looking for spotlight element
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, isActive, isNavigating, currentStep]);

  const startTour = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    setCurrentStepIndex(0);
    router.push(TOUR_STEPS[0].path);
  }, [router]);

  const stopTour = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    localStorage.setItem("nutriverse.tour_completed", "true");
  }, []);

  const pauseTour = useCallback(() => setIsPaused(true), []);
  const resumeTour = useCallback(() => setIsPaused(false), []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      stopTour();
    }
  }, [currentStepIndex, stopTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  return (
    <GuidedTourContext.Provider
      value={{
        isActive,
        isPaused,
        currentStepIndex,
        currentStep,
        isNavigating,
        startTour,
        stopTour,
        pauseTour,
        resumeTour,
        nextStep,
        prevStep
      }}
    >
      {children}
    </GuidedTourContext.Provider>
  );
}
