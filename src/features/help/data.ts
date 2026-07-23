import { 
  LayoutDashboard, 
  CalendarCheck, 
  Heart, 
  Sparkles, 
  ScanLine, 
  PenLine, 
  Activity, 
  Trophy, 
  UsersRound, 
  Gift, 
  Settings, 
  ShieldCheck, 
  Bell 
} from "lucide-react";

export type HelpCategory = {
  id: string;
  title: string;
  description: string;
  icon: any;
  articleCount: number;
};

export type HelpFAQ = {
  id: string;
  question: string;
  answer: string;
};

export type FeatureGuide = {
  id: string;
  title: string;
  fungsi: string;
  tujuan: string;
  caraPenggunaan: string[];
  tips: string;
  bestPractice: string;
  troubleshooting: { issue: string; cause: string; fix: string }[];
};

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: "workflow-dasar", title: "Pemula? Mulai Dari Sini", description: "Pahami cara kerja NutriVerse dalam 3 langkah mudah.", icon: Heart, articleCount: 1 },
  { id: "dashboard", title: "Mulai & Dashboard", description: "Pusat aktivitas dan target harianmu.", icon: LayoutDashboard, articleCount: 4 },
  { id: "health-pulse", title: "Health Pulse", description: "Pahami kompas kesehatan harianmu.", icon: Heart, articleCount: 3 },
  { id: "nora-ai", title: "Nora AI Companion", description: "Teman personal yang selalu siap membantu.", icon: Sparkles, articleCount: 2 },
  { id: "scan", title: "Scan Makanan", description: "Ketahui nutrisi dari apa yang kamu makan.", icon: ScanLine, articleCount: 2 },
  { id: "gps", title: "Aktivitas GPS", description: "Pelacak jalan santai, lari, dan sepeda.", icon: Activity, articleCount: 4 },
  { id: "challenge", title: "Challenge", description: "Tantangan sehat untuk mengumpulkan poin.", icon: Trophy, articleCount: 3 },
  { id: "komunitas", title: "Komunitas & Leaderboard", description: "Berkembang bersama teman lain.", icon: UsersRound, articleCount: 2 },
  { id: "reward", title: "Reward & Health Points", description: "Tukar poinmu dengan hadiah nyata.", icon: Gift, articleCount: 3 },
  { id: "xp-tier", title: "XP & Tier", description: "Sistem leveling dari setiap langkah kecilmu.", icon: ShieldCheck, articleCount: 3 },
  { id: "pengaturan", title: "Pengaturan Akun & Privasi", description: "Kelola profil dan keamanan datamu.", icon: Settings, articleCount: 3 },
  { id: "notifikasi", title: "Notifikasi & Reminder", description: "Cara kami membantumu tetap ingat.", icon: Bell, articleCount: 2 },
];

