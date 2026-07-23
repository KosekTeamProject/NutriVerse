import { CommunityHub } from "@/components/app/CommunityFeed";

export default function KomunitasPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Komunitas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ikuti event, dukung teman, dan lihat peringkat dalam satu ruang bersama.
        </p>
      </div>

      <div data-tour="community-leaderboard">
        <CommunityHub />
      </div>
    </div>
  );
}
