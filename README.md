# NutriVerse

> Platform kesehatan & nutrisi *gamified* berbasis Website/PWA, dibangun tim **KOSEK** (Kesehatan Orang Sekarang) untuk kompetisi **AMICTA 2026** — kategori Aplikasi Sistem Informasi. Universitas AMIKOM Yogyakarta.

---

## Tentang Proyek

NutriVerse membuat hidup sehat terasa seperti bermain game kompetitif. Inti sistemnya adalah **CHPS (Competitive Health Progression System)**: pengguna mengumpulkan XP dari aktivitas fisik nyata, naik tier dari **Sprout** hingga **Legend**, dan bersaing di leaderboard.

Prinsip utama yang mengunci desain:

- **XP hanya dari aktivitas fisik nyata yang dilacak GPS** (lari/sepeda/jalan), dengan validasi anti-cheat berbasis kecepatan (pace).
- **Scan makanan bersifat informatif** — menampilkan estimasi gizi dan saran cara membakar kalori, tetapi **tidak menambah XP** (mencegah XP di-farming dari foto makanan).
- **Dua mata uang:** XP untuk peringkat (hanya naik), HP (Health Points) untuk ditukar di Reward Store.

**Core loop:** scan makanan (info + saran bakar) → aktivitas GPS (anti-cheat) → dapat XP → naik tier & leaderboard → tukar reward.

---

## Teknologi

| Lapisan | Teknologi |
|---|---|
| Framework (FE + BE) | Next.js 16 (App Router) + React 19 |
| Bahasa | TypeScript 5 |
| Styling & UI | Tailwind CSS v4 (gaya `@theme`) + shadcn/UI + Lucide |
| Database & Auth | Supabase (PostgreSQL 16+, Auth, Storage, Realtime) |
| ORM | Prisma 7 |
| Validasi & Form | Zod 4 + React Hook Form |
| AI Engine | Gemini API *(multimodal — menyusul di Fase 5)* |
| Deploy | Vercel |

> Catatan arsitektur: seluruh AI memakai **Gemini API** yang dimediasi business logic. Proyek ini tidak membangun/melatih model sendiri (Roboflow/MobileNetV3/scikit-learn tidak dipakai).

---

## Status Pengembangan

```
FASE 1  Fondasi & Design System        SELESAI
FASE 2  Halaman UI + revisi            SELESAI
FASE 3  Database + Auth (Supabase)     SEDANG DIKERJAKAN
FASE 4  Sambungkan UI ke data asli     BERIKUTNYA
FASE 5  AI asli (Gemini API)           BELUM
FASE 6  Deploy ke Vercel               BELUM
```

Catatan: seluruh halaman UI sudah jadi namun masih memakai data dummy (belum ada login/database). Pelacak GPS di halaman **aktivitas sudah benar-benar berfungsi** (menghitung jarak, pace, XP, plus anti-cheat dan mode simulasi untuk uji di dalam ruangan).

---

## Prasyarat

