# Master Documentation NutriVerse AI

> *Dokumen Referensi Resmi untuk Pengembangan, Proposal AMICTA 2026, dan Panduan Teknis Tim*
>
> **Disusun Oleh:** Senior Architecture & Product Team (NutriVerse)  
> **Versi:** 1.0 (Comprehensive Detail Edition)

---

## DAFTAR ISI

1. [BAB 1: Executive Summary](#bab-1-executive-summary)
2. [BAB 2: Latar Belakang](#bab-2-latar-belakang)
3. [BAB 3: Studi Kasus](#bab-3-studi-kasus)
4. [BAB 4: Filosofi Produk](#bab-4-filosofi-produk)
5. [BAB 5: Target User](#bab-5-target-user)
6. [BAB 6: Competitive Analysis](#bab-6-competitive-analysis)
7. [BAB 7: Product Goals](#bab-7-product-goals)
8. [BAB 8: Feature Documentation](#bab-8-feature-documentation)
9. [BAB 9: Workflow](#bab-9-workflow)
10. [BAB 10: UI/UX Documentation](#bab-10-uiux-documentation)
11. [BAB 11: Design System](#bab-11-design-system)
12. [BAB 12: Technology Stack](#bab-12-technology-stack)
13. [BAB 13: System Architecture](#bab-13-system-architecture)
14. [BAB 14: Security](#bab-14-security)
15. [BAB 15: Database Planning](#bab-15-database-planning)
16. [BAB 16: API Planning](#bab-16-api-planning)
17. [BAB 17: AI Planning](#bab-17-ai-planning)
18. [BAB 18: Roadmap Development](#bab-18-roadmap-development)
19. [BAB 19: Future Development](#bab-19-future-development)
20. [BAB 20: Kesimpulan](#bab-20-kesimpulan)

---

## BAB 1: Executive Summary

**NutriVerse** adalah sebuah platform ekosistem kesehatan dan nutrisi modern yang mengadopsi konsep *gamification* (gamifikasi) tingkat lanjut. Proyek ini dibangun dalam bentuk *Progressive Web App (PWA)* oleh tim **KOSEK (Kesehatan Orang Sekarang)** Universitas AMIKOM Yogyakarta, dengan misi spesifik untuk berkompetisi dan memenangkan penghargaan di ajang **AMICTA 2026** kategori Aplikasi Sistem Informasi.

Tidak seperti aplikasi metrik kesehatan tradisional yang kaku dan membosankan, NutriVerse dirancang untuk mengubah perjalanan kebugaran (*fitness journey*) pengguna menjadi sebuah pengalaman bermain *game* kompetitif. Inti dari mesin penggerak NutriVerse adalah inovasi **CHPS (Competitive Health Progression System)**. Sistem ini menantang pengguna untuk mengumpulkan *Experience Points (XP)* dan *Health Points (HP)* melalui pembakaran kalori dan aktivitas fisik di dunia nyata (Lari, Jalan, Bersepeda), yang kemudian divalidasi oleh sistem Anti-Cheat berbasis GPS.

Di dalam ekosistem ini, pengguna tidak berjuang sendirian. Mereka didampingi oleh **Nora AI**, asisten virtual proaktif berbasis Gemini yang mampu memproses *context memory*, menganalisis nutrisi dari gambar (*Food Recognition*), dan memberikan rapor kesehatan dalam bentuk *Weekly Letter* yang manusiawi dan emosional. Proyek ini memadukan arsitektur teknis modern (*Next.js, Prisma, Supabase PostgreSQL*) dengan desain antarmuka yang sangat premium.

---

## BAB 2: Latar Belakang

Perkembangan teknologi modern menciptakan paradoks: hidup semakin mudah, namun kesehatan fisik manusia semakin merosot. Berdasarkan pengamatan terhadap masyarakat modern, terdapat beberapa krisis nyata yang melatarbelakangi berdirinya NutriVerse:

1. **Sedentary Lifestyle (Gaya Hidup Kurang Gerak) pada Gen Z & Millennials**
   Generasi muda saat ini menghabiskan rata-rata 6–9 jam per hari menatap layar (*screen time*) baik untuk bekerja, kuliah, atau *scrolling* media sosial. Hal ini melahirkan gaya hidup *sedentary* ekstrem yang memicu obesitas dini dan penyakit metabolik.

2. **Akses Instan ke Fast Food Menghancurkan Pola Makan**
   Kehadiran layanan *food delivery* membuat konsumsi makanan berkalori tinggi (junk food, minuman boba) semakin mudah. Sayangnya, tidak semua orang memahami dampak makronutrisi dari apa yang mereka konsumsi, dan menghitung kalori secara manual terasa terlalu rumit.

3. **Demotivasi dalam Olahraga**
   Berolahraga membutuhkan *willpower* (tekad) yang besar karena hasilnya (*reward*) baru terlihat dalam hitungan bulan. Otak manusia modern terprogram untuk mencari *instant gratification* (kepuasan instan). Saat orang berlari 2 kilometer dan tidak melihat perubahan apapun di cermin esok harinya, mereka cenderung menyerah.

4. **Churn Rate Aplikasi Kesehatan Sangat Tinggi**
   Aplikasi kesehatan saat ini sangat analitikal dan mengintimidasi. Pengguna disuguhkan grafik garis dan angka-angka medis yang membingungkan, tanpa ada faktor "menyenangkan" atau apresiasi yang memicu hormon dopamin. Pengguna akan mengunduh, mencoba selama 3 hari, dan menghapusnya.

**Jawaban NutriVerse:**  
NutriVerse hadir dengan pendekatan psikologis terbalik. Kami memberikan *instant gratification* yang dicari otak manusia melalui **XP, Leveling (Tier), Badge, dan Leaderboard**. Kami memberikan alasan konkret bagi pengguna untuk berdiri dari kursi mereka: "Saya harus lari keliling kompleks agar XP saya cukup untuk naik dari *Tier Seedling* ke *Runner* dan mengalahkan peringkat teman sekelas saya."

---

## BAB 3: Studi Kasus

Analisis ini mengambil potret kehidupan nyata dari persona yang dirancang sebagai target audiens utama aplikasi:

### 1. Raditya (21 Tahun) - Mahasiswa Tingkat Akhir (Gen Z)
* **Kondisi Nyata:** Sering begadang, pola makan tidak teratur (banyak mie instan), sangat kompetitif dalam *game online* (Valorant/Mobile Legends), namun secara fisik mudah lelah.
* **Pain Point:** Ingin sehat tetapi merasa olahraga itu membosankan dan menyita waktu.
* **Solusi NutriVerse:** Raditya tidak perlu ke *gym*. Ia menggunakan NutriVerse di mana *Nora AI* memberikannya *Challenge*: "Jalan kaki santai 2000 langkah hari ini". Saat ia melakukannya, sistem GPS merekam dan memberinya XP. Raditya menyadari bahwa usahanya tercatat di *Leaderboard Kampus*, dan insting kompetitifnya (*gamer instinct*) bangkit. Ia mulai rutin berjalan tiap sore untuk meraih *Tier Legend*.

### 2. Sarah (25 Tahun) - Karyawan Kantoran / UI Designer
* **Kondisi Nyata:** Bekerja di depan laptop selama 9 jam. Terlalu sibuk untuk merencanakan asupan kalori secara rinci.
* **Pain Point:** Sering merasa bersalah setelah *snacking* manis, namun enggan mencatat tiap bahan makanan di aplikasi hitung kalori tradisional karena memusingkan.
* **Solusi NutriVerse:** Saat makan siang, Sarah cukup mengarahkan kamera *handphone* ke makanannya (Fitur *Scan AI*). NutriVerse otomatis mengenali gambar (misal: "Nasi Goreng Telur"), menampilkan estimasi 450 Kcal, dan memberikan saran kecil ("Butuh 45 menit jalan kaki santai untuk membakarnya"). Pada akhir pekan, ia menggunakan **Health Points (HP)** yang ia peroleh dari jalan santainya untuk ditukar dengan diskon salad di *Reward Store*.

---

## BAB 4: Filosofi Produk

Filosofi NutriVerse dirancang dengan sangat spesifik agar tidak melenceng menjadi "sekadar aplikasi fitness biasa". 

### 1. Etimologi & Identitas Merek
* **Nutri:** Merepresentasikan "Nutrisi". Elemen paling mendasar dari bahan bakar tubuh manusia.
* **Verse:** Berasal dari kata *Universe* (Semesta). Menandakan bahwa aplikasi ini merupakan ekosistem tertutup (seperti sebuah dunia game) di mana segala aktivitas pengguna memiliki makna dan tercatat secara persisten.

### 2. Prinsip Gamifikasi Penuh (Full Gamification)
Pendekatan desain yang mengambil mekanika *game RPG* (Role Playing Game):
* **Tier (Pangkat):** Pengguna tidak sekadar "olahraga", mereka berpetualang menaiki anak tangga sistem kasta hierarkis. Mulai dari *Sprout* -> *Seedling* -> *Runner* -> *Challenger* -> *Pro* -> *Elite* -> *Master* -> *Champion* -> *Legend*.
* **Badge & Achievement:** Pengakuan abadi atas sebuah pencapaian ekstrem (misal: "Badge Lari 10KM Pertama" atau "Badge Bertahan 7 Hari Beruntun").

### 3. Dual Economy (Dua Mata Uang Terpisah)
Sistem ekonomi dibangun persis seperti *game online* besar untuk menjaga keseimbangan:
* **Experience Points (XP):** Bersifat *Acumulative* (tidak bisa berkurang atau ditukar). Merupakan representasi mutlak dari dedikasi pengguna untuk berkompetisi di *Leaderboard* dan naik *Tier*.
* **Health Points (HP):** Bersifat *Transactional* (bisa ditukar dan habis). Digunakan khusus di *Reward Store* untuk diklaim menjadi hadiah nyata (diskon produk, *voucher* olahraga, dll).

### 4. Zero XP for Diet (Kebijakan Anti-Cheat Pertanian XP)
Sistem **CHPS (Competitive Health Progression System)** mengatur bahwa **XP HANYA didapatkan melalui aktivitas fisik bergerak yang divalidasi oleh sensor GPS dan Speedometer (*Pace*)**.
* *Mengapa memfoto makanan sehat tidak dapat XP?* Karena kami mencegah pengguna melakukan kecurangan (*cheating/farming*) dengan sekadar mencari gambar salad di Google dan memfotonya ke layar monitor untuk mendapat peringkat tinggi di *Leaderboard*. Asupan makanan adalah informasi bagi diri sendiri, sedangkan keringat adalah validasi kompetisi.

### 5. Nora AI Companion
* *Personality:* Berbeda dengan ChatGPT yang kaku dan serba tahu, **Nora** didesain memiliki empati. Ia mengingat jika pengguna memiliki cedera lutut dan tidak akan menyarankan berlari kencang. Ia menyapa dengan nama panggilan, dan memberikan dukungan emosional ketika pengguna tidak mencapai target.

---

## BAB 5: Target User

Untuk memastikan UI/UX dan fitur tepat sasaran, target pengguna didefinisikan secara mendalam:

**1. Primary Audience (Pengguna Utama)**
* **Demografi:** Usia 17 - 28 Tahun (Gen Z, Mahasiswa, *Fresh Graduate*).
* **Karakteristik:** Digital *native*, memiliki tingkat adopsi teknologi sangat tinggi, peduli pada citra sosial (sosial media), menyukai *rewards*, mudah terpengaruh tren.
* **Motivasi Utama:** Pengakuan sosial (*Social Validation*) di *Leaderboard*, ingin terlihat sehat tanpa harus mempelajari ilmu gizi mendalam.

**2. Secondary Audience (Pengguna Sekunder)**
* **Demografi:** Usia 29 - 40 Tahun (Pekerja Korporat, Manajer).
* **Karakteristik:** Sangat sibuk, sering mengalami kelelahan punggung/leher (*occupational hazard*), daya beli tinggi.
* **Motivasi Utama:** Mencari keseimbangan hidup (*work-life balance*), peduli pada *Wellbeing*, memanfaatkan diskon nyata dari *Reward Store*.

**User Journey (Langkah Perjalanan Pengguna):**
1. **Awareness:** Melihat presentasi AMICTA atau rekomendasi teman bahwa ada aplikasi olahraga berhadiah dan ada *ranking*.
2. **Onboarding:** Mendaftar, memilih avatar/foto, dan berinteraksi pertama kali dengan *Nora AI*.
3. **Core Action (Daily):** Menyalakan tracker GPS saat pergi ke warung atau ke kampus jalan kaki. Memfoto makan siang dengan AI Scanner.
4. **Retention:** Mengecek *Health Pulse* harian, melihat posisi di klasemen turun sehingga termotivasi lari sore.
5. **Reward:** Menukarkan 5000 HP dengan diskon minuman sehat. Mengunggah pencapaian ke fitur *Komunitas*.

---

## BAB 6: Competitive Analysis

Analisis mendalam mengenai aplikasi sejenis di pasaran dan bagaimana NutriVerse memposisikan dirinya.

| Aspek Penilaian | Strava | MyFitnessPal | Samsung Health / Apple Health | **NutriVerse** |
| :--- | :--- | :--- | :--- | :--- |
| **Fokus Utama** | Komunitas Atlet Pro & Pelacakan Akurat | Pencatatan Kalori Makro & Mikro | Metrik Pasif & IoT Integration | **Gamifikasi, Motivasi Sosial, AI Pendamping** |
| **Kelebihan** | Presisi GPS luar biasa tinggi, integrasi *wearable* sempurna. | Database makanan raksasa (ribuan entri). | Terhubung langsung dengan sensor *hardware smartphone/smartwatch*. | **Pendekatan *game RPG*, Reward Store, UI sangat modern, Nora AI**. |
| **Kekurangan** | *Intimidating*. Orang biasa malu mengunggah lari lambat 2KM saat teman-temannya lari 15KM. | Memasukkan data terlalu rumit dan mekanis. Sangat membosankan. | Pasif, tidak menegur, tidak memberi penghargaan (*reward*) kompetitif. | Masih berbasis Web (PWA), pelacakan GPS bergantung pada kapabilitas *browser*. |
| **Peluang Market NutriVerse** | Menggaet pasar *casual* yang butuh kesenangan, bukan statistik balapan. | Menawarkan *scan* kamera cerdas dengan Gemini untuk *casual user* (tidak butuh presisi kalori 100% akurat). | Memberikan *"suara"* melalui AI Companion yang aktif merespons aktivitas harian. | **Memiliki ekosistem sendiri dengan sistem pangkat (*Tier*) yang dapat dipamerkan dan ditukar uang/diskon nyata (Reward Store).** |

---

## BAB 7: Product Goals

Strategi pengembangan NutriVerse dikategorikan ke dalam 3 *horizon* utama:

### 1. Short-Term Goals (Fokus AMICTA 2026 - Horizon 1)
* Mengamankan status sebagai aplikasi dengan inovasi paling "Siap Pakai" di kategori Sistem Informasi.
* Memiliki fungsionalitas utama yang terbukti berjalan sempurna: Login Supabase, Pelacakan GPS Anti-Cheat *real-time*, AI Image Scanner untuk makanan, dan sistem CHPS Economy yang tidak dapat dimanipulasi (*idempotent backend*).
* UI/UX yang memberikan efek *WOW* pada pandangan pertama bagi dewan juri, tanpa ada *bug visual*.

### 2. Mid-Term Goals (1-2 Tahun - Horizon 2)
* Peluncuran publik (Go-To-Market) dengan fokus target kampus (AMIKOM) untuk membangun *User Base* awal.
* Meluncurkan *Community Challenges* berskala masif (misal: "Tantangan AMIKOM Bergerak 10.000 KM").
* Membangun kemitraan dengan 10-15 *merchant* lokal (cafe sehat, *gym*, toko *sport*) untuk mengisi *Reward Store* dengan penawaran riil.

### 3. Long-Term Goals (3-5 Tahun - Horizon 3)
* Migrasi dari PWA web menjadi aplikasi *Native* (React Native / Flutter) untuk akses *background location* yang lebih absolut.
* Integrasi *Hardware HealthKit* dan *Google Fit / Health Connect*.
* Pivot bisnis menuju model *B2B Corporate Wellness*: Perusahaan dapat berlangganan NutriVerse untuk di- *white-label* sebagai aplikasi kebugaran karyawan internal mereka.

---

## BAB 8: Feature Documentation

Bagian ini mendokumentasikan fungsionalitas sistem secara mendetail berdasarkan kode dan skema *database*.

### 1. Dashboard (The Command Center)
* **Tujuan:** Layar pertama pasca-login yang memberikan rangkuman status terkini pengguna secara instan.
* **Deskripsi Teknis:** Memuat komponen statis untuk *Health Score* harian, visualisasi SVG lingkaran untuk persentase progress XP menuju *Tier* berikutnya, serta daftar pendek sisa *Daily Challenge*. Terdapat *Widget* yang memanggil *API Server Components* untuk mengecek sesi aktif.
* **Komponen:** `AppShell`, `DashboardWidgets`, `WellbeingReminder`.

### 2. Activity Tracker (Modul GPS Anti-Cheat)
* **Tujuan:** Sumber utama pendapatan XP/HP secara divalidasi.
* **Alur Kerja Terperinci:**
  1. Pengguna memilih mode aktivitas (Jalan/Lari/Sepeda).
  2. Aplikasi meminta izin `navigator.geolocation`.
  3. Aplikasi merekam *Latitude, Longitude, Altitude, Speed, Accuracy* tiap detik, mem- *push* ke memori array *browser*.
  4. Pengguna menekan "Selesai". Payload telemetri dikirim ke API `/api/activity/verify`.
  5. *Server Action* menjalankan *Haversine formula* untuk mengecek jarak absolut vs waktu. Jika kecepatan rata-rata `WALK` terbaca di atas 30 KM/Jam, sistem me- *reject* dan menyimpan log `VerificationResult` dengan status `REJECTED` (Anti-Cheat aktif).
  6. Jika valid, sistem memanggil mutasi *Prisma* untuk menambahkan XP dan HP.
* **Keunikan:** Mode Simulasi tersedia untuk dewan juri agar dapat mengetes fitur tanpa harus berlari sungguhan di ruang presentasi.

### 3. Food Scanner (AI Nutrition Entry)
* **Tujuan:** Input makronutrisi semudah menjepret foto.
* **Deskripsi Teknis:** Modul `FoodScanner.tsx` merangkum gambar (JPEG/PNG) menjadi string `Base64`, lalu dikirim ke API yang mengintegrasikan model `Gemini Pro Vision 1.5/flash`. *System prompt* memaksa Gemini mengembalikan murni struktur JSON: `{ "foodName": "...", "calories": 0, "protein": 0 }`.
* **Database Target:** `NutritionEntry`. Field `confidenceScore` akan diisi berdasarkan parameter AI untuk mengindikasikan kepastian pengenalan gambar.

### 4. Leaderboard & Seasons
* **Tujuan:** Papan klasemen kompetitif.
* **Deskripsi Teknis:** Data ditarik dari tabel `Ranking` dengan relasi `LeaderboardSeason`. Menggunakan sistem musim/periode (misal: "Musim 1: Juli-September"). Ketika musim berakhir, *ranking* dibekukan, lalu direset untuk musim baru, namun XP akumulatif tetap ada. Terbagi menjadi *League Scope*, *Local Scope*, dan *Friends Scope*.

### 5. Nora AI Companion (Contextual Chat & Weekly Letter)
* **Tujuan:** Mentor kesehatan cerdas.
* **Deskripsi Teknis:** 
  - **Chat Interface:** Menggunakan pola *streaming response* (Web Streams API) agar AI mengetik selayaknya manusia merespons. Modul `chatWithNora` selalu menarik tabel `CompanionMemory` sebelum *prompting* agar AI tahu nama pengguna dan riwayat kesehatannya.
  - **Weekly Letter:** *Batch job* mingguan yang menganalisis tabel `HealthPulse` dan meracik narasi emosional. Disimpan di `WeeklyLetterArchive`.

### 6. Profil, Tiers & Badges
* **Tujuan:** Lemari trofi kebanggaan.
* **Deskripsi Teknis:** Menampilkan lambang kebesaran (*RankCrest SVG*), *Streak Days* (hari aktif berturut-turut), dan lencana yang di-*unlock* dari tabel `UserBadge`. Seluruh tampilan sangat *shareable* (mudah dibagikan ke media sosial).

### 7. Reward Store & Redemption
* **Tujuan:** Toko virtual penukaran hadiah.
* **Deskripsi Teknis:** Menampilkan produk dari tabel `Reward`. Saat ditukar, sistem membuat `Redemption` dan menggunakan *transactional query* (Prisma `$transaction`) untuk mengurangi saldo HP di `UserEconomy` (sistem Ledger `HPLedgerEntry`). Memiliki validasi stok habis atau *expired*.

### 8. Komunitas (Moments)
* **Tujuan:** Fitur sosial bergaya mikro.
* **Deskripsi Teknis:** *Feed* vertikal dimana pengguna membagikan foto (*Moment*) setelah olahraga yang disimpan di *cloud storage*. Memiliki relasi ke `ContentReport` untuk moderasi apabila konten dirasa tidak pantas.

---

## BAB 9: Workflow (Rantai Alur Sistem)

Penjelasan logis (*Business Logic*) terkait bagaimana data berpindah antar *state*.

### 1. Workflow Autentikasi & Onboarding
1. *User* membuka aplikasi, login dengan Google/Email melalui *Supabase Auth*.
2. Middleware Next.js mendeteksi bahwa *User* baru belum memiliki data fisik.
3. *User* diarahkan secara paksa (*redirect*) ke `/onboarding`.
4. *User* memasukkan BB, TB, Usia, Target, dan nama panggilan. Sistem menyimpan ke `HealthProfile` dan membuatkan entitas awal `UserEconomy` (Tier Sprout, XP 0).

### 2. Workflow Aktivitas & Transaksi Ekonomi
1. *User* -> Mulai Aktivitas `RUN`.
2. *Browser* merekam titik A ke titik B.
3. *User* tekan selesai. Klien mengirim *payload* JSON telemetri ke peladen (*server*).
4. *Server* mengecek: *Apakah logis manusia berlari secepat ini?*
   - Jika Tidak -> Status `NEEDS_REVIEW`, simpan ke `ActivitySession`, tidak ada XP. *User* dapat mengajukan `Appeal` (Banding).
   - Jika Ya -> Status `VERIFIED`. 
5. *Server* membuat kode *IdempotencyKey* unik berdasarkan ID sesi.
6. Prisma `$transaction`:
   - `XPGrant` dibuat (+500 XP).
   - `HPLedgerEntry` dibuat (+250 HP).
   - `UserEconomy` diperbarui. Jika total XP melewati ambang batas tertentu, *Tier* diperbarui.

### 3. Workflow Rapor Mingguan (Weekly Letter)
1. Setiap Minggu pukul 23:59, *Server* (Cron Job via Vercel) membaca semua *user*.
2. Untuk setiap *user*, hitung total aktivitas minggu itu (dari `ActivitySession`) dan rata-rata skor nutrisi (`HealthPulse`).
3. Kirim ringkasan angka ke Gemini API: *"Berikan surat pujian dan teguran halus dengan persona Nora..."*
4. Simpan teks yang dihasilkan ke `WeeklyLetterArchive` dan kirim Notifikasi Sistem (`UserNotification`).

---

## BAB 10: UI/UX Documentation

### 1. Filosofi Tampilan "Gamified Health"
Tim KOSEK sengaja menjauhi gaya desain aplikasi "RS/Klinik" (putih polos, biru muda, kaku). UI/UX NutriVerse diinspirasi dari UI *Video Games* (seperti menu dalam game Valorant atau RPG). 
* **Dark Mode Native:** Menggunakan latar belakang (*background*) hitam/zinc yang sangat gelap, sehingga warna-warna *progress bar* dan komponen fungsional terlihat menyala dan *premium*.
* **Overscroll & Elasticity:** Memberikan *feedback* pantulan ketika di-*scroll* habis (iOS style).

### 2. Keputusan Layouting
* **Bottom Navigation Bar (PWA Style):** Meniru desain aplikasi *native*. Terdiri dari 5 menu utama yang paling sering diakses (Dashboard, Aktivitas, Kamera Scan, Leaderboard, Profil).
* **Top App Bar:** Tempat notifikasi, status jaringan, dan saldo cepat (HP/XP) mengambang.
* **Dashboard Widgets:** Konsep modular (*card* tumpuk). Kartu terpenting (Level & XP) selalu berada di urutan teratas, diikuti oleh misi hari ini.

### 3. Ikonografi dan Emosi Visual
* Dilarang menggunakan emoji ponsel standar dalam desain utama. Semua ikon harus merujuk pada vektor seragam (Lucide/HugeIcons) untuk menjaga konsistensi.
* *Color Coding:*
  - Hijau (Emerald): Aksi aman, kemajuan, persetujuan.
  - Oranye/Kuning (Amber): Peringatan, misi yang belum selesai.
  - Merah (Rose): Zona bahaya (Sistem Anti-Cheat terpicu, *disconnect* jaringan).

---

## BAB 11: Design System (Sistem Desain)

NutriVerse menerapkan sistem desain yang dienkapsulasi menggunakan standar **Tailwind CSS v4** pada berkas `app/globals.css`.

### 1. Typography (Tipografi)
Diimplementasikan melalui fitur `next/font`.
* **Font Display (Plus Jakarta Sans):** Digunakan untuk seluruh *Heading* (H1-H4), Angka *Dashboard*, Saldo, Tingkat Pangkat, dan Elemen Navigasi tebal. Karakteristik geometris tajam memberikan nuansa *sporty* & masa depan.
* **Font Body (Inter):** Digunakan untuk paragraf panjang, deskripsi *challenge*, dan surat AI. Inter dipilih karena keterbacaannya yang sempurna di layar kecil.

### 2. Palet Warna Utama (Tailwind Tokens)
* `--color-primary`: `#10b981` (Emerald 500) sebagai identitas merek.
* `--color-background`: `#09090b` (Zinc 950) sebagai latar utama *dark mode*.
* `--color-surface`: `#18181b` (Zinc 900) sebagai latar kartu (*card*).
* `--color-border`: `#27272a` (Zinc 800) garis pemisah subtil.

### 3. Komponen Atomic (Shadcn/UI Architecture)
Menggunakan pendekatan komponen tanpa-kelas (*headless UI*) dari Radix UI yang dibalut `shadcn`:
* **Button:** Terstandarisasi dengan sudut membulat 999px (`rounded-full`), efek transisi skala saat diklik (hover `scale-105`, active `scale-95`), dengan variasi `default`, `outline`, dan `ghost`.
* **Glassmorphism:** Beberapa *overlay* modal menggunakan properti `backdrop-blur-md bg-black/50` untuk ilusi kedalaman.

### 4. Responsiveness
Seluruh UI menggunakan grid kelipatan `rem` dan `vw` untuk penyesuaian dari layar 320px (iPhone SE) hingga 768px (Tablet). Di layar yang lebih lebar dari 768px (Laptop), aplikasi akan terpusat ( *centered-container*) agar proporsi *mobile-view* tidak rusak.

---

## BAB 12: Technology Stack

Setiap alat yang dipilih memiliki alasan fungsional yang kuat:

### 1. Next.js 16 (App Router) & React 19
* **Fungsi:** Kerangka kerja utama Frontend dan Backend (API).
* **Alasan Pemilihan:** Arsitektur *Server Components* secara drastis mengurangi *bundle size* JavaScript yang diunduh ke klien, sehingga aplikasi berjalan sangat cepat walau sinyal GPS lemah. *Server Actions* menghilangkan kebutuhan untuk membuat *endpoint* REST API terpisah, kode *backend* bisa dipanggil langsung sebagai fungsi *React*.

### 2. TypeScript 5
* **Fungsi:** Bahasa pemrograman superset dari JavaScript.
* **Alasan Pemilihan:** Mengingat rumitnya perhitungan GPS dan transaksi mata uang virtual, ketiadaan pendefinisian tipe statis akan mengundang bencana. TypeScript menggaransi *autocompletion* dan keamanan tipe data komprehensif.

### 3. Supabase (PostgreSQL 16+)
* **Fungsi:** Sistem Manajemen Basis Data Relasional, Autentikasi pengguna, dan *Cloud Storage*.
* **Alasan Pemilihan:** Alternatif *open-source* untuk Firebase. Menawarkan kapabilitas SQL tulen yang wajib dimiliki untuk agregasi skor *Leaderboard* yang kompleks, dilengkapi *Row Level Security (RLS)*.

### 4. Prisma ORM 7
* **Fungsi:** Jembatan (Object-Relational Mapping) antara kode TypeScript dan database PostgreSQL.
* **Alasan Pemilihan:** Menghasilkan klien kueri otomatis dari berkas `schema.prisma`. Melakukan transaksi `$transaction` untuk perpindahan mata uang HP/XP lebih aman dan tidak mungkin tertukar tipe.

### 5. Gemini API (Google AI)
* **Fungsi:** Model bahasa besar (*Large Language Model*) dan pemrosesan multi-modal.
* **Alasan Pemilihan:** Gemini (terutama Gemini Pro Vision) terbukti memiliki waktu respons *latency* rendah untuk analisis gambar, serta kemahiran berbahasa Indonesia yang paling luwes dibandingkan pesaingnya di kelas API *developer*.

### 6. Tailwind CSS v4 + Zod + React Hook Form
* Integrasi *Tailwind v4* yang membuang `tailwind.config.js` demi `@theme` pada CSS menjadikan konfigurasi lebih ramping.
* *Zod* memastikan bahwa jika klien mengirim data palsu (*tampering*) saat sinkronisasi GPS, skema validasi server akan langsung menolaknya sebelum masuk ke database.

---

## BAB 13: System Architecture

Gambaran teknis aliran data (Architecture Topology):

1. **Presentation Layer (Klien Browser/PWA):**
   Hanya bertanggung jawab untuk *rendering* antarmuka, menangkap API Sensor Browser (Geolocation, Kamera), dan menjaga *State* UI (Zustand/Context).
   
2. **Controller/Logic Layer (Next.js Server / Vercel Edge):**
   Mengandung *Server Actions*. Seluruh kalkulasi matematis (formula kecepatan GPS, pembersihan spasi, pengkondisian prompt AI) dieksekusi di *Node.js backend* tersembunyi. Klien tidak pernah tahu algoritma pasti dari sistem Anti-Cheat, sehingga sangat sulit diretas.
   
3. **Data Access Layer (Prisma Client):**
   *Middleware* ORM yang mengatur kueri ke *database*, memastikan penutupan koneksi (*connection pooling*), dan membuang (*sanitize*) kueri berpotensi bahaya.

4. **Persistence Layer (Supabase Postgres):**
   Gudang penyimpanan data akhir yang aman, memiliki aturan kebijakan (*policies*) RLS yang mengunci baris data hanya untuk akses token JWT milik *user* terkait.

5. **External Services (API Pihak Ketiga):**
   Panggilan *outbound* ke server Google (Gemini) menggunakan API Key aman di sisi server. Klien tidak pernah memegang kunci API apapun.

---

## BAB 14: Security

Aspek keamanan berlapis (*Defense-in-Depth*):

### 1. Sistem Autentikasi Berbasis JWT
* Seluruh rute dilindungi oleh *Middleware* Next.js yang mengecek *cookie session* Supabase. Percobaan masuk ke halaman `/dashboard` tanpa *cookie* valid akan dilempar secara pasif ke halaman login `/`.

### 2. Row Level Security (RLS) PostgreSQL
* Bahkan jika seseorang berhasil meretas kunci *endpoint* Supabase anonim, mereka tidak bisa men- *select* tabel `users` karena aturan RLS di dalam database berbunyi: `CREATE POLICY "User can read own data" ON users FOR SELECT USING (auth.uid() = id);`. Data lokasi pengguna lain akan ditolak 100% di level basis data.

### 3. Validasi Zero-Trust
* Filosofi sistem: **"Klien Adalah Pembohong"**. 
* Klien dilarang mengirimkan permintaan: "Tambahkan saya 500 XP". 
* Klien hanya boleh mengirimkan: "Ini adalah daftar lokasi dan waktu (*timestamp*) perjalanan saya." Server yang menentukan secara independen apakah itu layak mendapat XP, berapa banyak, dan apa alasannya.

### 4. Idempotency Key Injection
* Saat klaim *Reward* atau penyelesaian Aktivitas, Klien akan me- *generate* UUID v4 sekali pakai (*idempotency key*). Backend akan mengecek kolom `idempotencyKey` unik (bertipe `@unique` di Prisma). Jika permintaan ganda terjadi (*user* frustasi jaringan lelet dan klik 10 kali berturut-turut), database akan menolak 9 entri lainnya sebagai `UniqueConstraintViolation`, mengamankan saldo pengguna.

---

## BAB 15: Database Planning (Berdasarkan Skema Prisma)

Skema database sangat komprehensif, terdiri dari 25+ model terintegrasi. Berikut struktur intinya:

### 1. Sektor Akun & Identitas
* `User`: Tabel inti (`id`, `email`, `role`).
* `HealthProfile`: (BB, TB, Target). Terpisah untuk optimasi bacaan kueri.
* `CompanionPreference`: Menyimpan nama panggilan *User* dan pengaturan *Nora*.
* `UserSettings`: Mengatur privasi dan tema UI.

### 2. Sektor Ekonomi Gamifikasi (CHPS)
* `UserEconomy`: Dompet digital yang menyimpan akumulasi `totalXp`, `currentHp`, dan `currentTier`. Relasi 1:1 ke *User*.
* `XPGrant`: Bukti tanda terima perolehan XP. Harus punya alasan/sumber sesi.
* `HPLedgerEntry`: Catatan mutasi debit/kredit HP agar riwayat belanja transparan.

### 3. Sektor Telemetri Keamanan
* `ActivitySession`: Header tabel sesi lari.
* `TelemetrySample`: Baris koordinat lat/long berelasi *One-To-Many* (ribuan data per sesi). Akan diberi indeks *(indexing)* khusus di Postgres.
* `VerificationResult`: Output algoritma *Anti-Cheat*.
* `Appeal`: Fitur jika sesi ditolak sistem dan *user* mengajukan banding manual ke Admin.

### 4. Sektor Ekosistem & Sosial
* `Challenge` & `ChallengeProgress`: Daftar tantangan dinamis dan progres per individu.
* `Reward` & `Redemption`: Daftar produk di *Reward Store* (kupon diskon) dan kodenya yang telah dibeli.
* `JournalEntry` & `NutritionEntry`: Tabel catatan pribadi dan riwayat deteksi kalori dari makanan.

---

## BAB 16: API Planning

Desain abstraksi fungsional (menggunakan Server Actions TypeScript):

### Modul Auth
* `createUserProfile(data: SignUpDto)`
* `syncSessionData()`

### Modul Aktivitas (Paling Krusial)
* `startTrackingSession(type: ActivityType)` -> Mengembalikan ID Sesi.
* `submitTelemetryBatch(sessionId: String, batch: Telemetry[])` -> Memungkinkan sistem pengiriman data dalam *chunk* kecil agar *browser* tidak berat di ujung perjalanan.
* `finalizeAndVerifyActivity(sessionId: String)` -> Memicu algoritma *Anti-Cheat* dan injeksi Ledger Ekonomi.

### Modul AI
* `analyzeFoodImage(base64Image: String)` -> Mendirikan sambungan *secure* ke *Gemini Vision*, mem- *parse* *Markdown/JSON*, lalu me- *return* objek data gizi bersih ke UI.
* `chatWithCompanion(history: ChatMessage[])` -> *Streaming server-sent events* untuk memicu mesin percakapan Nora.

### Modul Leaderboard
* `getSeasonLeaderboard(scope: League | Local, limit: number)` -> Kueri agregat *Read-Only* yang di-*cache* oleh Next.js ISR (Incremental Static Regeneration) agar tidak membuat *database* lambat jika ratusan *user* cek secara bersamaan.

---

## BAB 17: AI Planning

Strategi *Prompt Engineering* dan integrasi arsitektur AI yang kuat:

### 1. Persona Nora (Prompting Inti)
Setiap panggilan ke Gemini (*chat* atau *Weekly Letter*) diawali dengan injeksi memori sistem tersembunyi:
> *"Anda adalah Nora, asisten kesehatan berempati di platform NutriVerse. Format bahasa Anda formal santai (Indonesia modern). Anda berbicara kepada pengguna bernama {userName}, yang saat ini berada di tier {currentTier}. Pengguna ini memiliki riwayat kesehatan: {healthGoals}. Jangan menasihati seperti dokter, namun jadilah pemandu sorak yang kritis."*

### 2. Analisis Nutrisi (Food Recognition Fallback)
Kelemahan AI Visi adalah halusinasi. Jika gambar kabur, ia mungkin salah mengenali kerikil sebagai makanan ringan.
* **Fallback Strategy:** Dalam *prompt*, Gemini diperintahkan: *"Jika gambar bukan makanan atau tidak jelas, kembalikan JSON dengan nilai error=true dan beritahu user untuk foto ulang."*

### 3. Context Memory Injection
Agar menghemat *Token Cost* Gemini, sistem tidak mengirim riwayat *chat* 3 tahun terakhir. Hanya *chat* 10 balasan terakhir dan ringkasan dari tabel `CompanionMemory` yang dikirim dalam satu siklus *request*.

---

## BAB 18: Roadmap Development (Peta Jalan Pengembangan)

* **Fase 1: Infrastruktur Dasar (Selesai)**
  Repositori *setup*, *Next.js routing*, desain skema Prisma 7.
* **Fase 2: Visual Prototype & Geolocation (Berjalan/Selesai)**
  Implementasi desain antarmuka `shadcn` utuh (mode gelap statis) dan fungsi sensor GPS yang terbukti merekam titik koordinat di dalam aplikasi klien.
* **Fase 3: Cloud Database Integration (Segera - Minggu 1)**
  Koneksi penuh ke proyek Supabase (*production-grade*), konfigurasi kebijakan RLS, migrasi tabel (`prisma db push`), dan autentikasi.
* **Fase 4: Logic & Validation Integration (Minggu 2)**
  Mengaitkan UI dengan API yang sebenarnya. *Anti-Cheat Engine* beraksi dengan data dari `ActivitySession`. *Leaderboard* diisi dengan data dinamis.
* **Fase 5: AI & Gemini API (Minggu 3)**
  Menghubungkan layanan API Multimodal untuk menghidupkan *Nora AI* dan *Food Scanner*.
* **Fase 6: AMICTA Release & Vercel Deployment (Minggu 4)**
  *Quality Assurance*, penyelesaian halaman PWA (*manifest*, *service worker*), uji tegangan akses, dan peluncuran MVP.

---

## BAB 19: Future Development (Rencana Ekspansi)

Menunjukkan visi skalabilitas *Enterprise*:

1. **IoT & Wearables Synchronization**
   Sinkronisasi dengan Apple HealthKit dan Google Fit/Health Connect. Pengguna NutriVerse tidak perlu lagi menyalakan pelacak secara manual; sistem dapat langsung membaca *ring* aktivitas dari Apple Watch atau Garmin mereka untuk dikonversi menjadi XP.

2. **AI Voice Coaching (TTS/STT)**
   Menyambungkan Nora dengan mesin *Text-to-Speech*. Saat berlari, pengguna akan mendengar suara Nora dari *earphone* mereka mengatakan: *"Ayo Raditya, 1 kilometer lagi menuju target!"*.

3. **Marketplace Ecosystem B2B**
   Mengundang penjual eksternal (pembuat sepatu olahraga lokal, katering sehat, suplemen) untuk masuk ke *Dashboard Reward Store*. Mitra mensponsori diskon (kupon dibayar dengan HP pengguna). NutriVerse bertindak sebagai perantara yang memberikan *traffic* pelanggan.

4. **Corporate & School Wellness Platform**
   Pihak Universitas AMIKOM atau perusahaan BUMN dapat menyewa NutriVerse (sebagai layanan *SaaS*) dengan *Leaderboard* swasta (*private league*) untuk mengukur tingkat kebugaran mahasiswanya, dengan integrasi insentif SKS atau penilaian kinerja.

---

## BAB 20: Kesimpulan

NutriVerse merupakan lompatan revolusioner dalam rancang bangun aplikasi *digital health*. Mengesampingkan desain membosankan dari aplikasi kesehatan pendahulunya, KOSEK Team membawa filosofi **Gamifikasi Agresif (CHPS)** yang berfokus penuh pada validasi data nyata dan persaingan sehat antar individu. 

Kekuatan inti NutriVerse terletak pada arsitektur sistem ganda: **Mesin Pelacak Anti-Cheat Berbasis Sensor** yang menjamin keadilan *(fairness)* bagi seluruh pengguna, serta intervensi **AI Generatif (Nora AI & Image Vision)** yang mengurangi beban kognitif pengguna saat merencanakan pola asupan mereka.

Didukung dengan tumpukan teknologi mutakhir (Next.js 16, Supabase, PostgreSQL) yang siap diskalakan sewaktu-waktu, proyek aplikasi PWA ini bukan hanya *prototype* statis, melainkan produk digital unggulan yang matang. NutriVerse sangat layak dipresentasikan pada kompetisi **AMICTA 2026** sebagai wujud sumbangsih teknologi informasi terhadap penyelesaian masalah kesehatan riil, sekaligus proyek rintisan bisnis (*startup*) komersial yang siap menjajah pasar gaya hidup anak muda Indonesia.

---
> *Dokumen ini disajikan sebagai representasi akhir dari analisis kode sumber repositori, arsitektur data, dan visi produk tim KOSEK. Dokumentasi ini dapat terus diadaptasi di setiap perubahan versi minor (semver).*
