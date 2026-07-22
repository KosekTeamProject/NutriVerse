# NutriVerse — Canonical Product Context for AI

Dokumen ini adalah sumber konteks utama ketika AI membantu merancang, menulis, atau mengembangkan NutriVerse. Jangan mengubah aturan inti tanpa keputusan eksplisit dari tim produk.

## 1. Ringkasan produk

NutriVerse adalah aplikasi web kesehatan bergaya game kompetitif untuk membantu Gen Z membangun kebiasaan sehat yang konsisten. Produk menggunakan **CHPS (Competitive Health Progression System)**: aktivitas fisik nyata yang tervalidasi menghasilkan XP, menaikkan tier dari **Sprout** hingga **Legend**, dan membentuk kompetisi yang suportif.

NutriVerse tidak bertujuan memanipulasi pengguna agar berolahraga berlebihan. Gamifikasi harus menjadi dorongan perilaku yang sehat, transparan, aman, dan tetap memberi ruang untuk pemulihan.

## 2. Core loop

1. Pengguna memindai makanan untuk memperoleh estimasi gizi dan pilihan aktivitas realistis.
2. Pengguna menjalankan aktivitas fisik dengan pelacakan GPS.
3. Sistem memvalidasi telemetry dan sinyal risiko.
4. Aktivitas valid menghasilkan XP dan, menurut aturan ekonomi, HP.
5. XP meningkatkan tier dan posisi pada leaderboard yang setara.
6. HP dapat ditukar di Reward Store.
7. Journey, Health Pulse, dan Companion membantu pengguna merefleksikan konsistensi, bukan menghakimi tubuh atau makanan.

## 3. Aturan sistem yang tidak boleh dilanggar

- **XP kompetitif hanya berasal dari aktivitas fisik nyata yang tervalidasi.** Pada MVP, sumber utamanya jalan, lari, dan sepeda berbasis GPS.
- **Scan makanan tidak memberikan XP maupun HP.** Scan bersifat informatif dan membantu pengguna memilih tindakan kecil yang realistis.
- **XP dan HP berbeda.** XP adalah progres peringkat yang hanya naik; HP adalah mata uang yang dapat dibelanjakan.
- Catatan mandiri, refleksi, scan makanan, dan chat Companion tidak boleh memberi XP atau memverifikasi aktivitas.
- Aktivitas yang belum lolos verifikasi boleh disimpan sebagai riwayat pribadi, tetapi tidak boleh memengaruhi XP, HP, challenge kompetitif, atau leaderboard.
- Informasi kesehatan bukan diagnosis medis. Gunakan bahasa tenang, suportif, dan tidak menimbulkan rasa bersalah.

## 4. Verifikasi dan anti-cheat

Validasi tidak boleh hanya mengandalkan pace rata-rata. Mesin produksi perlu mengevaluasi beberapa sinyal sekaligus:

- batas kecepatan sesuai jenis aktivitas;
- lonjakan koordinat atau jarak yang tidak mungkin;
- urutan timestamp, duplikasi sampel, dan jeda telemetry besar;
- kualitas/akurasi GPS;
- pola yang menyerupai kendaraan;
- durasi terlalu pendek atau terlalu panjang;
- pola GPS palsu, replay, atau sumber simulasi;
- aktivitas duplikat dan anomali lintas sesi.

Status hasil validasi: `pending`, `verified`, `needs-review`, `not-verified`, atau `manual-review`. Satu sinyal risiko tidak otomatis berarti pengguna curang. Sediakan alasan yang mudah dipahami dan mekanisme banding/peninjauan manusia. Pemrosesan final, pemberian reward, dan deteksi GPS palsu harus dilakukan di server; pemeriksaan browser hanya pratinjau.

## 5. Progres yang aman

- Terapkan batas XP harian agar kompetisi tidak mendorong olahraga berlebihan.
- Gunakan diminishing return: XP awal pada hari itu bernilai penuh, lalu multiplier menurun setelah ambang tertentu.
- Streak protection menjaga status konsistensi ketika pengguna beristirahat secara wajar, tetapi **tidak memberikan XP untuk istirahat**.
- Jangan memberi hukuman emosional karena pengguna melewatkan satu hari.
- Untuk MVP, angka cap dan multiplier boleh berstatus rancangan sampai disetujui dan diuji oleh tim produk. UI harus menandai aturan demo/rancangan dengan jelas.

