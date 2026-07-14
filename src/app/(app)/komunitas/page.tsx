import { CommunityFeed } from "@/components/app/CommunityFeed";

export default function KomunitasPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Komunitas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bagikan progres, beri semangat ke teman, dan ikut tantangan komunitas bersama.
        </p>
      </div>

      <CommunityFeed />
    </div>
  );
}
