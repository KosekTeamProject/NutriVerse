# Konfigurasi n8n untuk Pindai Makanan NutriVerse

Backend NutriVerse memakai urutan penyedia berikut:

1. webhook n8n sebagai penyedia utama;
2. OpenAI langsung dari backend sebagai fallback bila `OPENAI_API_KEY` tersedia;
3. katalog makanan lokal untuk pencarian teks yang sudah dikenal.

Foto kamera dikirim ke backend sebagai multipart, diputar sesuai EXIF,
diperkecil, dan dibersihkan metadata-nya. Foto baru diunggah ke storage ketika
pengguna menekan **Simpan ke riwayat**, sehingga percobaan scan yang dibatalkan
tidak meninggalkan file publik.

## Import workflow

1. Buka n8n, pilih **Workflows → Import from File**.
2. Impor `n8n/workflows/nutriverse-food-scan.json`.
3. Buka node **Food Scan Webhook**.
4. Pada Authentication pilih **Header Auth**, lalu buat credential:
   - Name: `x-nutriverse-agent-secret`
   - Value: secret acak yang sama dengan `N8N_SCAN_SHARED_SECRET` di backend.
5. Buka node **OpenAI Food Vision**.
6. Pada Credential pilih atau buat **OpenAI API** credential dan masukkan
   Project API key. API key tidak boleh ditulis di browser atau source code.
7. Jalankan **Test workflow** sekali, lalu aktifkan workflow.
8. Salin **Production URL**, bukan Test URL.

Struktur node setelah import:

```text
Food Scan Webhook
  → Prepare OpenAI Request
  → OpenAI Food Vision
  → Parse Food JSON
  → Return Food Analysis
```

Node OpenAI memakai Responses API dan structured JSON. Bila model
`gpt-5-mini` tidak tersedia pada project Anda, ubah field `model` di node
**Prepare OpenAI Request** ke model vision yang tersedia pada project tersebut.

## Environment backend

Tambahkan pada `.env` lokal Next.js:

```dotenv
N8N_SCAN_WEBHOOK_URL=https://<workspace>.app.n8n.cloud/webhook/nutriverse/food-scan
N8N_SCAN_SHARED_SECRET=<secret-panjang-minimal-32-karakter>
N8N_SCAN_TIMEOUT_MS=30000

# Opsional tetapi disarankan agar scan tetap hidup ketika n8n sedang mati
OPENAI_API_KEY=<project-api-key>
OPENAI_FOOD_SCAN_MODEL=gpt-5-mini
```

Restart `pnpm dev` setelah mengubah `.env`.

## Uji kontrak

Backend mengirim JSON berikut ke n8n:

```json
{
  "requestId": "uuid",
  "userId": "uuid-internal",
  "query": "nasi goreng",
  "imageDataUrl": "data:image/jpeg;base64,...",
  "locale": "id-ID"
}
```

n8n wajib menjawab:

```json
{
  "success": true,
  "food": {
    "name": "Nasi Goreng",
    "portion": "1 piring",
    "kcal": 333,
    "protein": 9,
    "carbs": 44,
    "fat": 12,
    "fiber": 2,
    "sugar": 3,
    "sodium": 640,
    "vitamins": "B1, B3"
  }
}
```

Backend memvalidasi semua angka dan menolak respons yang tidak lengkap atau di
luar batas. Hasil scan belum mengubah database sampai identitas makanan dan
porsi dikonfirmasi pengguna. Setelah tombol **Simpan ke riwayat** ditekan,
foto dan `NutritionEntry` disimpan, lalu Health Pulse dihitung ulang.

## Jika n8n mati

- Pastikan workflow berstatus **Active**.
- Pastikan backend memakai Production URL (`/webhook/`), bukan URL test
  (`/webhook-test/`).
- Periksa execution log node Webhook dan OpenAI.
- Pastikan Header Auth sama persis dengan `N8N_SCAN_SHARED_SECRET`.
- Pastikan OpenAI credential mempunyai billing/quota dan akses ke model.
- Bila `OPENAI_API_KEY` backend tersedia, aplikasi otomatis mencoba OpenAI
  langsung setelah n8n timeout tanpa mengekspos key ke frontend.

## Catatan keamanan

- Jangan memberikan credential Supabase atau database kepada n8n.
- Jangan menaruh OpenAI API key pada variable `NEXT_PUBLIC_*`.
- Jangan menyimpan isi base64 gambar pada execution log lebih lama dari yang
  diperlukan; atur pruning execution pada n8n.
- Estimasi AI harus dikonfirmasi pengguna dan tidak dipakai sebagai diagnosis.

Referensi resmi:

- [n8n Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Respond to Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/)
- [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create)
