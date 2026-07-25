import { CommunityHub } from "@/components/app/CommunityFeed";
import { NutriVerseMoments } from "@/components/app/NutriVerseMoments";

export default function KomunitasPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1440px] space-y-6">
      
      {/* Hero Section: NutriVerse Moments */}
      <div className="animate-fade-up-premium">
        <NutriVerseMoments />
      </div>

      <div data-tour="community-leaderboard" className="animate-fade-up" style={{ animationDelay: '100ms' }}>
        <CommunityHub />
      </div>
      
    </div>
  );
}
