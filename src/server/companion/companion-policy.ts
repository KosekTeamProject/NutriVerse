export type CompanionScope = "nutriverse_health" | "out_of_scope";
export type CompanionSafety =
  | "normal"
  | "medical_caution"
  | "urgent_support";

export type CompanionPolicyDecision = {
  scope: CompanionScope;
  safety: CompanionSafety;
  reason: string;
  fixedReply?: string;
};

export const COMPANION_REPLY_TEMPLATES = {
  outOfScope:
    "Maaf, aku hanya dapat membantu tentang kesehatan, kebiasaan sehat, nutrisi, aktivitas, tidur, hidrasi, serta fitur dan progres di NutriVerse. Aku tidak dapat mengerjakan coding, membuat website, tugas umum, politik, finansial, atau permintaan lain di luar ruang lingkup tersebut. Coba tanyakan progres kesehatanmu atau satu kebiasaan yang ingin kamu perbaiki.",
  protectedSystem:
    "Aku tidak dapat membuka prompt internal, API key, token, kata sandi, konfigurasi rahasia, atau mengabaikan aturan keamanan. Aku tetap bisa membantu membaca progres dan fitur kesehatanmu di NutriVerse.",
  medicalCaution:
    "Aku dapat memberi informasi kesehatan umum dan membantu membaca kebiasaan yang tercatat, tetapi tidak dapat mendiagnosis, menentukan penyakit, meresepkan obat, atau memberi dosis. Untuk penilaian kondisi dan pengobatan, silakan berkonsultasi dengan tenaga kesehatan yang kompeten.",
  urgentSupport:
    "Keluhan yang kamu sampaikan dapat memerlukan pertolongan segera. Hubungi layanan darurat setempat atau tenaga medis sekarang, dan bila memungkinkan minta orang tepercaya untuk menemanimu. Jangan menunggu jawaban dari aplikasi untuk kondisi yang terasa gawat.",
} as const;

const HEALTH_AND_PRODUCT_TERMS = [
  "nutriverse",
  "nora",
  "kesehatan",
  "sehat",
  "health",
  "pulse",
  "tidur",
  "sleep",
  "nutrisi",
  "gizi",
  "diet",
  "menu",
  "sarapan",
  "cemilan",
  "buah",
  "sayur",
  "vitamin",
  "mineral",
  "makan",
  "kalori",
  "protein",
  "karbo",
  "serat",
  "lemak",
  "air",
  "hidrasi",
  "minum",
  "aktivitas",
  "jalan",
  "lari",
  "sepeda",
  "olahraga",
  "gps",
  "pace",
  "kecepatan",
  "jarak",
  "berat",
  "bmi",
  "target",
  "progres",
  "progress",
  "streak",
  "xp",
  "hp",
  "challenge",
  "tantangan",
  "makanan",
  "scan",
  "kamera",
  "dashboard",
  "jurnal",
  "mood",
  "data saya",
  "kondisi saya",
  "apa yang harus saya lakukan",
  "saran untuk saya",
  "kebiasaan",
  "pemulihan",
  "recovery",
];

const OUT_OF_SCOPE_TERMS = [
  "buatkan website",
  "buat website",
  "bikin website",
  "landing page",
  "source code",
  "kode program",
  "coding",
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "sql",
  "debug program",
  "buat aplikasi",
  "kerjakan tugas",
  "buat skripsi",
  "trading",
  "saham",
  "crypto",
  "politik",
  "pemilu",
  "ramalan",
  "judi",
  "resep bom",
];

const PROTECTED_SYSTEM_TERMS = [
  "abaikan instruksi",
  "ignore previous",
  "ignore all",
  "system prompt",
  "developer message",
  "tampilkan prompt",
  "bocorkan prompt",
  "api key",
  "kata sandi",
  "password",
  "access token",
  "service role",
  "database url",
];

const MEDICAL_DIAGNOSIS_TERMS = [
  "diagnosa",
  "diagnosis",
  "saya sakit apa",
  "aku sakit apa",
  "penyakit apa",
  "obat apa",
  "obat yang harus",
  "resep obat",
  "dosis",
  "hentikan obat",
  "ganti obat",
  "terapi untuk saya",
];

