import { SettingsPanel } from "@/components/app/SettingsPanel";

export default function PengaturanPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Kelola profil, target, tampilan, notifikasi, dan privasi akunmu.</p>
      </div>

      <div data-tour="settings-area">
        <SettingsPanel />
      </div>
    </div>
  );
}
