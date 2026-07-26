import { AppShell } from "@/components/app/AppShell";
import { GuidedTourProvider } from "@/providers/GuidedTourProvider";
import { InteractiveTourOverlay } from "@/components/tour/InteractiveTourOverlay";
import { ProgressDataProvider } from "@/providers/ProgressDataProvider";
import { AIChat } from "@/components/AIChat";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuidedTourProvider>
      <ProgressDataProvider>
        <AppShell>{children}</AppShell>
        <InteractiveTourOverlay />
        <AIChat />
      </ProgressDataProvider>
    </GuidedTourProvider>
  );
}
