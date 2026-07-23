import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

const FOOTER_LINKS = {
  Produk: [
    { label: "Tentang", href: "/" },
    { label: "Fitur", href: "/" },
    { label: "Reward", href: "/reward" },
    { label: "Komunitas", href: "/komunitas" },
  ],
  Fitur: [
    { label: "Health Pulse", href: "/bantuan/health-pulse" },
    { label: "Nora AI", href: "/bantuan/nora-ai" },
    { label: "Challenge", href: "/bantuan/challenge" },
    { label: "Aktivitas GPS", href: "/bantuan/aktivitas" },
  ],
  Bantuan: [
    { label: "Help Center", href: "/bantuan" },
    { label: "FAQ", href: "/bantuan#faq" },
    { label: "Kontak", href: "/bantuan#kontak" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-line/50 bg-card/30 pt-12 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12 mt-16 lg:mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          
          {/* Logo & Description */}
          <div className="space-y-6 xl:col-span-1">
            <BrandLogo />
            <p className="text-sm leading-6 text-muted-foreground max-w-xs">
              AI Health Companion yang menemanimu membangun kebiasaan baik lewat langkah-langkah kecil setiap harinya. No judgment, just progress.
            </p>
          </div>
          
          {/* Link Columns */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-bold text-foreground">Produk</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {FOOTER_LINKS.Produk.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-bold text-foreground">Fitur Utama</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {FOOTER_LINKS.Fitur.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-bold text-foreground">Dukungan</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {FOOTER_LINKS.Bantuan.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-bold text-foreground">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {FOOTER_LINKS.Legal.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Copyright */}
        <div className="mt-16 border-t border-line/50 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} NutriVerse Inc. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
