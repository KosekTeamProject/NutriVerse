import { AppShell } from "@/components/app/AppShell";
import { GuidedTourProvider } from "@/providers/GuidedTourProvider";
import { InteractiveTourOverlay } from "@/components/tour/InteractiveTourOverlay";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuidedTourProvider>
      <AppShell>{children}</AppShell>
      <InteractiveTourOverlay />
    </GuidedTourProvider>
  );
}
