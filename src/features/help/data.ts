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
  Bell,
  type LucideIcon,
} from "lucide-react";

export type HelpCategory = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  articleCount: number;
  topics: readonly string[];
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
  { id: "workflow-dasar", title: "Pemula? Mulai dari Sini", description: "Kenali alur harian NutriVerse dari memahami kondisi, mencatat kebiasaan, hingga melihat progres.", icon: Heart, articleCount: 4, topics: ["Alur penggunaan harian", "Langkah pertama yang disarankan"] },
  { id: "dashboard", title: "Mulai & Dashboard", description: "Baca ringkasan aktivitas, target, Health Pulse, dan rekomendasi harian dari satu tempat.", icon: LayoutDashboard, articleCount: 4, topics: ["Ringkasan kondisi hari ini", "Target dan progres harian"] },
  { id: "health-pulse", title: "Health Pulse", description: "Pahami indikator ringkas yang membantu membaca arah pola kesehatan tanpa memberi diagnosis.", icon: Heart, articleCount: 3, topics: ["Arti nilai Health Pulse", "Faktor pembentuk dan batas nonmedis"] },
  { id: "nora-ai", title: "Nora AI Companion", description: "Gunakan pendamping AI untuk memperoleh penjelasan, refleksi, dan motivasi kesehatan nonmedis.", icon: Sparkles, articleCount: 3, topics: ["Cara memulai percakapan", "Batas saran dan keamanan"] },
  { id: "scan", title: "Scan Makanan", description: "Kenali perkiraan makanan dan nutrisinya melalui foto, lalu simpan hasil yang sudah kamu periksa.", icon: ScanLine, articleCount: 3, topics: ["Foto agar mudah dikenali", "Periksa estimasi sebelum menyimpan"] },
  { id: "gps", title: "Aktivitas GPS", description: "Rekam jalan, lari, atau bersepeda dan kirim aktivitas untuk divalidasi sebelum memperoleh XP.", icon: Activity, articleCount: 4, topics: ["Izin lokasi dan perekaman", "Validasi aktivitas dan XP"] },
  { id: "challenge", title: "Challenge", description: "Ikuti tantangan yang tersedia, pantau progres, lalu klaim manfaat setelah syarat terpenuhi.", icon: Trophy, articleCount: 3, topics: ["Bergabung dan menyelesaikan", "Progres serta klaim"] },
  { id: "komunitas", title: "Komunitas & Leaderboard", description: "Bagikan progres yang aman, berinteraksi dengan komunitas, dan lihat peringkat secara sportif.", icon: UsersRound, articleCount: 4, topics: ["Posting, komentar, dan reaksi", "Leaderboard dan privasi"] },
  { id: "reward", title: "Reward & Health Points", description: "Pahami saldo Health Points, katalog reward, serta status penukaran tanpa mengurangi XP tier.", icon: Gift, articleCount: 4, topics: ["Perbedaan HP dan XP", "Penukaran serta riwayat reward"] },
  { id: "xp-tier", title: "XP & Tier", description: "Pelajari CHPS, perolehan XP dari aktivitas tervalidasi, dan perjalanan dari Sprout hingga Legend.", icon: ShieldCheck, articleCount: 4, topics: ["Cara XP dihitung", "Tier, season, dan leaderboard"] },
  { id: "pengaturan", title: "Pengaturan Akun & Privasi", description: "Kelola profil, preferensi, izin lokasi, ekspor data, dan keamanan akunmu.", icon: Settings, articleCount: 5, topics: ["Profil dan preferensi", "Lokasi, ekspor, dan kontrol data"] },
  { id: "notifikasi", title: "Notifikasi & Reminder", description: "Atur pengingat agar tetap relevan, tidak berlebihan, dan sesuai dengan preferensimu.", icon: Bell, articleCount: 3, topics: ["Pusat notifikasi", "Preferensi dan perangkat"] },
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
    id: "gps",
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
  },
  {
    id: "health-pulse",
    title: "Memahami Health Pulse",
    fungsi: "Merangkum sinyal kebiasaan harian menjadi indikator yang mudah dibaca untuk membantu refleksi, bukan untuk menilai atau mendiagnosis kondisi medis.",
    tujuan: "Membantu kamu melihat arah pola aktivitas, nutrisi, hidrasi, dan catatan kesehatan secara lebih sederhana dari waktu ke waktu.",
    caraPenggunaan: [
      "Buka menu Health Pulse untuk melihat nilai terbaru dan waktu pembaruannya.",
      "Baca faktor pendukung yang tersedia agar kamu memahami data apa saja yang memengaruhi ringkasan tersebut.",
      "Gunakan perubahan nilainya sebagai bahan refleksi kebiasaan, lalu pilih satu tindakan ringan yang realistis untuk dilakukan.",
      "Jika ada keluhan kesehatan atau hasil yang mengkhawatirkan, konsultasikan dengan tenaga kesehatan; Health Pulse bukan alat diagnosis."
    ],
    tips: "Perhatikan kecenderungan beberapa hari, bukan satu angka dalam satu waktu. Data yang lebih konsisten memberikan konteks yang lebih berguna.",
    bestPractice: "Gunakan Health Pulse sebagai kompas kebiasaan dan selalu baca penjelasan di balik nilainya sebelum mengambil keputusan.",
    troubleshooting: [
      {
        issue: "Health Pulse belum tampil atau belum berubah",
        cause: "Data aktivitas atau catatan harian yang tersedia belum cukup, atau pembaruan masih diproses.",
        fix: "Lengkapi catatan yang relevan, pastikan aktivitas sudah tersimpan, lalu muat ulang halaman setelah proses selesai."
      }
    ]
  },
  {
    id: "nora-ai",
    title: "Nora AI Companion",
    fungsi: "Memberikan penjelasan, refleksi, motivasi, dan saran kebiasaan sehat berdasarkan konteks yang kamu bagikan dalam batas informasi nonmedis.",
    tujuan: "Membuat informasi kesehatan lebih mudah dipahami sekaligus menemani pengguna membangun langkah kecil yang realistis.",
    caraPenggunaan: [
      "Buka Nora dari menu Companion atau tombol percakapan yang tersedia.",
      "Sampaikan kebutuhanmu dengan jelas, misalnya meminta penjelasan progres, ide aktivitas ringan, atau cara membaca ringkasan harian.",
      "Baca jawaban Nora sebagai informasi pendamping dan pilih saran yang sesuai dengan kondisi serta kemampuanmu.",
      "Hindari memasukkan informasi pribadi yang tidak diperlukan dan jangan gunakan Nora untuk keadaan darurat atau diagnosis medis."
    ],
    tips: "Pertanyaan yang spesifik seperti 'tolong jelaskan progres aktivitas minggu ini dengan bahasa sederhana' biasanya menghasilkan jawaban yang lebih relevan.",
    bestPractice: "Gunakan Nora untuk memahami data dan menyusun kebiasaan ringan. Untuk keluhan, obat, diagnosis, atau kondisi darurat, hubungi tenaga kesehatan.",
    troubleshooting: [
      {
        issue: "Nora belum memberikan jawaban",
        cause: "Koneksi internet terputus, permintaan masih diproses, atau layanan pendamping sedang tidak tersedia.",
        fix: "Periksa koneksi, tunggu beberapa saat, lalu kirim ulang pertanyaan tanpa memuat data pribadi yang sensitif."
      }
    ]
  },
  {
    id: "challenge",
    title: "Mengikuti Challenge",
    fungsi: "Menyediakan tantangan aktivitas atau kebiasaan dengan target, periode, dan manfaat yang dijelaskan sebelum pengguna bergabung.",
    tujuan: "Membantu kamu menjaga konsistensi melalui sasaran yang terukur tanpa menjadikan tantangan sebagai kewajiban.",
    caraPenggunaan: [
      "Buka menu Challenge dan pilih kartu tantangan yang sesuai dengan kemampuanmu.",
      "Baca target, periode, aturan validasi, serta manfaatnya sebelum menekan tombol bergabung.",
      "Lakukan aktivitas yang diminta dan pantau progres pada halaman detail tantangan.",
      "Setelah syarat terpenuhi dan statusnya selesai, gunakan tombol klaim jika manfaat perlu diklaim secara manual."
    ],
    tips: "Mulai dari satu challenge dengan target realistis agar progres mudah dipantau dan tidak terasa membebani.",
    bestPractice: "Pilih tantangan berdasarkan kesiapan diri, bukan hanya besar manfaatnya. Keselamatan dan konsistensi tetap menjadi prioritas.",
    troubleshooting: [
      {
        issue: "Progres challenge belum bertambah",
        cause: "Aktivitas pendukung belum selesai divalidasi atau tidak sesuai dengan jenis dan periode challenge.",
        fix: "Periksa detail aturan, status aktivitas, dan tanggal challenge. Tunggu proses validasi sebelum mencoba kembali."
      }
    ]
  },
  {
    id: "komunitas",
    title: "Komunitas & Leaderboard",
    fungsi: "Menyediakan ruang berbagi progres, komentar, reaksi, serta peringkat berbasis aktivitas yang telah memenuhi ketentuan.",
    tujuan: "Membangun dukungan sosial dan kompetisi yang sehat tanpa membuka data kesehatan atau koordinat pribadi secara publik.",
    caraPenggunaan: [
      "Buka Komunitas untuk melihat unggahan, momen, atau pembaruan yang dibagikan pengguna lain.",
      "Bagikan progres yang memang ingin kamu tampilkan, lalu periksa kembali isinya sebelum mengirim.",
      "Gunakan komentar dan reaksi secara suportif, serta laporkan konten yang melanggar aturan komunitas.",
      "Buka Leaderboard untuk melihat posisi berdasarkan cakupan dan season yang sedang aktif."
    ],
    tips: "Bagikan pencapaian tanpa menyertakan alamat, koordinat rute mentah, informasi medis, atau data pribadi lain.",
    bestPractice: "Jadikan leaderboard sebagai pemicu semangat, bukan ukuran nilai diri. Bandingkan progres terutama dengan kebiasaanmu sendiri.",
    troubleshooting: [
      {
        issue: "Posisi leaderboard belum berubah",
        cause: "Aktivitas masih diproses, belum tervalidasi, atau leaderboard menggunakan season dan cakupan berbeda.",
        fix: "Periksa status aktivitas serta filter season pada leaderboard, kemudian tunggu sinkronisasi selesai."
      }
    ]
  },
  {
    id: "reward",
    title: "Reward & Health Points",
    fungsi: "Menampilkan saldo Health Points (HP), katalog reward, persyaratan penukaran, dan riwayat status penukaran.",
    tujuan: "Memberikan apresiasi atas kebiasaan sehat tanpa mengurangi XP yang digunakan untuk progres tier dan peringkat.",
    caraPenggunaan: [
      "Buka menu Reward untuk melihat saldo HP dan reward yang sedang tersedia.",
      "Pilih reward lalu baca jumlah HP, stok, masa berlaku, dan ketentuan sebelum menukar.",
      "Konfirmasi penukaran hanya setelah semua informasi benar.",
      "Pantau statusnya pada riwayat penukaran; pembatalan hanya tersedia jika status dan ketentuannya memungkinkan."
    ],
    tips: "Bedakan HP dan XP: HP dapat digunakan untuk penukaran, sedangkan XP mencatat progres kompetitif dan tidak dibelanjakan.",
    bestPractice: "Periksa stok serta ketentuan reward terlebih dahulu dan simpan bukti atau kode penukaran sampai proses selesai.",
    troubleshooting: [
      {
        issue: "Reward tidak dapat ditukar",
        cause: "Saldo HP tidak mencukupi, stok habis, reward tidak aktif, atau permintaan sebelumnya masih diproses.",
        fix: "Periksa saldo, ketersediaan, dan riwayat penukaran. Coba kembali setelah seluruh persyaratan terpenuhi."
      }
    ]
  },
  {
    id: "xp-tier",
    title: "XP, Tier & CHPS",
    fungsi: "Mengelola progres kompetitif melalui Competitive Health Progression System (CHPS), dari XP aktivitas tervalidasi hingga tier dan leaderboard.",
    tujuan: "Menghargai aktivitas fisik secara adil sekaligus memisahkan progres jangka panjang dari Health Points yang dapat ditukar.",
    caraPenggunaan: [
      "Rekam aktivitas jalan, lari, atau bersepeda melalui menu Aktivitas GPS.",
      "Selesaikan sesi dan tunggu pemeriksaan data seperti lokasi, waktu, jarak, kesinambungan rute, pace, serta anomali kecepatan.",
      "Jika aktivitas lolos validasi, XP ditambahkan ke progresmu dan dihitung menuju ambang tier berikutnya.",
      "Lihat posisi pada leaderboard season aktif dan baca aturan season yang ditampilkan sebelum membandingkan peringkat."
    ],
    tips: "XP berasal dari aktivitas fisik yang tervalidasi. Scan makanan dan penukaran reward tidak menambah atau mengurangi XP tier.",
    bestPractice: "Pilih mode aktivitas yang benar dan rekam pergerakan nyata secara konsisten. CHPS dirancang untuk menghargai proses, bukan manipulasi data.",
    troubleshooting: [
      {
        issue: "XP belum masuk setelah aktivitas selesai",
        cause: "Aktivitas masih dalam proses validasi, memerlukan peninjauan, atau tidak memenuhi aturan kewajaran.",
        fix: "Buka detail aktivitas untuk melihat status dan alasannya. Gunakan pengajuan banding bila opsi tersebut tersedia dan datamu memang benar."
      }
    ]
  },
  {
    id: "pengaturan",
    title: "Pengaturan Akun & Privasi",
    fungsi: "Mengelola profil, preferensi aplikasi, keamanan akun, izin lokasi, riwayat lokasi, dan kontrol atas data pribadi.",
    tujuan: "Memberi pengguna kendali yang jelas atas pengalaman NutriVerse dan data yang digunakan oleh setiap fitur.",
    caraPenggunaan: [
      "Buka Pengaturan, lalu pilih bagian profil, preferensi, notifikasi, atau privasi yang ingin diubah.",
      "Perbarui informasi seperlunya dan simpan perubahan sebelum berpindah halaman.",
      "Tinjau izin lokasi pada perangkat; lokasi dibutuhkan ketika sesi aktivitas GPS sedang berlangsung.",
      "Gunakan fasilitas ekspor atau pengelolaan akun pada bagian privasi jika ingin memperoleh salinan atau mengatur data akunmu."
    ],
    tips: "Berikan izin hanya ketika dibutuhkan dan jangan membagikan kata sandi, kode masuk, maupun tautan pemulihan kepada siapa pun.",
    bestPractice: "Tinjau pengaturan privasi secara berkala, terutama setelah mengganti perangkat atau browser.",
    troubleshooting: [
      {
        issue: "Perubahan profil atau preferensi tidak tersimpan",
        cause: "Sesi telah berakhir, koneksi terputus, atau terdapat kolom yang belum memenuhi format.",
        fix: "Masuk kembali bila diperlukan, periksa penanda kesalahan pada formulir, lalu simpan ulang dengan koneksi yang stabil."
      }
    ]
  },
  {
    id: "notifikasi",
    title: "Notifikasi & Reminder",
    fungsi: "Menampilkan pembaruan penting dan pengingat yang dapat dibaca atau dikelola berdasarkan preferensi pengguna.",
    tujuan: "Membantu kamu mengetahui progres, challenge, reward, dan pembaruan akun tanpa membuat pengalaman terasa mengganggu.",
    caraPenggunaan: [
      "Buka pusat Notifikasi untuk melihat pembaruan terbaru dan status sudah atau belum dibaca.",
      "Pilih sebuah notifikasi untuk membuka konteks atau halaman terkait jika tautan tersedia.",
      "Buka Pengaturan untuk menyesuaikan preferensi pengingat sesuai kebutuhanmu.",
      "Jika menggunakan notifikasi perangkat, pastikan izin browser atau perangkat telah diberikan."
    ],
    tips: "Aktifkan hanya pengingat yang benar-benar membantu rutinitasmu agar notifikasi tetap relevan.",
    bestPractice: "Gunakan pengingat sebagai dukungan, bukan tekanan. Ubah atau nonaktifkan preferensi yang tidak lagi sesuai.",
    troubleshooting: [
      {
        issue: "Notifikasi perangkat tidak muncul",
        cause: "Izin notifikasi ditolak, perangkat belum terdaftar, atau pengaturan sistem sedang membatasi notifikasi.",
        fix: "Periksa izin situs pada browser, pengaturan notifikasi perangkat, dan preferensi NutriVerse, lalu muat ulang aplikasi."
      }
    ]
  }
];