export const HELP_FAQS: HelpFAQ[] = [
  {
    id: "faq-pulse",
    question: "Apa itu Health Pulse?",
    answer: "Health Pulse adalah angka kompas kesehatanmu. Alih-alih menghakimi apakah kamu 'gagal' atau 'berhasil' diet hari ini, Health Pulse merangkum aktivitas, nutrisi, hidrasi, dan tidurmu menjadi satu angka untuk menunjukkan arah pola hidupmu."
  },
  {
    id: "faq-hp",
    question: "Apa itu Health Point (HP)?",
    answer: "Health Point adalah mata uang yang kamu dapatkan ketika berhasil menyelesaikan target kebiasaan baik, seperti minum cukup air atau cukup tidur. HP ini nantinya bisa ditukar di Toko Hadiah."
  },
  {
    id: "faq-xp",
    question: "Apa beda XP dan HP?",
    answer: "XP (Experience Points) hanya didapatkan dari aktivitas fisik tervalidasi GPS (berjalan, berlari, bersepeda). XP menentukan tingkat/Tier kamu. Sedangkan HP didapatkan dari tantangan pola hidup (makan, minum) yang bisa dibelanjakan untuk hadiah."
  },
  {
    id: "faq-tier",
    question: "Bagaimana cara naik Tier?",
    answer: "Kamu akan naik Tier secara otomatis ketika akumulasi XP dari aktivitas fisikmu telah memenuhi ambang batas Tier berikutnya. Tier tidak akan pernah turun, jadi kamu selalu dihargai atas keringatmu."
  },
  {
    id: "faq-challenge",
    question: "Bagaimana sistem Challenge bekerja?",
    answer: "Setiap hari atau minggu, Nora akan menyiapkan kartu tantangan (Challenge). Tantangan ini bersifat opsional dan dirancang untuk membantu fokusmu (misal: Jalan 2 km atau Minum 2 liter). Menyelesaikannya akan memberimu HP atau XP tambahan."
  },
  {
    id: "faq-gps",
    question: "Bagaimana GPS menghasilkan XP?",
    answer: "Saat kamu menyalakan perekam aktivitas di menu Aktivitas, aplikasi akan mengukur jarak tempuh dan kecepatanmu (pace) lewat satelit GPS di hp-mu. Sistem akan memvalidasi aktivitas nyata dan memberikan XP sesuai kerja kerasmu."
  },
  {
    id: "faq-scan-noxp",
    question: "Mengapa scan makanan tidak memberi XP?",
    answer: "NutriVerse tidak ingin memicu gangguan makan (eating disorder). Scan makanan dibuat murni untuk memberimu informasi dan kesadaran (awareness). XP hanya diberikan untuk tindakan fisik yang nyata membakar energi."
  },
  {
    id: "faq-nora",
    question: "Bagaimana Nora membantu saya?",
    answer: "Nora bukan sekadar chatbot. Dia akan menganalisis tren harianmu, mengirim pesan pengingat yang menyemangati (bukan menyuruh), dan menyajikan rekomendasi (seperti: 'Makan siangmu cukup berat, jalan santai 10 menit yuk')."
  },
  {
    id: "faq-privacy",
    question: "Apakah data saya aman?",
    answer: "Sangat aman. NutriVerse menggunakan lokasi GPS hanya selama kamu merekam sesi aktivitas. Catatan nutrisi, tidur, dan berat badan secara bawaan diatur privat dan tidak dibagikan ke komunitas kecuali kamu memilih menampilkannya."
  },
  {
    id: "faq-target",
    question: "Bagaimana mengubah target kesehatan?",
    answer: "Kamu bisa masuk ke menu Pengaturan, lalu pilih Profil & Target. Dari sana kamu bisa memperbarui berat badan ideal, target langkah harian, maupun asupan kalori air putih."
  },
  {
    id: "faq-tour",
    question: "Bagaimana mengulang Guided Tour Nora?",
    answer: "Sangat mudah. Buka menu Pengaturan, cari bagian Bantuan, dan klik tombol 'Tur Bersama Nora'. Atau kamu juga bisa memulainya dari bagian bawah halaman Pusat Bantuan ini."
  }
];

