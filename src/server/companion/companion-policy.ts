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
  "makro",
  "makronutrisi",
  "mikronutrisi",
  "nilai gizi",
  "kandungan gizi",
  "diet",
  "menu",
  "resep",
  "masak",
  "memasak",
  "bahan makanan",
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
  "ayam",
  "daging",
  "ikan",
  "telur",
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
  "tugas sekolah",
  "tugas kuliah",
  "kerjakan soal",
  "jawab soal",
  "buat makalah",
  "laporan praktikum",
  "jawaban ujian",
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

const CASUAL_COMPANION_PATTERNS = [
  /^(halo|hai|hi|hello|pagi|siang|sore|malam)\b/i,
  /\b(kenalin|kenalan|perkenalkan|nama (aku|saya)|panggil (aku|saya))\b/i,
  /\b(apa kabar|lagi apa|lagi ngapain|sedang apa|kamu siapa|siapa namamu|nama kamu siapa|temani aku|temenin aku|semangatin aku)\b/i,
  /^(terus )?(aku |saya )?(harus |mesti )?(gimana|bagaimana|ngapain)\b/i,
  /\b(bercanda|candaan|tebak-tebakan|lelucon|jokes?|lucu|garing)\b/i,
  /^(wkwk+|haha+|hehe+|hihi+|lol)[!,.? ]*$/i,
  /^(oke|ok|sip|siap|mantap|makasih|terima kasih|noted)[!,.? ]*$/i,
];

export function isCasualCompanionMessage(message: string) {
  const normalized = message.trim().toLocaleLowerCase("id-ID");
  return CASUAL_COMPANION_PATTERNS.some((pattern) => pattern.test(normalized));
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

  const isCasual = isCasualCompanionMessage(normalized);
  if (!isCasual && !containsAny(normalized, HEALTH_AND_PRODUCT_TERMS)) {
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
    reason: isCasual ? "CASUAL_COMPANION_CONVERSATION" : "ALLOWED_TOPIC",
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
  "diet",
  "memperbaiki",
  "meningkatkan",
  "menurunkan",
  "vitamin",
  "mineral",
  "makro",
  "makronutrisi",
  "mikronutrisi",
  "nilai gizi",
  "kandungan gizi",
  "kolesterol",
  "tekanan darah",
];

/**
 * Personal progress lookups can be grounded in NutriVerse rows. General health
 * explanations and recommendations must be backed by external health sources.
 */
export function requiresExternalHealthEvidence(message: string) {
  const normalized = message.trim().toLocaleLowerCase("id-ID");
  if (isCasualCompanionMessage(normalized)) return false;

  const isRecipeOrMenu =
    /\b(resep|menu|cara (masak|memasak|membuat)|bahan makanan)\b/i.test(
      normalized,
    );
  const hasHealthClaim =
    /\b(diet|sehat|kesehatan|nutrisi|gizi|kalori|protein|rendah (gula|garam|lemak|kalori)|tinggi (protein|serat)|turun berat|menurunkan berat|diabetes|kolesterol|tekanan darah)\b/i.test(
      normalized,
  );
  if (isRecipeOrMenu && !hasHealthClaim) return false;

  const asksGeneralGuidance =
    /\b(tidur|sleep|hidrasi|air|minum|nutrisi|gizi|makan|aktivitas|olahraga|jalan|lari|pemulihan|berat badan)\b/u.test(
      normalized,
    ) &&
    /\b(tips|cara|kebiasaan|membantu|menjaga|kualitas|yang baik|yang sehat)\b/u.test(
      normalized,
    );

  return (
    containsAny(normalized, EXTERNAL_EVIDENCE_TERMS) || asksGeneralGuidance
  );
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
