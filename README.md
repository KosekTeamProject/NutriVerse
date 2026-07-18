# NutriVerse

> Platform kesehatan & nutrisi *gamified* berbasis Website/PWA, dibangun tim **KOSEK** (Kesehatan Orang Sekarang) untuk kompetisi **AMICTA 2026** — kategori Aplikasi Sistem Informasi. Universitas AMIKOM Yogyakarta.

---

## Tentang Proyek

NutriVerse membuat hidup sehat terasa seperti bermain game kompetitif. Inti sistemnya adalah **CHPS (Competitive Health Progression System)**: pengguna mengumpulkan XP dari aktivitas fisik nyata, naik tier dari **Sprout** hingga **Legend**, dan bersaing di leaderboard.

Prinsip utama yang mengunci desain:

- **XP hanya dari aktivitas fisik nyata yang dilacak GPS** (lari/sepeda), dengan validasi anti-cheat berbasis kecepatan (pace).
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
| AI & Vision | Gemini API + Roboflow *(menyusul)* |
| Deploy | Vercel |

---

## Status Pengembangan

```
FASE 1  Fondasi & Design System        SELESAI
FASE 2  Halaman UI (data dummy)        SELESAI (Tahap Revisi)
FASE 3  Database + Auth (Supabase)     SEDANG DIKERJAKAN
FASE 4  Sambungkan UI ke data asli     BERIKUTNYA
FASE 5  AI asli (Roboflow + Gemini)    BELUM
FASE 6  Deploy ke Vercel               BELUM
```

Catatan: seluruh halaman UI sudah jadi namun masih memakai data dummy (belum ada login/database). Pelacak GPS di halaman **aktivitas sudah benar-benar berfungsi** (menghitung jarak, pace, XP, plus anti-cheat dan mode simulasi untuk uji di dalam ruangan).

---

## Prasyarat

- **Node.js 24.18.0** (disarankan lewat [fnm](https://github.com/Schniz/fnm))
- **pnpm 11+** (aktifkan lewat `corepack enable`)
- **Git**

> ### Penting untuk pengguna Windows — jebakan dua Node
> Di sebagian laptop terdapat **dua instalasi Node** sekaligus. Terminal VS Code default sering memakai Node sistem yang **tidak punya pnpm**, sehingga muncul error `pnpm: not recognized`.
>
> **Solusi:** gunakan profil terminal **"Windows PowerShell" (5.1)**, atau pastikan fnm termuat. **Selalu cek** sebelum menjalankan perintah pnpm:
> ```powershell
> node -v    # harus menampilkan 24.18.0
> ```

---

## Cara Clone & Instalasi

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

Terakhir, atur identitas commit-mu sendiri:

```powershell
git config user.name "Nama Kamu"
git config user.email "email-kamu@contoh.com"
```

---

## Struktur Folder

```
src/
├─ app/
│  ├─ globals.css            Palet emerald + token light/dark (@theme)
│  ├─ layout.tsx             Font + anti-flash dark mode
│  ├─ page.tsx               Landing page
│  └─ (app)/                 Route group halaman aplikasi
│     ├─ dashboard/          Ringkasan, Health Score, grafik XP
│     ├─ aktivitas/          Pelacak GPS (berfungsi) + anti-cheat
│     ├─ scan/               Scan makanan (informatif, tanpa XP)
│     ├─ leaderboard/        Podium + tab Global/Kampus/Teman
│     ├─ challenge/          Challenge Hub terpadu
│     ├─ reward/             Reward Store (saldo HP)
│     ├─ profil/             Badge, pencapaian, statistik
│     ├─ komunitas/          Story, feed, community challenge
│     └─ pengaturan/         Profil, target, dark mode, notifikasi
├─ components/
│  ├─ brand/                 RankCrest (perisai SVG per tier)
│  ├─ app/                   AppShell, ActivityTracker, dll.
│  └─ ui/                    ProgressRing, StatCard, komponen shadcn
└─ lib/                      utils, activity, food, tiers, challenges, ...
```

---

## Alur Kerja Git

- **`main`** — produksi, dijaga selalu bersih.
- **`develop`** — integrasi & kerja aktif. **Semua orang bekerja di sini.**

Alur harian (biasakan, untuk menghindari tabrakan):

```powershell
git checkout develop
git pull                    # SELALU tarik update dulu sebelum kerja
# ... kerjakan bagianmu ...
git add .
git commit -m "feat(aktivitas): simpan hasil GPS ke DB"
git pull                    # tarik lagi kalau ada perubahan teman
git push
```

Gunakan **Conventional Commits**: `feat`, `fix`, `docs`, `chore`, `style`, `refactor`.

> **Koordinasi:** sebelum menyentuh file bersama, umumkan dulu di grup WA tim ("aku pegang file X"). Commit kecil dan sering lebih aman daripada satu commit besar.

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
