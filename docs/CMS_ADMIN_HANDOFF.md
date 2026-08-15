# NutriVerse CMS & Admin Handoff

Dokumen ini menjelaskan status CMS dan panel Admin NutriVerse untuk pengembangan lanjutan.

## Status akses

Semua fitur saat ini berjalan lokal dan belum dipush atau di-hosting.

Panel admin:

```text
http://localhost:3000/admin
```

Panel CMS artikel:

```text
http://localhost:3000/admin/cms
```

Kategori dan tag:

```text
http://localhost:3000/admin/cms/taxonomy
```

Akses CMS menggunakan role `ADMIN`, `MODERATOR`, `EDITOR`, atau `AUTHOR`.

## Fitur yang sudah dibuat

### Panel Admin utama

- Ringkasan statistik platform.
- Manajemen pengguna dan role.
- Moderasi laporan konten.
- Review aktivitas dan banding.
- Manajemen challenge.
- Manajemen event.
- Manajemen reward dan redemption.
- Manajemen leaderboard season.
- Pengaturan sistem.
- Audit log.
- Proteksi akses berbasis role.

### CMS artikel

- Membuat artikel.
- Edit artikel.
- Draft artikel.
- Status `DRAFT`, `REVIEW`, `PUBLISHED`, dan `ARCHIVED`.
- Ajukan artikel untuk review.
- Publish dan unpublish artikel.
- Archive artikel.
- Duplikasi artikel.
- Bulk publish.
- Bulk archive.
- Search judul dan slug.
- Filter status.
- Pagination.
- Preview artikel.
- Autosave draft ke browser.
- Draft recovery.
- Upload cover image.
- Audit log artikel.
- Notifikasi author saat publish atau dikembalikan.

### Kategori dan tag

- Tambah, edit, dan hapus kategori.
- Tambah, edit, dan hapus tag.
- Slug kategori/tag.
- Memasang banyak tag ke artikel.
- Mencegah penghapusan kategori yang masih digunakan.

### Database CMS

Migration sudah diterapkan ke database:

```text
20260814090000_add_cms_content_foundation
```

Model utama:

```text
CmsArticle
CmsCategory
CmsTag
CmsArticleTag
CmsMedia
CmsArticleRevision
CmsArticleStatusHistory
CmsPublicationStatus
```

### Media

- Upload gambar ke bucket `cms-media`.
- Format JPEG, PNG, dan WebP.
- Validasi ukuran dan MIME type.
- Sanitasi gambar.

## Workflow editorial

```text
AUTHOR membuat draft
        ↓
REVIEW
        ↓
MODERATOR/EDITOR meninjau
        ↓
PUBLISHED
```

Jika artikel ditolak:

```text
REVIEW → DRAFT
```

Alasan penolakan disimpan pada `rejectionReason`, status dicatat pada history, dan author menerima notifikasi.

## Endpoint CMS

### Publik

```text
GET /api/content/articles
GET /api/content/categories
GET /api/content/tags
GET /api/events
```

### Artikel admin

```text
GET    /api/admin/cms/articles
POST   /api/admin/cms/articles
PATCH  /api/admin/cms/articles/:articleId
DELETE /api/admin/cms/articles/:articleId
POST   /api/admin/cms/articles/:articleId/submit-review
POST   /api/admin/cms/articles/:articleId/duplicate
GET    /api/admin/cms/articles/:articleId/history
POST   /api/admin/cms/articles/bulk
```

### Kategori dan tag

```text
GET    /api/admin/cms/categories
POST   /api/admin/cms/categories
PATCH  /api/admin/cms/categories/:categoryId
DELETE /api/admin/cms/categories/:categoryId

GET    /api/admin/cms/tags
POST   /api/admin/cms/tags
PATCH  /api/admin/cms/tags/:tagId
DELETE /api/admin/cms/tags/:tagId
```

### Media

```text
POST /api/storage/upload
```

Gunakan bucket:

```text
cms-media
```

## Yang belum dikerjakan

### Editor

- Rich text editor profesional seperti TipTap atau Lexical.
- Toolbar heading, bold, italic, list, link, blockquote, tabel, dan embed.
- Sanitasi HTML khusus rich text.
- Preview yang sama persis dengan halaman publik.

### Permission dan workflow

- Author hanya dapat mengedit artikel miliknya.
- Permission khusus Editor dan Moderator.
- Halaman antrean review khusus.
- Tombol approval/rejection khusus moderator.
- Notifikasi realtime dan email.

### Media library

- Gallery semua media.
- Search media.
- Alt text.
- Metadata media.
- Deteksi media yang sedang digunakan.
- Hapus media dari panel.
- Thumbnail dan resize.

### Integrasi frontend user

- Halaman daftar artikel publik.
- Halaman detail artikel berdasarkan slug.
- Artikel di halaman Bantuan/Edukasi.
- Artikel unggulan dan artikel terkait.
- Filter kategori/tag di frontend.

### Preview event Dashboard

Carousel event sudah tersedia di Komunitas, tetapi belum ditambahkan ke Dashboard.

Yang perlu dibuat:

- Preview event di antara kartu atas dan Aksi Cepat.
- Carousel/slide event di Dashboard.
- Sinkronisasi data event Dashboard dan Komunitas.
- Tampilan event kosong dan event berakhir.

### Fitur CMS berikutnya

- Banner CMS.
- FAQ CMS.
- Pengumuman CMS.
- Konten onboarding dinamis.
- Konten edukasi Nora.
- Scheduling publish/unpublish.
- Restore revision.
- Perbandingan versi artikel.
- Soft delete.

### Security dan testing

- RLS tabel CMS.
- RLS bucket `cms-media`.
- Test semua role.
- Test workflow review/publish/reject.
- Test upload media.
- Test duplicate slug.
- Test bulk action.
- Test revision history.
- Test migration dan rollback.

## File penting

```text
prisma/schema.prisma
prisma/migrations/20260814090000_add_cms_content_foundation/migration.sql

src/app/admin/cms/page.tsx
src/app/admin/cms/taxonomy/page.tsx
src/components/admin/CmsArticlePanel.tsx
src/components/admin/CmsTaxonomyPanel.tsx

src/app/api/admin/cms/articles/route.ts
src/app/api/admin/cms/articles/[articleId]/route.ts
src/app/api/admin/cms/articles/[articleId]/history/route.ts
src/app/api/admin/cms/articles/[articleId]/duplicate/route.ts
src/app/api/admin/cms/articles/[articleId]/submit-review/route.ts
src/app/api/admin/cms/articles/bulk/route.ts
src/app/api/admin/cms/categories/route.ts
src/app/api/admin/cms/categories/[categoryId]/route.ts
src/app/api/admin/cms/tags/route.ts
src/app/api/admin/cms/tags/[tagId]/route.ts
src/app/api/storage/upload/route.ts
```

## Catatan untuk developer berikutnya

- Jangan membuat tabel event baru. Tabel `Event` sudah digunakan oleh Komunitas dan registrasi.
- Konten publik hanya boleh menampilkan status `PUBLISHED`.
- Semua endpoint CMS harus memakai `requireCmsEditor()`.
- Semua perubahan editorial penting harus membuat audit log.
- Jangan commit file `.env`.
- Migration sudah diterapkan ke database yang digunakan lokal.
- Sebelum mengubah schema, buat migration baru; jangan mengedit migration yang sudah diterapkan.
- Perubahan saat ini belum dipush ke GitHub dan belum dideploy.