## 6. Aksesibilitas dan keadilan aktivitas

GPS cocok untuk jalan, lari, dan sepeda, tetapi tidak mencakup gym, olahraga indoor, pengguna kursi roda, atau kebutuhan adaptif. MVP harus mengakui keterbatasan ini. Roadmap dapat menyediakan validasi alternatif melalui wearable, sensor perangkat, bukti terstruktur, atau manual review. Jalur alternatif tidak boleh langsung memberi XP kompetitif sebelum memiliki model kepercayaan yang setara.

## 7. Leaderboard yang suportif

- Hindari satu leaderboard global sebagai pengalaman utama.
- Sediakan cakupan **Liga**, **Teman**, dan **Lokal**.
- Kelompokkan pengguna berdasarkan tier/level dan musim agar pemula tetap punya peluang.
- Tampilkan verified activity dan konsistensi bersama XP; jangan menjadikan total XP satu-satunya simbol keberhasilan.
- Leaderboard tidak mengukur nilai diri, kebugaran klinis, atau kualitas kesehatan seseorang.
- Jangan pernah menampilkan rute atau koordinat presisi.

## 8. Ekonomi HP

Ekonomi HP harus memiliki sumber, batas, pengeluaran, stok, masa berlaku, dan audit transaksi yang jelas. Arah rancangan:

- HP hanya dari aktivitas/challenge tepercaya sesuai aturan server, bukan scan makanan atau self-report.
- Ada batas perolehan harian dan kontrol anti-inflasi.
- Reward digital dan reward mitra memiliki status stok yang transparan.
- Aturan expiry harus diputuskan dan diberitahukan sebelum produksi.
- Saldo serta penukaran pada MVP adalah simulasi lokal, bukan transaksi sungguhan.

## 9. Scan makanan

Hasil scan adalah estimasi, bukan diagnosis dan bukan penilaian moral. Sajikan:

- estimasi kalori, makro, dan tingkat kepercayaan data;
- penjelasan keterbatasan analisis;
- pilihan gerak kecil yang realistis, misalnya jalan santai 10–15 menit;
- estimasi ekuivalen pembakaran sebagai informasi opsional, bukan kewajiban untuk “membayar” makanan;
- penegasan bahwa scan menghasilkan **0 XP**.

Gunakan bahasa seperti “pilihan gerak” atau “langkah kecil berikutnya”, bukan bahasa yang menimbulkan rasa bersalah.

## 10. Privasi dan keamanan lokasi

- Jelaskan kapan GPS mulai dan berhenti.
- Tampilkan indikator tracking yang jelas.
- Jangan melakukan pelacakan lokasi terus-menerus di luar sesi.
- Rute mentah hanya digunakan untuk verifikasi dalam jendela retensi yang ditetapkan; ringkasan agregat dapat disimpan lebih lama.
- Durasi retensi, penghapusan, ekspor, dan pencabutan izin harus ditetapkan sebelum produksi.
- Rute mentah dan koordinat presisi tidak boleh tampil di leaderboard, komunitas, atau profil publik.

## 11. Metrik keberhasilan produk

Total XP bukan North Star Metric. Ukur kualitas perubahan kebiasaan dengan:

- jumlah hari aktif tervalidasi per minggu;
- retensi pengguna pada minggu ke-4;
- peningkatan konsistensi dari baseline pengguna;
- persentase aktivitas yang tervalidasi dan tingkat false positive banding;
- proporsi pengguna yang menjaga aktivitas tanpa melewati batas aman;
- penggunaan rekomendasi scan sebagai langkah realistis, bukan kompensasi makanan.

## 12. Arsitektur pengalaman

- **Dashboard:** ringkasan hari ini, Health Pulse, aktivitas tervalidasi, konsistensi, dan tindakan berikutnya.
- **Scan:** analisis makanan informatif tanpa reward kompetitif.
- **Aktivitas:** tracking GPS, transparansi validasi, status reward, dan jalur banding.
- **Journey:** riwayat tindakan, refleksi, dan jurnal kesehatan privat pengguna. Pintu masuk Journey dari antarmuka utama cukup melalui Dasbor agar CTA tidak berulang di banyak halaman.
- **Companion:** panduan kontekstual dari Nora; tidak memberi reward dan tidak mendiagnosis.
- **Challenge:** misi dengan syarat validasi yang jelas.
- **Komunitas & Peringkat:** satu halaman terpadu dengan tab Komunitas dan Peringkat. Peringkat tetap memiliki cakupan Liga, Teman, dan Lokal.
- **Reward Store:** ekonomi HP dan fulfillment yang transparan.

