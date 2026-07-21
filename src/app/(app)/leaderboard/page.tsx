import { Info } from "lucide-react";
import { LeaderboardView } from "@/components/app/LeaderboardView";

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Consistency Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Peringkat berdasarkan konsistensi harian dan aktivitas terverifikasi. Bersaing secara suportif dan aman bersama rekan perjalanan.
        </p>
      </div>

      <LeaderboardView />

      <div className="flex items-start gap-2 rounded-2xl border border-sky/20 bg-sky/5 p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
        <p>Setiap akhir season, sebagian XP direset agar persaingan tetap terbuka bagi semua orang. Badge permanen tetap tersimpan sebagai jejak prestasi.</p>
      </div>
    </div>
  );
}
