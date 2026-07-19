"use client";

import { useState } from "react";
import { Send, Sparkles, Info } from "lucide-react";
import type { LoggedFood } from "./FoodScanner";

type Msg = { role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "Apakah makanan terakhir saya cocok untuk diet?",
  "Berapa lama harus berjalan untuk membakarnya?",
  "Apakah kebutuhan protein hari ini sudah cukup?",
];

/**
 * SIMULASI AI Chat. Pada Fase 5, business logic merakit konteks (riwayat makanan,
 * aktivitas, Health Score, target) lalu mengirim ke Gemini API dan memproses jawabannya.
 */
function simulatedReply(question: string, history: LoggedFood[]): string {
  const last = history[0];
  const totalKcal = history.reduce((s, e) => s + e.nutrition.kcal, 0);
  const totalProtein = history.reduce((s, e) => s + e.nutrition.protein, 0);
  const q = question.toLowerCase();

  if (!last) return "Belum ada riwayat makanan hari ini. Coba catat dulu satu makanan agar saya bisa menganalisisnya.";
  if (q.includes("protein")) return `Total protein tercatat hari ini sekitar ${totalProtein} g. Untuk target umum 60-90 g, ${totalProtein >= 60 ? "kamu sudah di jalur yang baik" : "kamu bisa menambah sumber protein seperti telur atau tempe"}.`;
  if (q.includes("bakar") || q.includes("jalan") || q.includes("berjalan")) return `Untuk ${last.name} (${last.nutrition.kcal} kkal), ${last.activityRec}`;
  if (q.includes("diet") || q.includes("cocok")) return `${last.name} berkontribusi ${last.nutrition.kcal} kkal. ${last.insight}`;
  return `Sejauh ini kamu mencatat ${history.length} makanan dengan total sekitar ${totalKcal} kkal. Ada yang ingin kamu tanyakan soal salah satunya?`;
}

export function AiChat({ history }: { history: LoggedFood[] }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Halo! Saya asisten kesehatanmu. Tanyakan apa saja tentang makanan yang sudah kamu catat." },
  ]);
  const [input, setInput] = useState("");

  function ask(text: string) {
    const q = text.trim();
    if (!q) return;
    const reply = simulatedReply(q, history);
    setMessages((prev) => [...prev, { role: "user", text: q }, { role: "ai", text: reply }]);
    setInput("");
  }

  return (
    <div className="card card-pad">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand"><Sparkles className="h-5 w-5" /></span>
        <div>
          <h2 className="font-display text-base font-bold">AI Chat</h2>
          <p className="text-xs text-muted-foreground">Menjawab berdasarkan riwayat makananmu</p>
        </div>
      </div>

      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "bg-brand text-white" : "bg-secondary text-foreground"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">{s}</button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(input); }}
          placeholder="Tulis pertanyaanmu..."
          className="input flex-1"
        />
        <button onClick={() => ask(input)} className="btn btn-primary shrink-0" aria-label="Kirim"><Send className="h-[18px] w-[18px]" /></button>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-sky/5 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
        <p>Jawaban ini masih simulasi. Pada Fase 5, business logic mengirim konteks ke Gemini API dan memproses hasilnya.</p>
      </div>
    </div>
  );
}
