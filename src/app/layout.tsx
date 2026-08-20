import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: "NutriVerse | Perjalanan Sehat dengan Progres yang Terasa Nyata",
  description: "Progressive Web App kesehatan berbasis gamifikasi untuk aktivitas, nutrisi, challenge, komunitas, dan progres CHPS yang transparan.",
  keywords: ["NutriVerse", "kesehatan digital", "gamifikasi kesehatan", "PWA", "activity tracker", "CHPS"],
  applicationName: "NutriVerse",
  authors: [{ name: "Tim KOSEK - Universitas AMIKOM Yogyakarta" }],
  openGraph: {
    title: "NutriVerse | Perjalanan Sehat yang Lebih Menarik",
    description: "Bangun kebiasaan sehat melalui aktivitas tervalidasi, progres CHPS, nutrisi, challenge, dan komunitas.",
    type: "website",
    locale: "id_ID",
    siteName: "NutriVerse",
  },
  twitter: {
    card: "summary",
    title: "NutriVerse | Perjalanan Sehat yang Lebih Menarik",
    description: "Aktivitas, nutrisi, challenge, dan progres kesehatan dalam satu PWA yang transparan.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('nv-theme');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||(!s&&m))document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