- **Node.js 24.18.0** (disarankan lewat [fnm](https://github.com/Schniz/fnm))
- **pnpm 11+** (aktifkan lewat `corepack enable`)
- **Git**
- Akun **GitHub** yang sudah diundang sebagai *collaborator* repo ini (minta ke Yoga)

> ### Penting untuk pengguna Windows — jebakan dua Node
> Di sebagian laptop terdapat **dua instalasi Node** sekaligus. Terminal VS Code default sering memakai Node sistem yang **tidak punya pnpm**, sehingga muncul error `pnpm: not recognized`.
>
> **Solusi:** gunakan profil terminal **"Windows PowerShell" (5.1)**, atau pastikan fnm termuat. **Selalu cek** sebelum menjalankan perintah pnpm:
> ```powershell
> node -v    # harus menampilkan 24.18.0
> ```

---

## Cara Clone & Instalasi (langkah pertama)

Jalankan di **Windows PowerShell**:

```powershell
# 1. Clone repository
git clone https://github.com/KosekTeamProject/NutriVerse.git
cd NutriVerse

# 2. Pindah ke branch kerja (semua pengembangan ada di develop)
git checkout develop

# 3. Pastikan versi Node benar (lihat catatan jebakan Windows di atas)
node -v      # harus 24.18.0

# 4. Install dependency
pnpm install

# 5. Jalankan server pengembangan
pnpm dev
```

Buka <http://localhost:3000> di browser untuk melihat hasilnya.

> Build script (`sharp`, `unrs-resolver`) sudah disetujui lewat `pnpm-workspace.yaml`, jadi kamu tidak akan terkena error `ERR_PNPM_IGNORED_BUILDS` saat clone.

### Konfigurasi Git sekali di awal (WAJIB, agar tidak error saat push)

Setelah clone, jalankan sekali saja di dalam folder proyek:

```powershell
# Identitas commit-mu (ganti dengan namamu)
git config user.name "Nama Kamu"
git config user.email "email-kamu@contoh.com"

# Samakan cara menggabungkan update: pakai merge (mencegah error "divergent branches")
git config pull.rebase false
```

> Saat pertama kali `git push`, GitHub akan meminta login. Pilih **"Sign in with your browser"** dan login dengan **akun GitHub-mu sendiri** yang sudah diundang sebagai collaborator. Jangan pakai akun orang lain.

---

## Struktur Folder

```
src/
├─ app/
│  ├─ globals.css            Palet emerald + token light/dark (@theme)
│  ├─ layout.tsx             Font + anti-flash dark mode
│  ├─ page.tsx               Landing page
│  └─ (app)/                 Route group halaman aplikasi
│     ├─ dashboard/          Ringkasan, Health Score, widget, notifikasi
│     ├─ aktivitas/          Pelacak GPS (berfungsi) + anti-cheat + izin GPS
│     ├─ scan/               Scan makanan + input manual + AI Chat + riwayat
│     ├─ leaderboard/        Podium + tab Global/Kampus/Teman
│     ├─ challenge/          Challenge Hub (kategori, auto-complete, opsional)
│     ├─ reward/             Reward Store (saldo HP)
│     ├─ profil/             Badge, pencapaian, statistik
│     ├─ komunitas/          Story, feed, community challenge
│     ├─ pengaturan/         Profil, target, dark mode, notifikasi
│     └─ onboarding/         Form input data diri pasca-register
├─ components/
│  ├─ brand/                 RankCrest (perisai SVG per tier)
│  ├─ app/                   AppShell, ActivityTracker, dll.
│  └─ ui/                    ProgressRing, StatCard, komponen shadcn
└─ lib/                      utils, activity, food, tiers, challenges, ...
```

---

## Alur Kerja Git (WAJIB dibaca sebelum mulai)

Dua branch utama:

- **`main`** — produksi, dijaga selalu bersih. Jangan push ke sini langsung.
- **`develop`** — integrasi & kerja aktif. **Semua orang bekerja di sini.**

### Aturan emas (menghindari error & tabrakan)

1. **SELALU `git pull` dulu** sebelum mulai kerja **dan** sebelum push.
2. Kerjakan **hanya file di bagianmu**. Umumkan di grup WA sebelum menyentuh file bersama ("aku pegang file X").
3. **Commit kecil dan sering** lebih aman daripada satu commit besar.
4. **Jangan pernah** commit file `.env` (berisi kunci rahasia).

### Alur harian (ikuti urutan ini persis)

```powershell
# 1. Pastikan di branch develop
git checkout develop

# 2. Tarik update terbaru DULU (wajib, sebelum mulai kerja)
git pull origin develop

# 3. ... kerjakan bagianmu ...

# 4. Simpan perubahan
git add .
git commit -m "feat(aktivitas): simpan hasil GPS ke DB"

# 5. Tarik lagi sebelum push (kalau ada update dari teman)
git pull origin develop

# 6. Kirim ke GitHub
git push origin develop
```

Gunakan **Conventional Commits** untuk pesan commit: `feat`, `fix`, `docs`, `chore`, `style`, `refactor`.

---

## Troubleshooting Git (kalau push gagal)

### 1. Push ditolak: `! [rejected] ... (non-fast-forward)`

Artinya ada perubahan di GitHub yang belum ada di laptopmu (biasanya karena teman sudah push duluan). **Ini normal.** Perbaiki dengan menarik dulu lalu push lagi:

```powershell
git pull origin develop
git push origin develop
```

> Kalau muncul layar editor teks meminta pesan merge: tekan `Esc`, ketik `:wq`, lalu tekan `Enter` (menyimpan & menutup).

### 2. `remote: Repository not found` padahal repo ada

Ini karena Git di laptopmu masih memakai **akun GitHub lama/salah**. Bersihkan login tersimpan:

- Tekan **Start** → ketik **Credential Manager** → buka.
- Klik **Windows Credentials** → cari semua entri yang mengandung **github.com** → klik → **Remove**.
- Kembali ke terminal, jalankan `git push origin develop` lagi.
- Saat diminta login, pilih **"Sign in with your browser"** dan login dengan **akun yang benar** (yang diundang sebagai collaborator).

### 3. Muncul `CONFLICT` saat `git pull`

Dua orang mengubah baris yang sama pada file yang sama. Buka file yang ditandai konflik (ada tanda `<<<<<<<`, `=======`, `>>>>>>>`), pilih versi yang benar, hapus tanda-tanda itu, lalu:

```powershell
git add .
git commit -m "fix: selesaikan konflik merge"
git push origin develop
```

Kalau ragu, **jangan tebak-tebak** — tanya di grup WA sebelum menyimpan.

---

## Pembagian Tim

| Anggota | Peran |
|---|---|
| Yoga | Project Leader / Infra / DevOps |
| Dimas | Database & Quality Assurance / Dokumentasi |
| Fatan | Frontend / UI-UX & Aset Demo |
| Ilham | Backend — Authentication |
| Faishal | Backend — Data/API |

---

## Konvensi Kode

- Folder **kebab-case**; komponen **PascalCase.tsx**; hook **useCamelCase**.
- **TANPA emoji di UI produk** — gunakan ikon Lucide dan tipografi saja. Tujuannya agar hasil terlihat dikerjakan manusia, bukan generate AI.
- Design system: palet emerald, font Plus Jakarta Sans (display) + Inter (body), kartu `rounded-2xl`, tombol pill, shadow lembut.

---

*NutriVerse — Turning Healthy Habits Into Achievements. Tim KOSEK, AMICTA 2026.*