export const FEATURE_GUIDES: FeatureGuide[] = [
  {
    id: "workflow-dasar",
    title: "Pemula? Pahami Cara Kerja NutriVerse",
    fungsi: "Menjelaskan siklus sederhana bagaimana aplikasi ini membantumu menjadi lebih sehat tanpa tekanan.",
    tujuan: "Agar kamu tidak bingung dan tahu apa yang harus dilakukan setelah mendaftar, selangkah demi selangkah.",
    caraPenggunaan: [
      "1. AWAL HARI: Buka aplikasi, dan baca pesan dari Nora di halaman Dashboard. Nora akan memberimu rekomendasi ringan, misalnya 'Ayo minum 2 gelas air pagi ini'.",
      "2. SAAT MAKAN: Buka menu 'Scan Makanan' dan foto makananmu. Nora akan memberi tahu nutrisinya agar kamu lebih sadar (aware) dengan apa yang kamu makan. Tidak ada hukuman jika makananmu kurang sehat!",
      "3. SAAT BERGERAK: Saat kamu jalan pagi atau bersepeda, buka menu 'Aktivitas GPS', tekan 'Mulai', dan kantongi HP-mu. NutriVerse akan mengubah keringatmu menjadi XP (Experience Points).",
      "4. NAIK LEVEL: Kumpulkan XP untuk naik ke Tier lebih tinggi (seperti game!). Kumpulkan HP (Health Points) dari misi harian untuk ditukar dengan hadiah nyata di menu 'Hadiah'."
    ],
    tips: "Jangan mencoba melakukan semuanya di hari pertama. Cukup mulai dengan minum air yang cukup, lalu rekam jika kamu berjalan kaki.",
    bestPractice: "NutriVerse BUKAN aplikasi yang menghakimi dietmu. Kami merayakan usaha (progress) walau sekecil apapun. Jadi, nikmati saja prosesnya bersama Nora!",
    troubleshooting: []
  },
  {
    id: "dashboard",
    title: "Dashboard & Hari Ini",
    fungsi: "Menjadi rumah utama dan ringkasan kondisi hari ini.",
    tujuan: "Memberikan pandangan yang jelas dan tidak membebani tentang apa yang bisa kamu capai hari ini dalam sekali lihat.",
    caraPenggunaan: [
      "Buka aplikasi, halaman pertama yang muncul adalah Dashboard.",
      "Lihat kotak sapaan dari Nora untuk panduan utama hari ini.",
      "Cek widget cepat untuk mengetahui status langkah, air, dan kalori."
    ],
    tips: "Pilih 1 atau 2 target saja di Dashboard untuk difokuskan. Jangan merasa harus mengisi semuanya penuh.",
    bestPractice: "Gunakan Dashboard di pagi hari untuk melihat pesan 'Hari Ini' dari Nora, lalu lupakan aplikasinya sampai sore hari.",
    troubleshooting: []
  },
  {
    id: "aktivitas",
    title: "Aktivitas Fisik & GPS",
    fungsi: "Merekam jarak, waktu, dan rute untuk diubah menjadi XP.",
    tujuan: "Menghargai usaha fisikmu secara adil berdasarkan pergerakan nyata.",
    caraPenggunaan: [
      "Buka menu Aktivitas dari navigasi.",
      "Pilih jenis aktivitas (Jalan, Lari, atau Sepeda).",
      "Tekan 'Mulai' dan biarkan handphone menyala di sakumu.",
      "Tekan 'Selesai' saat usai, dan XP akan dikalkulasi."
    ],
    tips: "Pastikan GPS atau Lokasi di handphone-mu dalam keadaan aktif dan disetel ke akurasi tinggi.",
    bestPractice: "Rekam aktivitas meskipun hanya berjalan ringan 10 menit ke warung. Setiap langkah dihitung!",
    troubleshooting: [
      {
        issue: "GPS tidak berjalan / tidak merekam jarak",
        cause: "Izin lokasi browser/aplikasi belum diberikan, atau sedang berada di dalam ruangan.",
        fix: "Pastikan mengizinkan 'Location' pada pop-up browser, dan bergeraklah ke luar ruangan di bawah langit terbuka."
      },
      {
        issue: "Tidak mendapat XP setelah aktivitas",
        cause: "Jarak terlalu dekat (di bawah 100 meter) atau sistem mendeteksi kecepatan tidak wajar (naik motor tapi memilih jalan kaki).",
        fix: "Sistem validasi kami melindungi agar peringkat tetap adil. Pastikan menggunakan kendaraan yang sesuai dengan mode yang dipilih."
      }
    ]
  },
  {
    id: "scan",
    title: "Scan Makanan AI",
    fungsi: "Mengenali makanan dari foto dan memberikan perkiraan makronutrisi.",
    tujuan: "Membantu kamu lebih peka terhadap apa yang kamu makan tanpa perlu ribet menimbang manual.",
    caraPenggunaan: [
      "Buka menu Scan Makanan.",
      "Pilih ambil foto atau unggah gambar makananmu.",
      "Tunggu beberapa detik, Nora akan menampilkan analisis dan saran."
    ],
    tips: "Semakin terang dan jelas foto makananmu, semakin akurat tebakan Nora.",
    bestPractice: "Gunakan fitur ini untuk belajar. Tidak perlu memfoto 100% semua yang masuk mulutmu jika itu membuat stres. Progress over perfection.",
    troubleshooting: [
      {
        issue: "Scan gagal mengenali makanan",
        cause: "Foto blur, terlalu gelap, atau makanan dibungkus rapat.",
        fix: "Coba foto lagi di tempat terang. Jika makanan terlalu rumit, gunakan Input Manual."
      }
    ]
  }
];
