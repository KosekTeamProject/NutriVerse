import { CompanionContextSummary, CompanionInsight, CompanionWeeklyLetter } from "./types";

export const companionContext: CompanionContextSummary = {
  travelerDisplayName: "Fathan",
  journeyDay: 148,
  primaryGoal: "Jalan Pagi",
  healthPulseScore: 78.0,
  healthPulseStatus: "Berkembang Baik",
  healthPulseTrend: "Meningkat",
  strongestDimension: "Konsistensi",
  focusDimension: "Pemulihan",
  recentJourneyTitles: ["Jalan Pagi"],
  recentActivitySummary: "Jalan Pagi, 1,4 km, terverifikasi",
  nutritionSummary: "Progres protein meningkat",
  recoverySummary: "Pemulihan ringan selesai",
  consistencyDays: 7,
  hydrationSummary: "1,1 / 2,0 L, catatan mandiri",
  activeChallengeSummary: "Kardio Ringan, 7,2 / 10 km",
  dataCompleteness: 86,
  limitations: [
    "self-reported-hydration",
    "simulated-health-pulse",
    "simulated-companion"
  ],
  generatedAt: "2026-07-20T12:00:00Z",
  isMock: true
};

export const companionInsights: readonly CompanionInsight[] = [
  {
    id: "companion-morning-brief",
    type: "morning-brief",
    tone: "encouraging",
    priority: "normal",
    surfaces: ["home", "companion"],
    title: "Awali hari dengan satu langkah",
    message: "Health Pulse-mu meningkat bertahap. Jalan pagi ringan dan sarapan seimbang dapat menjadi pilihan berikutnya.",
    shortMessage: "Jalan pagi ringan atau sarapan seimbang dapat menjadi langkah berikutnya.",
    recommendedActionLabel: "Mulai Aktivitas",
    recommendedActionPath: "/aktivitas",
    status: "active",
    occurredAt: "2026-07-20T07:00:00Z"
  },
  {
    id: "companion-activity-reflection",
    type: "activity-reflection",
    tone: "reflective",
    priority: "normal",
    surfaces: ["activity", "companion"],
    title: "Konsistensi lebih berarti hari ini",
    message: "Kamu menyelesaikan jalan pagi terverifikasi di tengah jadwal sibuk. Konsistensi seperti ini lebih berarti daripada sesekali berlatih terlalu berat.",
    shortMessage: "Hal terpenting adalah tetap bergerak pada hari biasa.",
    recommendedActionLabel: "Lihat Aktivitas",
    recommendedActionPath: "/aktivitas",
    sourceReference: {
      sourceType: "activity",
      sourceId: "journey-morning-walk",
      title: "Jalan Pagi"
    },
    status: "active",
    occurredAt: "2026-07-20T07:15:00Z"
  },
  {
    id: "companion-nutrition-insight",
    type: "nutrition-insight",
    tone: "informative",
    priority: "normal",
    surfaces: ["nutrition", "home", "companion"],
    title: "Progres protein meningkat",
    message: "Pola proteinmu membaik hari ini. Data hidrasi belum lengkap, jadi ringkasan gizi masih dapat berubah.",
    shortMessage: "Protein membaik, sementara data hidrasi belum lengkap.",
    status: "active",
    occurredAt: "2026-07-20T08:30:00Z"
  },
  {
    id: "companion-recovery-insight",
    type: "recovery-insight",
    tone: "recovery-focused",
    priority: "normal",
    surfaces: ["health-pulse", "home", "companion"],
    title: "Pemulihan tetap menjadi fokus",
    message: "Pola pemulihan tampak sedikit lebih baik daripada kemarin. Aktivitas ringan dapat membantu menjaga keseimbangan.",
    shortMessage: "Pace yang lebih ringan dapat membantu menjaga keseimbangan.",
    status: "active",
    occurredAt: "2026-07-20T10:15:00Z"
  },
  {
    id: "companion-consistency-insight",
    type: "consistency-insight",
    tone: "celebratory",
    priority: "normal",
    surfaces: ["journey", "home", "companion"],
    title: "Tujuh hari mulai menjadi rutinitas",
    message: "Tujuh hari tindakan sehat mulai membentuk rutinitas yang lebih kuat.",
    shortMessage: "Konsistensi mulai menjadi bagian dari keseharianmu.",
    status: "active",
    occurredAt: "2026-07-19T20:00:00Z"
  },
  {
    id: "companion-journey-reflection",
    type: "journey-reflection",
    tone: "reflective",
    priority: "normal",
    surfaces: ["journey", "companion"],
    title: "Perjalanan ini lebih dari satu aktivitas",
    message: "Perjalanan ini menunjukkan bahwa kamu tetap melanjutkan kebiasaan pada hari biasa.",
    shortMessage: "Maknanya ada pada keberlanjutan, bukan hanya angka.",
    sourceReference: {
      sourceType: "journey",
      sourceId: "journey-morning-walk",
      title: "Jalan Pagi"
    },
    status: "active",
    occurredAt: "2026-07-20T12:30:00Z"
  },
  {
    id: "companion-health-pulse-interpretation",
    type: "health-pulse-interpretation",
    tone: "informative",
    priority: "normal",
    surfaces: ["health-pulse", "companion"],
    title: "Aktivitas mendukung Pulse hari ini",
    message: "Health Pulse meningkat 1,2 poin, terutama dari aktivitas dan konsistensi. Pemulihan menjadi fokus berikutnya.",
    shortMessage: "Health Pulse naik 1,2 dengan pemulihan sebagai fokus berikutnya.",
    status: "active",
    occurredAt: "2026-07-20T12:00:00Z"
  },
  {
    id: "companion-challenge-guidance",
    type: "challenge-guidance",
    tone: "encouraging",
    priority: "normal",
    surfaces: ["challenge", "companion"],
    title: "Tantanganmu sudah lebih dari separuh",
    message: "Tantangan kardio ringan sudah mencapai 7,2 dari 10 kilometer. Jalan singkat dapat menambah progres tanpa latihan berat.",
    shortMessage: "Jalan singkat dapat menambah progres tanpa latihan berat.",
    recommendedActionLabel: "Lihat Tantangan",
    recommendedActionPath: "/challenge",
    status: "active",
    occurredAt: "2026-07-19T16:30:00Z"
  },
  {
    id: "companion-safety-reminder",
    type: "safety-reminder",
    tone: "cautious",
    priority: "safety",
    surfaces: ["activity", "companion"],
    title: "Keamanan selalu lebih penting",
    message: "Jika merasa nyeri, pusing, atau tidak nyaman saat beraktivitas, berhenti dan cari bantuan yang sesuai.",
    shortMessage: "Hentikan aktivitas jika tubuh terasa tidak nyaman.",
    status: "active",
    occurredAt: "2026-07-20T06:00:00Z"
  },
  {
    id: "companion-general-guidance",
    type: "general-guidance",
    tone: "calm",
    priority: "low",
    surfaces: ["companion", "profile"],
    title: "Langkah kecil cukup untuk melanjutkan",
    message: "Kamu tidak membutuhkan hari yang sempurna. Satu tindakan sehat yang realistis tetap berarti.",
    shortMessage: "Satu tindakan sehat yang realistis tetap berarti.",
    status: "active",
    occurredAt: "2026-07-18T12:00:00Z"
  }
];

export const currentWeeklyLetter: CompanionWeeklyLetter = {
  id: "weekly-letter-current",
  title: "Surat Mingguanmu",
  greeting: "Halo Fathan,",
  opening: "Minggu ini menunjukkan progres yang stabil tanpa perubahan ekstrem.",
  highlights: [
    "Jalan pagi terverifikasi mendukung pola aktivitasmu.",
    "Konsistensi protein meningkat pada catatan yang dikonfirmasi.",
    "Tujuh hari tindakan sehat mulai menjadi rutinitas yang lebih kuat."
  ],
  growthArea: "Pemulihan dan kelengkapan hidrasi masih menjadi area yang dapat diperbaiki.",
  nextWeekFocus: "Pilih satu aktivitas ringan dan satu tindakan hidrasi yang realistis pada hari sibuk.",
  closing: "Langkah kecil mulai menjadi bagian dari kebiasaanmu. Mari lanjutkan minggu depan.",
  periodStart: "2026-07-13T00:00:00Z",
  periodEnd: "2026-07-19T23:59:59Z",
  status: "active",
  isMock: true
};
