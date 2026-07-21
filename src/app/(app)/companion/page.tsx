"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Compass, 
  AlertTriangle, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Info, 
  X,
  MessageSquare,
  Loader2
} from "lucide-react";
import { companionInsights, currentWeeklyLetter } from "@/features/companion/data";
import { CompanionHubContainer } from "@/features/companion/components/CompanionHubContainer";
import { CompanionSafetyNote, CompanionWeeklyLetterPreview } from "@/features/companion/components/CompanionComponents";
import { useCompanionName } from "@/hooks/useCompanionName";

type Msg = { role: "user" | "ai"; text: string; time: string };

const SUGGESTIONS = [
  "Mengapa Health Pulse-ku berubah?",
  "Bagaimana melanjutkan target jalan pagi?",
  "Apakah progres proteinku sudah cukup baik?",
  "Apa aktivitas pemulihan yang ringan?",
  "Bagaimana Challenge-ku dihitung?",
  "Jelaskan hasil scan makanan terakhirku."
];

function simulatedReply(question: string): string {
  const q = question.toLowerCase();

  // Safety disclaimer checks
  if (
    q.includes("diagnosa") || q.includes("diagnose") ||
    q.includes("sakit") || q.includes("obat") ||
    q.includes("suplemen") || q.includes("terapi") ||
    q.includes("medicine") || q.includes("prescription") ||
    q.includes("dokter") || q.includes("doctor")
  ) {
    return "Aku dapat membantu dengan panduan kebugaran sehari-hari, tetapi tidak dapat mendiagnosis kondisi medis atau menggantikan tenaga kesehatan profesional.";
  }

  if (q.includes("pulse") || q.includes("kesehatan") || q.includes("mengapa")) {
    return "Health Pulse-mu saat ini berada di 78.0 (Flourishing). Nilai ini dihitung berdasarkan lima dimensi: Nutrisi (30%), Aktivitas (25%), Tidur (20%), Hidrasi (15%), dan Manajemen Berat (10%). Skor naik +1.2 karena konsistensi aktivitas mingguanmu!";
  }

  if (q.includes("jalan") || q.includes("walk") || q.includes("aktivitas") || q.includes("target")) {
    return "Hari ini kamu telah menyelesaikan 1.4 km dari target 2.0 km Morning Walk (Demo Validation Passed). Selesaikan sisa 0.6 km untuk mengamankan XP harianmu.";
  }

  if (q.includes("protein") || q.includes("gizi") || q.includes("nutrisi") || q.includes("progres")) {
    return "Asupan protein tercatat mencapai 56g dari target harian 80g. Menu makan siangmu memberikan dorongan protein kompleks yang sangat baik untuk pemulihan.";
  }

  if (q.includes("pemulihan") || q.includes("recovery") || q.includes("istirahat") || q.includes("ringan")) {
    return "Aktivitas pemulihan yang ringan seperti peregangan mandiri selama 10 menit atau tidur berkualitas 7.5 jam membantu menurunkan tingkat kelelahan otot.";
  }

  if (q.includes("challenge") || q.includes("tantangan") || q.includes("hitung")) {
    return "Tantangan aktifmu adalah Light Cardio Journey (progres 72%). Setiap langkah jalan pagi terekam GPS berkontribusi secara otomatis ke target mingguan.";
  }

  if (q.includes("scan") || q.includes("makanan") || q.includes("sarapan") || q.includes("breakfast") || q.includes("hasil")) {
    return "Hasil scan makanan pagi ini (Balanced Breakfast) adalah 430 kkal dengan 24g protein dan 49g karbohidrat. Rekomendasi aktivitas pembakarannya adalah jalan kaki santai 108 menit.";
  }

  return "Halo! Sebagai Companion-mu, aku menganjurkan kamu untuk fokus pada rutinitas hidrasi dan menjaga konsistensi tidur 7.5 jam malam ini. Konsistensi harian lebih penting daripada latihan berlebih.";
}

