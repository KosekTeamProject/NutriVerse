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
    dialogue: "Selamat datang di berandamu! Di sini, aku akan menyapamu setiap hari.\nKamu bisa melihat aktivitas utamamu hari ini tanpa perlu bingung harus mulai dari mana.",
    placement: "bottom"
  },
  {
    id: "todays-journey",
    path: "/todays-journey",
    selector: '[data-tour="todays-mission"]',
    title: "Hari Ini",
    dialogue: "Ini adalah 'Perjalanan Hari Ini'. Kamu tidak perlu mengerjakan semuanya sekaligus.\nPilih satu langkah kecil saja, seperti minum segelas air. Sedikit demi sedikit, itu akan menjadi kebiasaan hebat!",
    placement: "bottom"
  },
  {
    id: "health-pulse",
    path: "/health-pulse",
    selector: '[data-tour="health-pulse-score"]',
    title: "Health Pulse",
    dialogue: "Ini adalah 'Health Pulse' milikmu. Bukan untuk menilai, melainkan sebagai kompas.\nNilainya akan naik secara alami jika kamu konsisten melakukan hal-hal kecil yang baik bagi tubuh.",
    placement: "bottom"
  },
  {
    id: "companion",
    path: "/companion",
    selector: '[data-tour="nora-chat"]',
    title: "Nora AI",
    dialogue: "Halo, ini ruang pribadiku! Kamu bebas bertanya apa saja kepadaku di sini.\nMulai dari info nutrisi sarapan sampai cara beristirahat yang nyaman, aku akan bantu jawab.",
    placement: "right"
  },
  {
    id: "scan",
    path: "/scan",
    selector: '[data-tour="scan-demo"]',
    title: "Scan Makanan",
    dialogue: "Bingung apakah sebuah makanan sehat atau tidak? Cukup ambil foto makanannya di sini.\nBiar aku yang periksa kandungannya dan memberikan masukan terbaik untukmu.",
    placement: "bottom"
  },
  {
    id: "aktivitas",
    path: "/aktivitas",
    selector: '[data-tour="gps-demo"]',
    title: "Aktivitas GPS",
    dialogue: "Saat kamu ingin jalan santai atau lari di luar rumah, tekan tombol mulai di sini.\nAplikasi akan melacak jarakmu dengan aman supaya kamu bisa melihat pencapaian nyata.",
    placement: "bottom"
  },
  {
    id: "challenge",
    path: "/challenge",
    selector: '[data-tour="challenge-cards"]',
    title: "Tantangan",
    dialogue: "Ingin sedikit bermain? Di sini ada tantangan-tantangan seru.\nJangan terbebani, ini cuma cara menyenangkan untuk memotivasi diri, bukan kompetisi yang berat.",
    placement: "bottom"
  },
  {
    id: "komunitas",
    path: "/komunitas",
    selector: '[data-tour="community-leaderboard"]',
    title: "Komunitas",
    dialogue: "Kamu tidak berjalan sendirian. Di ruang ini, banyak teman-teman lain yang sedang belajar hidup sehat.\nKalian bisa saling memberi dukungan dan semangat setiap harinya.",
    placement: "left"
  },
  {
    id: "reward",
    path: "/reward",
    selector: '[data-tour="reward-cards"]',
    title: "Reward",
    dialogue: "Ini bagian favorit banyak orang!\nPoin yang kamu kumpulkan pelan-pelan bisa ditukarkan dengan berbagai hadiah menarik di sini.",
    placement: "bottom"
  },
  {
    id: "pengaturan",
    path: "/pengaturan",
    selector: '[data-tour="settings-area"]',
    title: "Pengaturan",
    dialogue: "Terakhir, di menu ini kamu bisa mengatur semuanya. Mulai dari profil sampai keamanan.\nJangan takut salah klik, kamu selalu bisa meminta bantuanku kalau ada yang bingung.",
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

  // Auto-start tour if flag is set (after onboarding)
  useEffect(() => {
    const needsTour = localStorage.getItem("nutriverse.needs_tour");
    if (needsTour === "true") {
      setIsActive(true);
      setCurrentStepIndex(0);
      setIsPaused(false);
      localStorage.removeItem("nutriverse.needs_tour");
    }
  }, []);

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