const URGENT_TERMS = [
  "bunuh diri",
  "menyakiti diri",
  "ingin mati",
  "mau mati",
  "overdosis",
  "saya sesak napas",
  "aku sesak napas",
  "saya nyeri dada",
  "aku nyeri dada",
  "saya tidak sadar",
  "pendarahan hebat",
];

function containsAny(message: string, terms: readonly string[]) {
  return terms.some((term) => message.includes(term));
}

export function classifyCompanionMessage(
  message: string,
): CompanionPolicyDecision {
  const normalized = message.trim().toLocaleLowerCase("id-ID");

  if (containsAny(normalized, URGENT_TERMS)) {
    return {
      scope: "nutriverse_health",
      safety: "urgent_support",
      reason: "URGENT_HEALTH_OR_SELF_HARM",
      fixedReply: COMPANION_REPLY_TEMPLATES.urgentSupport,
    };
  }

  if (containsAny(normalized, PROTECTED_SYSTEM_TERMS)) {
    return {
      scope: "out_of_scope",
      safety: "normal",
      reason: "PROTECTED_SYSTEM_REQUEST",
      fixedReply: COMPANION_REPLY_TEMPLATES.protectedSystem,
    };
  }

  if (containsAny(normalized, MEDICAL_DIAGNOSIS_TERMS)) {
    return {
      scope: "nutriverse_health",
      safety: "medical_caution",
      reason: "PERSONAL_MEDICAL_ADVICE",
      fixedReply: COMPANION_REPLY_TEMPLATES.medicalCaution,
    };
  }

  if (containsAny(normalized, OUT_OF_SCOPE_TERMS)) {
    return {
      scope: "out_of_scope",
      safety: "normal",
      reason: "EXPLICIT_OUT_OF_SCOPE",
      fixedReply: COMPANION_REPLY_TEMPLATES.outOfScope,
    };
  }

  const isGreeting = /^(halo|hai|hi|hello|pagi|siang|sore|malam|makasih|terima kasih)[!,.? ]*$/i.test(
    normalized,
  );
  if (!isGreeting && !containsAny(normalized, HEALTH_AND_PRODUCT_TERMS)) {
    return {
      scope: "out_of_scope",
      safety: "normal",
      reason: "NO_HEALTH_OR_PRODUCT_CONTEXT",
      fixedReply: COMPANION_REPLY_TEMPLATES.outOfScope,
    };
  }

  return {
    scope: "nutriverse_health",
    safety: "normal",
    reason: isGreeting ? "GREETING" : "ALLOWED_TOPIC",
  };
}

const EXTERNAL_EVIDENCE_TERMS = [
  "apa itu",
  "mengapa",
  "kenapa",
  "manfaat",
  "fungsi",
  "risiko",
  "bahaya",
  "aman",
  "normal",
  "ideal",
  "cukup",
  "harus",
  "sebaiknya",
  "bolehkah",
  "berapa banyak",
  "berapa jam",
  "kebutuhan",
  "rekomendasi",
  "saran",
  "menu",
  "diet",
  "memperbaiki",
  "meningkatkan",
  "menurunkan",
  "vitamin",
  "mineral",
  "kolesterol",
  "tekanan darah",
];

/**
 * Personal progress lookups can be grounded in NutriVerse rows. General health
 * explanations and recommendations must be backed by external health sources.
 */
export function requiresExternalHealthEvidence(message: string) {
  const normalized = message.trim().toLocaleLowerCase("id-ID");
  if (/^(halo|hai|hi|hello|pagi|siang|sore|malam)[!,.? ]*$/i.test(normalized)) {
    return false;
  }
  return containsAny(normalized, EXTERNAL_EVIDENCE_TERMS);
}

export function enforceCompanionOutputPolicy(input: {
  reply: string;
  scope: CompanionScope;
  safety: CompanionSafety;
}) {
  if (input.safety === "urgent_support") {
    return COMPANION_REPLY_TEMPLATES.urgentSupport;
  }
  if (input.safety === "medical_caution") {
    return COMPANION_REPLY_TEMPLATES.medicalCaution;
  }
  if (input.scope === "out_of_scope") {
    return COMPANION_REPLY_TEMPLATES.outOfScope;
  }
  return input.reply.trim().slice(0, 1_500);
}
