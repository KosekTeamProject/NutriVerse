"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { 
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
  "Apa aktivitas pemulihan yang ringan?",
  "Bagaimana target jalan pagiku?",
  "Jelaskan hasil pindai makanan terakhir."
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
    return "Health Pulse-mu naik menjadi 78 karena aktivitas mingguan lebih konsisten. Nutrisi, tidur, hidrasi, dan pengelolaan berat tetap ikut membentuk nilainya.";
  }

  if (q.includes("jalan") || q.includes("walk") || q.includes("aktivitas") || q.includes("target")) {
    return "Hari ini kamu telah berjalan 1,4 km dari target 2 km. Jika tubuhmu nyaman, sisa 600 meter dapat diselesaikan dengan pace ringan.";
  }

  if (q.includes("protein") || q.includes("gizi") || q.includes("nutrisi") || q.includes("progres")) {
    return "Protein tercatat 56 g dari target 80 g. Kamu dapat melengkapinya lewat pilihan makanan yang sesuai kebutuhanmu.";
  }

  if (q.includes("pemulihan") || q.includes("recovery") || q.includes("istirahat") || q.includes("ringan")) {
    return "Coba peregangan ringan 1–10 menit atau berjalan santai. Berhenti jika terasa sakit, pusing, atau tidak nyaman.";
  }

  if (q.includes("challenge") || q.includes("tantangan") || q.includes("hitung")) {
    return "Tantangan kardio ringanmu sudah 72%. Hanya aktivitas GPS yang lolos validasi yang menambah progres.";
  }

  if (q.includes("scan") || q.includes("makanan") || q.includes("sarapan") || q.includes("breakfast") || q.includes("hasil")) {
    return "Hasil pindai sarapan memperkirakan 430 kkal, 24 g protein, dan 49 g karbohidrat. Jika ingin bergerak, jalan santai 10–15 menit dapat menjadi pilihan—bukan kewajiban atau kompensasi makanan.";
  }

  return "Fokus pada satu langkah kecil hari ini: cukup minum, bergerak ringan, atau menyiapkan waktu tidur. Konsistensi lebih penting daripada latihan berlebihan.";
}

function ChatSection() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysis");
  const journeyId = searchParams.get("journey");
  const journeyTitle = searchParams.get("journeyTitle");
  const suggestedPrompt = searchParams.get("prompt");
  const { displayName } = useCompanionName();

  const [messages, setMessages] = useState<Msg[]>(() => [
    { role: "ai", text: `Halo Fathan, aku ${displayName}. Apa yang ingin kamu pahami hari ini?`, time: "Baru saja" }
  ]);
  const [input, setInput] = useState(() => suggestedPrompt ?? "");
  const [isTyping, setIsTyping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const contextLabel: string | null = useMemo(() => {
    if (journeyId) return `Konteks Journey: ${journeyTitle || "Catatan Journey terpilih"}`;
    if (!analysisId) return null;
    if (analysisId.includes("breakfast")) return "Konteks: Sarapan Seimbang \u00b7 430 kkal";
    if (analysisId.includes("chicken")) return "Konteks: Nasi Ayam Panggang \u00b7 520 kkal";
    if (analysisId.includes("soup")) return "Konteks: Sup Sayur \u00b7 220 kkal";
    return "Konteks: Hasil Analisis Makanan Terakhir";
  }, [analysisId, journeyId, journeyTitle]);
  const [contextDismissed, setContextDismissed] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
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

  if (!chatOpen) {
    return (
      <div id="chat" className="card card-pad flex flex-wrap items-center justify-between gap-3 border-brand/20 bg-brand-soft/20">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand"><MessageSquare className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-bold text-foreground">Percakapan ditutup</p>
            <p className="text-xs text-muted-foreground">Pesan tetap tersimpan selama halaman ini terbuka.</p>
          </div>
        </div>
        <button onClick={() => setChatOpen(true)} className="btn btn-primary btn-sm">Buka Percakapan</button>
      </div>
    );
  }

  return (
    <div id="chat" className="card card-pad min-w-0 scroll-mt-24 space-y-4 border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line/45 pb-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
          <MessageSquare className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold text-foreground">Percakapan dengan {displayName}</h2>
          <p className="text-xs text-muted-foreground">Tanyakan aktivitas, nutrisi, atau pemulihan.</p>
        </div>
        <button onClick={() => setChatOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Tutup percakapan cepat">
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Safety boundaries banner */}
      <div className="flex items-center gap-2.5 rounded-xl border border-line bg-secondary/35 px-3 py-2 text-[10px] text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-brand" />
        <p><span className="font-bold text-foreground">Batas panduan:</span> {displayName} tidak mendiagnosis penyakit atau memverifikasi GPS.</p>
      </div>

      {/* Context preview tag */}
      {contextLabel && !contextDismissed && (
        <div className="flex items-center justify-between rounded-xl border border-brand/15 bg-brand/5 px-3 py-2 text-xs">
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
      <div className="flex min-w-0 items-end gap-2 pt-1">
        <textarea 
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Tanyakan sesuatu kepada ${displayName}… (Shift+Enter untuk baris baru)`}
          disabled={isTyping}
          className="input min-h-[42px] min-w-0 flex-1 resize-none py-2 text-xs max-h-32"
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

      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Info className="h-3.5 w-3.5" /> Respons pada MVP masih berupa simulasi terstruktur.</p>
    </div>
  );
}

export default function CompanionHubPage() {
  const { displayName } = useCompanionName();

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-6 animate-fade-up-premium">
      {/* Page Header */}
      <div className="border-b border-line/40 pb-5">
        <span className="eyebrow mb-3">Pendamping Kesehatan</span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {displayName}, Teman Sehatmu
        </h1>
        <p className="mt-1.5 text-muted-foreground text-sm font-medium">
          Tanyakan hal sederhana dan dapatkan satu langkah yang relevan.
        </p>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3">
        {/* Main column: chat first, concise supporting insights second. */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Suspense fallback={
            <div className="card card-pad flex flex-col items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          }>
            <ChatSection />
          </Suspense>

          <CompanionHubContainer insights={companionInsights} />
        </div>

        {/* Sidebar widgets */}
        <div className="min-w-0 space-y-6">
          {/* Weekly Letter Preview */}
          <CompanionWeeklyLetterPreview letter={currentWeeklyLetter} />

          {/* Safety Reminder */}
          <CompanionSafetyNote />

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