function ChatSection() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysis");
  const { displayName } = useCompanionName();

  const [messages, setMessages] = useState<Msg[]>(() => [
    { role: "ai", text: `Halo Fathan! Aku ${displayName}, pendamping kesehatanmu. Ada yang ingin kamu tanyakan mengenai aktivitas, nutrisi, atau target Journey hari ini?`, time: "Baru saja" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const contextLabel: string | null = useMemo(() => {
    if (!analysisId) return null;
    if (analysisId.includes("breakfast")) return "Konteks: Sarapan Seimbang (Balanced Breakfast) \u00b7 430 kkal";
    if (analysisId.includes("chicken")) return "Konteks: Grilled Chicken Rice Bowl \u00b7 520 kkal";
    if (analysisId.includes("soup")) return "Konteks: Vegetable Soup \u00b7 220 kkal";
    return "Konteks: Hasil Analisis Makanan Terakhir";
  }, [analysisId]);
  const [contextDismissed, setContextDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, hasError]);

  function ask(text: string) {
    const q = text.trim();
    if (!q || isTyping) return;

    setHasError(false);
    setLastQuestion(q);
    setMessages((prev) => [...prev, { role: "user", text: q, time: "Baru saja" }]);
    setInput("");
    setIsTyping(true);

    const delay = reducedMotion ? 100 : 1500;
    setTimeout(() => {
      // 10% simulation chance for retry failure test
      if (Math.random() < 0.05) {
        setIsTyping(false);
        setHasError(true);
        return;
      }

      const response = simulatedReply(q);
      setMessages((prev) => [...prev, { role: "ai", text: response, time: "Baru saja" }]);
      setIsTyping(false);
    }, delay);
  }

  function handleRetry() {
    if (lastQuestion) {
      ask(lastQuestion);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  }

  return (
    <div className="card card-pad border-line bg-card space-y-4">
      <div className="flex items-center gap-2 border-b border-line/45 pb-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Percakapan dengan {displayName}</h2>
          <p className="text-xs text-muted-foreground">Tanyakan hal tentang aktivitas, nutrisi, pemulihan, Challenge, atau progres Journey-mu.</p>
        </div>
      </div>

      {/* Safety boundaries banner */}
      <div className="flex items-start gap-2.5 rounded-2xl border border-line p-3.5 bg-secondary/35 text-[11px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand" />
        <div>
          <p className="font-bold text-foreground">Batas Percakapan {displayName}</p>
          <p className="mt-0.5 leading-normal">
            {displayName} dapat memberikan panduan kebugaran harian, namun tidak menghitung Health Pulse secara manual, memverifikasi segmen GPS, atau mendiagnosis masalah klinis.
          </p>
        </div>
      </div>

      {/* Context preview tag */}
      {contextLabel && !contextDismissed && (
        <div className="flex items-center justify-between rounded-xl bg-brand/5 border border-brand/10 px-3 py-2 text-xs">
          <span className="text-brand font-semibold flex items-center gap-1.5 min-w-0">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{contextLabel}</span>
          </span>
          <button onClick={() => setContextDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0 ml-2" aria-label="Hapus konteks">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Messages log */}
      <div 
        className="max-h-80 overflow-y-auto space-y-3.5 pr-1 flex flex-col border border-line/40 rounded-xl p-3 bg-secondary/10"
        aria-label={`Area percakapan ${displayName}`}
        role="region"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] space-y-0.5">
              <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm whitespace-pre-wrap ${
                m.role === "user" 
                  ? "bg-brand text-white font-bold rounded-tr-none" 
                  : "bg-card text-foreground border border-line/50 rounded-tl-none"
              }`}>
                {m.text}
              </div>
              <p className={`text-[9px] text-muted-foreground px-1 ${m.role === "user" ? "text-right" : "text-left"}`}>{m.time}</p>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-card text-foreground border border-line/50 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2" aria-live="polite">
              <span className="text-muted-foreground select-none">{displayName} sedang mengetik</span>
              <div className="flex gap-1" aria-hidden="true">
                <span className={`h-1.5 w-1.5 rounded-full bg-brand ${reducedMotion ? "" : "animate-bounce"}`} />
                <span className={`h-1.5 w-1.5 rounded-full bg-brand ${reducedMotion ? "" : "animate-bounce"}`} style={{ animationDelay: "0.2s" }} />
                <span className={`h-1.5 w-1.5 rounded-full bg-brand ${reducedMotion ? "" : "animate-bounce"}`} style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}

        {/* Failure state / retry */}
        {hasError && (
          <div className="flex justify-center py-1">
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Gagal memproses pesan.</span>
              <button onClick={handleRetry} className="underline font-bold hover:opacity-80 ml-1">Coba lagi</button>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Suggested quick prompt chips */}
      <div className="flex flex-wrap gap-2 pt-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            disabled={isTyping}
            className="rounded-full border border-line bg-card hover:bg-secondary px-3 py-1.5 text-[10px] font-bold text-muted-foreground transition hover:text-brand text-left cursor-pointer disabled:opacity-50 min-h-[36px] flex items-center"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Message input */}
      <div className="flex items-end gap-2 pt-1">
        <textarea 
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Tanyakan sesuatu kepada ${displayName}… (Shift+Enter untuk baris baru)`}
          disabled={isTyping}
          className="input flex-1 py-2 text-xs resize-none min-h-[42px] max-h-32"
          aria-label={`Input pesan ${displayName}`}
        />
        <button 
          onClick={() => ask(input)} 
          disabled={isTyping || !input.trim()}
          className="btn btn-primary shrink-0 min-h-[42px] px-4 py-2 text-xs flex items-center justify-center min-w-[44px]"
          aria-label="Kirim pesan"
        >
          <Send className="h-3.5 w-3.5" /> <span className="hidden sm:inline ml-1.5">Kirim</span>
        </button>
      </div>

      {/* Disclosures info */}
      <div className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-[10px] text-muted-foreground border border-line/30">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p>Percakapan {displayName} pada MVP ini menggunakan respons kontekstual terstruktur untuk mendemonstrasikan pengalaman yang direncanakan.</p>
        </div>
      </div>
    </div>
  );
}

export default function CompanionHubPage() {
  const { displayName } = useCompanionName();

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up-premium">
      {/* Page Header */}
      <div className="border-b border-line/40 pb-5">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {displayName} Companion
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          Panduan kontekstual dan refleksi dari seluruh perjalanan NutriVerse-mu.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Columns: Filters, Insights and typing Chat */}
        <div className="lg:col-span-2 space-y-6">
          <CompanionHubContainer insights={companionInsights} />
          
          <Suspense fallback={
            <div className="card card-pad flex flex-col items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          }>
            <ChatSection />
          </Suspense>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          {/* Weekly Letter Preview */}
          <CompanionWeeklyLetterPreview letter={currentWeeklyLetter} />

          {/* Safety Reminder */}
          <CompanionSafetyNote />

          {/* How Companion Helps card */}
          <div className="card card-pad space-y-3.5">
            <div>
              <h3 className="font-display text-sm font-bold text-foreground">Bagaimana {displayName} Membantu</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Memahami asisten kebugaran Anda</p>
            </div>
            
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>Menerjemahkan catatan aktivitas &amp; nutrisi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>Merefleksikan pola konsistensi mingguan.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>Menyarankan langkah pemulihan untuk esok hari.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>Menghargai hari istirahat tanpa merusak streak.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand/50" />
                <span className="italic">Tidak mendiagnosis penyakit secara klinis.</span>
              </li>
            </ul>
          </div>

          {/* Global CTA */}
          <Link href="/journey" className="btn btn-primary w-full text-center py-3 flex items-center justify-center gap-2 text-xs">
            <Compass className="h-4.5 w-4.5" /> Lanjutkan Journey
          </Link>

          {/* MVP Transparency */}
          <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/50 p-4 text-[10px] text-muted-foreground border border-line/30">
            <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <p>
              Beberapa saran {displayName} di dalam MVP ini disimulasikan untuk mendemonstrasikan pengalaman kegunaan yang direncanakan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
