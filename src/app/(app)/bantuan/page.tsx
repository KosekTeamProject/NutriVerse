"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Sparkles, BookOpen, Compass, Info, Play, MessageCircle } from "lucide-react";
import { HELP_CATEGORIES, HELP_FAQS } from "@/features/help/data";
import { HelpAccordion } from "@/components/help/HelpAccordion";
import { useGuidedTour } from "@/providers/GuidedTourProvider";

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { startTour } = useGuidedTour();

  const query = searchQuery.toLowerCase();

  const filteredCategories = HELP_CATEGORIES.filter(c => 
    c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query)
  );

  const filteredFaqs = HELP_FAQS.filter(f => 
    f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-16 lg:space-y-24">
      
      {/* SECTION 1: Hero & Search */}
      <section className="text-center pt-8">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand mb-6">
          <BookOpen className="h-6 w-6" />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Pusat Bantuan NutriVerse
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Apa yang ingin kamu pelajari hari ini? Temukan jawaban untuk menemani perjalanan sehatmu.
        </p>
        
        <div className="relative mx-auto mt-10 max-w-2xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full border-2 border-line bg-card py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 transition-all shadow-sm"
            placeholder="Cari artikel, fitur, panduan, XP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* SECTION 2: Kategori Bantuan */}
      {(filteredCategories.length > 0 || !searchQuery) && (
        <section>
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Jelajahi Fitur</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link 
                  key={category.id} 
                  href={`/bantuan/${category.id}`}
                  className="group relative flex flex-col rounded-2xl border border-line bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/50 hover:shadow-md"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-brand-soft group-hover:text-brand transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-foreground group-hover:text-brand transition-colors">{category.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground flex-grow">{category.description}</p>
                  <p className="mt-4 text-xs font-semibold text-brand opacity-0 group-hover:opacity-100 transition-opacity">
                    Pelajari lebih lanjut &rarr;
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 3: Panduan Memulai */}
      {!searchQuery && (
        <section className="rounded-3xl border border-brand/20 bg-brand-soft/30 p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
            <Compass className="h-64 w-64 text-brand" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
              <Compass className="h-6 w-6 text-brand" /> Panduan Pengguna Baru
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Selamat datang di NutriVerse! Kami mengerti bahwa memulai kebiasaan baru bisa terasa membingungkan. Jangan khawatir, kami akan memandu langkah pertamamu.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link href="/bantuan/workflow-dasar" className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-line hover:border-brand transition">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">1</span>
                <span className="font-medium text-sm">Cara Kerja NutriVerse (Pemula)</span>
              </Link>
              <Link href="/bantuan/dashboard" className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-line hover:border-brand transition">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">2</span>
                <span className="font-medium text-sm">Membaca Dashboard</span>
              </Link>
              <Link href="/bantuan/aktivitas" className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-line hover:border-brand transition">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">3</span>
                <span className="font-medium text-sm">Merekam Aktivitas & GPS</span>
              </Link>
              <Link href="/bantuan/nora-ai" className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-line hover:border-brand transition">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 font-bold text-brand">4</span>
                <span className="font-medium text-sm">Berkenalan dengan Nora AI</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: FAQ */}
      {(filteredFaqs.length > 0 || !searchQuery) && (
        <section id="faq">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Pertanyaan Populer (FAQ)</h2>
            <p className="mt-2 text-muted-foreground">Jawaban cepat untuk pertanyaan yang sering diajukan.</p>
          </div>
          <HelpAccordion faqs={filteredFaqs} />
        </section>
      )}

      {/* No Results State */}
      {searchQuery && filteredCategories.length === 0 && filteredFaqs.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-4">
            <Search className="h-8 w-8" />
          </div>
          <h3 className="font-bold text-xl">Tidak ada hasil yang ditemukan</h3>
          <p className="mt-2 text-muted-foreground">Coba gunakan kata kunci lain seperti "XP", "Dashboard", atau "Nora".</p>
        </div>
      )}

      {/* SECTION 9: Replay Guided Tour */}
      {!searchQuery && (
        <section className="rounded-3xl bg-gradient-to-br from-brand to-lime p-8 sm:p-12 text-center text-white shadow-premium relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white blur-3xl mix-blend-overlay"></div>
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-black blur-3xl mix-blend-overlay"></div>
          </div>
          <div className="relative z-10">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur mb-6 border border-white/30 shadow-sm">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Belajar Bersama Nora</h2>
            <p className="mt-4 text-white/90 max-w-lg mx-auto leading-relaxed">
              Biarkan Nora mengajakmu berkeliling aplikasi untuk mengenalkan seluruh fitur secara langsung melalui tur interaktif.
            </p>
            <button 
              onClick={startTour}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-brand shadow-lg hover:bg-white/90 hover:scale-105 transition-all"
            >
              <Play className="h-5 w-5" />
              Mulai Tur Bersama Nora
            </button>
          </div>
        </section>
      )}

      {/* SECTION 8: Hubungi Kami */}
      {!searchQuery && (
        <section id="kontak" className="text-center pt-8 border-t border-line/50">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground mb-4">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold">Masih membutuhkan bantuan?</h2>
          <p className="mt-2 text-muted-foreground mb-6">
            Tim NutriVerse (dan manusia asli di baliknya) siap membantumu kapan saja.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="mailto:support@nutriverse.com" className="btn btn-secondary shadow-sm font-medium">
              Email Support
            </Link>
            <Link href="#" className="btn btn-ghost border border-line font-medium hover:border-brand/50">
              Laporkan Bug
            </Link>
          </div>
        </section>
      )}

    </div>
  );
}
