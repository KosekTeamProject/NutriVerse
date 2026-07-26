"use client";

import { useState, useEffect } from "react";
import { Send, MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useProgressData } from "@/providers/ProgressDataProvider";

export function AIChat() {
  const session = useAuthSession();
  const { overview } = useProgressData();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    let storedSessionId = localStorage.getItem("nutriverse_chat_session");
    if (!storedSessionId) {
      storedSessionId = "session-" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("nutriverse_chat_session", storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    const companionName = session?.companionName || "Nora"; // Nama AI diubah secara dinamis

    const userContext = {
      username: session?.username,
      name: session?.name,
      bmi: session?.baseline?.bmi,
      weight: session?.baseline?.weightKg,
      height: session?.baseline?.heightCm,
      goal: session?.baseline?.goal,
      activityLevel: session?.baseline?.activityLevel,
      preferredActivities: session?.preferences?.preferredActivities,
    };

    const progress = overview?.daily ? 
      `Langkah: ${overview.daily.steps.value} (Target: ${overview.daily.steps.target}), ` +
      `Air: ${overview.daily.water.value}ml (Target: ${overview.daily.water.target}), ` +
      `Tidur: ${overview.daily.sleep.value} jam (Target: ${overview.daily.sleep.target}), ` +
      `Kalori: ${overview.daily.calories.value} kkal (Target: ${overview.daily.calories.target})` 
      : "belum ada data hari ini";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, sessionId, companionName, userContext, progress }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "ai", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "ai", content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { role: "ai", content: "Terjadi kesalahan pada jaringan." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed ${pathname === "/komunitas" ? "bottom-44" : "bottom-24"} right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end`}>
      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] mb-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-zinc-950 flex flex-col h-[500px] transition-all duration-300 animate-in slide-in-from-bottom-5">
          <div className="bg-emerald-600 p-4 text-white font-semibold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl">👩‍⚕️</span>
              </div>
              <div>
                <h2 className="text-sm font-bold">{session?.companionName || "Nora"} (AI Nutriverse)</h2>
                <p className="text-xs text-emerald-100 font-normal">Tanya seputar nutrisi</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-emerald-700 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-900/50">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-zinc-500 my-auto flex flex-col items-center gap-3">
                <span className="text-4xl opacity-80">🥗</span>
                <p>Halo! Saya {session?.companionName || "Nora"}, asisten gizi Anda.<br/>Ada yang bisa saya bantu hari ini?</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`max-w-[85%] p-3 text-sm ${
                    msg.role === "user" 
                      ? "bg-emerald-600 text-white self-end rounded-2xl rounded-tr-sm shadow-sm" 
                      : "bg-white border border-zinc-200 text-zinc-800 self-start rounded-2xl rounded-tl-sm shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  {msg.content}
                </div>
              ))
            )}
            {isLoading && (
              <div className="text-xs text-zinc-400 self-start flex gap-1 items-center bg-white border border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 p-3 rounded-2xl rounded-tl-sm shadow-sm">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-150"></span>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex gap-2 items-end">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan sesuatu..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm dark:text-zinc-200"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen ? "bg-zinc-800 hover:bg-zinc-700" : "bg-emerald-600 hover:bg-emerald-700"
        } text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