Journey dan Companion tetap dua fungsi berbeda, tetapi ditempatkan berdekatan sebagai satu kelompok navigasi karena keduanya membentuk siklus “lihat perjalanan → pahami pola → pilih tindakan berikutnya”.

### Keputusan pengalaman hasil evaluasi tim

- Bahasa utama antarmuka adalah Bahasa Indonesia. Istilah merek seperti NutriVerse, Health Pulse, XP, dan HP boleh dipertahankan.
- Companion/Nora harus ringkas dan berorientasi percakapan. Hindari terlalu banyak paragraf, kartu penjelasan, dan CTA di sekitar area chat.
- Quick Chat harus dapat ditutup dan dibuka kembali tanpa kehilangan pesan selama halaman masih terbuka.
- Story pengguna tidak ditampilkan sebagai fitur internal seperti Instagram karena bertabrakan dengan feed komunitas.
- Ruang story diganti oleh poster event komunitas dan template 9:16 yang dapat dibagikan ke media sosial eksternal. Tombol **Ubah Template** wajib tersedia.
- Template berbagi hanya memakai ringkasan aman dan tidak boleh menyertakan rute, koordinat, jurnal privat, catatan makanan, atau detail kesehatan sensitif.
- Jurnal kesehatan selalu privat secara bawaan, tidak memberi XP/HP, tidak muncul di Komunitas/Peringkat, dan hanya dapat dipakai Nora jika pengguna memberi izin eksplisit.
- Pengingat jeda bersifat opt-in, nonaktif secara bawaan, dan tidak boleh mengklaim mendeteksi posisi duduk jika sensor tersebut tidak tersedia.
- Pengingat dari Nora menggunakan bahasa ringan, dapat ditutup/ditunda, dan tidak memberi XP atau hukuman ketika diabaikan.

## 13. Nada dan desain

- Nada: suportif, muda, jernih, tidak menghakimi, tidak hiperbolis.
- Jangan memakai dark pattern, rasa takut, atau rasa bersalah.
- Layout harus mobile-first, tidak overflow horizontal, dan tetap terbaca pada lebar 320 px sampai desktop.
- Gunakan hierarki sederhana, kartu ringkas, ruang putih cukup, ikon Lucide, dan warna brand emerald.
- Status `Demo`, `Simulated`, `Requires Server`, dan `Roadmap` harus terlihat jelas.

## 14. Kondisi implementasi saat ini

- Frontend menggunakan Next.js, React, TypeScript, Tailwind, dan Lucide.
- Data pengguna, saldo, leaderboard, reward, dan sebagian insight masih data demo/simulasi.
- GPS browser dan kalkulasi rute sisi klien tersedia sebagai demonstrasi.
- Verifikasi produksi, autentikasi, database, ledger reward, fulfillment, AI produksi, anti-spoofing tingkat lanjut, dan kebijakan retensi masih memerlukan backend.
- AI tidak boleh mengklaim fitur roadmap sebagai fitur produksi yang sudah aktif.

## Prompt singkat yang dapat disalin

> Anda membantu mengembangkan NutriVerse, aplikasi kesehatan bergaya game kompetitif untuk membangun kebiasaan sehat Gen Z. CHPS memberi XP hanya dari aktivitas fisik nyata yang tervalidasi; scan makanan informatif dan selalu 0 XP; XP adalah progres peringkat, HP adalah mata uang reward. Prioritaskan anti-cheat multi-sinyal, batas XP dan diminishing return, streak protection tanpa XP istirahat, leaderboard Liga/Teman/Lokal yang adil, ekonomi HP transparan, privasi GPS, aksesibilitas aktivitas, dan metrik hari aktif tervalidasi/retensi minggu ke-4/konsistensi. Gunakan bahasa suportif tanpa rasa bersalah. Bedakan tegas fitur yang sudah aktif, demo, memerlukan server, dan roadmap. Jangan mengubah aturan inti tanpa persetujuan eksplisit.
