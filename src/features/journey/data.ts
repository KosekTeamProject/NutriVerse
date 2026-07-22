import { JourneyRecord } from "./types";

export const journeyRecords: readonly JourneyRecord[] = [
  {
    id: "journey-morning-walk",
    travelerId: "Fathan",
    title: "Jalan Pagi",
    summary: "Jalan pagi terverifikasi yang memperkuat konsistensi hari ini.",
    meaning: "Hal terpenting adalah tetap bergerak pada hari biasa.",
    reflection: "Tindakan kecil mulai menjadi bagian dari perjalanan sehat.",
    category: "activity",
    occurredAt: "2026-07-20T07:00:00Z",
    visibility: "public",
    trustLevel: "verified",
    metrics: [
      { label: "Jarak", value: "1,4 km" },
      { label: "Waktu Aktif", value: "20 mnt" },
      { label: "Konsistensi", value: "Hari ke-7" }
    ],
    healthPulseBefore: 76.8,
    healthPulseAfter: 78.0,
    healthPulseChange: 1.2,
    sourceType: "gps",
    sourceId: "act-101",
    shareEligible: true,
    containsSimulatedData: true,
    version: "1.0.0"
  },
  {
    id: "journey-protein-progress",
    travelerId: "Fathan",
    title: "Progres Protein",
    summary: "Sebagian besar target hari ini tercapai melalui asupan makanan seimbang.",
    meaning: "Mendukung pemulihan dan menjaga massa tubuh tanpa lemak.",
    reflection: "Memilih sumber protein padat saat sarapan.",
    category: "nutrition",
    occurredAt: "2026-07-20T08:15:00Z",
    visibility: "circle",
    trustLevel: "partially-verified",
    metrics: [
      { label: "Protein Tercatat", value: "56 g" },
      { label: "Target Harian", value: "80 g" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-light-recovery",
    travelerId: "Fathan",
    title: "Pemulihan Ringan",
    summary: "Menyelesaikan peregangan dinamis ringan untuk mengurangi ketegangan otot.",
    meaning: "Menghargai waktu istirahat untuk menjaga konsistensi harian.",
    reflection: "Paha belakang terasa lebih rileks. Tetap minum cukup setelah peregangan.",
    category: "recovery",
    occurredAt: "2026-07-20T10:00:00Z",
    visibility: "private",
    trustLevel: "self-reported",
    metrics: [
      { label: "Peregangan", value: "15 mnt" },
      { label: "Intensitas", value: "Ringan" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-seven-day-consistency",
    travelerId: "Fathan",
    title: "Konsistensi Tujuh Hari",
    summary: "Menjaga kontribusi kesehatan aktif selama tujuh hari berturut-turut.",
    meaning: "Kebiasaan dibentuk oleh keputusan harian, bukan usaha sesekali.",
    reflection: "Senang dapat mencatat kebiasaan selama satu minggu penuh.",
    category: "consistency",
    occurredAt: "2026-07-19T20:00:00Z",
    visibility: "circle",
    trustLevel: "verified",
    metrics: [
      { label: "Indeks Streak", value: "7 hari" },
      { label: "Hari Aktif", value: "7 / 7" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-cardio-challenge-progress",
    travelerId: "Fathan",
    title: "Progres Kardio Ringan",
    summary: "Mencatat progres terverifikasi menuju target kardio periode ini.",
    meaning: "Gerakan yang terkumpul membantu membangun stamina kardiovaskular.",
    category: "challenge",
    occurredAt: "2026-07-19T16:30:00Z",
    visibility: "public",
    trustLevel: "verified",
    metrics: [
      { label: "Segmen Tantangan", value: "1,4 km" },
      { label: "Akumulasi Jarak", value: "7,2 / 10,0 km" }
    ],
    shareEligible: true,
    containsSimulatedData: true,
    version: "1.0.0"
  },
  {
    id: "journey-pulse-improvement",
    travelerId: "Fathan",
    title: "Peningkatan Health Pulse",
    summary: "Terlihat perubahan positif pada pola gaya hidup dan konsistensi secara keseluruhan.",
    meaning: "Pulse yang meningkat memperlihatkan dampak kebiasaan sehat yang terarah.",
    category: "health-pulse",
    occurredAt: "2026-07-20T12:00:00Z",
    visibility: "public",
    trustLevel: "verified",
    metrics: [
      { label: "Pulse Aktif", value: "78,0" },
      { label: "Kenaikan Bersih", value: "+1,2" }
    ],
    healthPulseBefore: 76.8,
    healthPulseAfter: 78.0,
    healthPulseChange: 1.2,
    shareEligible: true,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-personal-reflection",
    travelerId: "Fathan",
    title: "Refleksi Pribadi",
    summary: "Merefleksikan penyesuaian hidrasi dan pemulihan untuk minggu mendatang.",
    meaning: "Kesadaran diri membantu menyesuaikan kebiasaan secara mandiri.",
    reflection: "Target air sulit tercapai pada hari aktif. Minggu depan akan membawa tumbler.",
    category: "reflection",
    occurredAt: "2026-07-18T21:00:00Z",
    visibility: "private",
    trustLevel: "self-reported",
    metrics: [
      { label: "Fokus Refleksi", value: "Hidrasi" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  },
  {
    id: "journey-hydration-progress",
    travelerId: "Fathan",
    title: "Progres Hidrasi",
    summary: "Mencatat asupan air saat jeda belajar untuk menjaga fokus.",
    meaning: "Minum secara teratur mendukung pemulihan fisik dan kewaspadaan mental.",
    category: "lifestyle",
    occurredAt: "2026-07-20T11:30:00Z",
    visibility: "private",
    trustLevel: "self-reported",
    metrics: [
      { label: "Asupan", value: "1,1 L" },
      { label: "Target", value: "2.0 L" }
    ],
    shareEligible: false,
    containsSimulatedData: false,
    version: "1.0.0"
  }
];
