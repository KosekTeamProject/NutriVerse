// Pure label helpers for activity verification — no client-side APIs used.
// This file intentionally has no "use client" directive so it can be imported
// in both Server Components and Client Components.

import { ActivityRiskSignal } from "@/lib/activity";

export function getVerificationStatusLabel(status: string): string {
  switch (status) {
    case "verified": return "Demo Validation Passed";
    case "needs-review": return "Perlu Ditinjau";
    case "not-verified": return "Tidak Memenuhi Syarat";
    case "pending": return "GPS Direkam";
    case "manual-review": return "Perlu Ditinjau";
    default: return status;
  }
}

export function getRiskSignalLabel(signal: ActivityRiskSignal): string {
  switch (signal) {
    case "unusual-speed": return "Kecepatan Gerakan Tidak Biasa";
    case "sudden-location-change": return "Diskontinuitas Posisi Mendadak";
    case "low-accuracy": return "Akurasi Sinyal GPS Rendah";
    case "timestamp-order": return "Urutan Timestamp Tidak Konsisten";
    case "duplicate-sample": return "Sampel Telemetri Duplikat";
    case "incomplete-samples": return "Aliran Sampel Tidak Lengkap";
    case "large-sample-gap": return "Gangguan Telemetri Signifikan";
    case "duplicate-activity": return "Rekaman Aktivitas Tumpang Tindih";
    case "invalid-duration": return "Durasi Aktivitas Tidak Cukup";
    case "zero-movement": return "Perpindahan Terukur Nol";
    case "simulation-source": return "Sumber Data GPS Simulasi";
    default: return signal;
  }
}
