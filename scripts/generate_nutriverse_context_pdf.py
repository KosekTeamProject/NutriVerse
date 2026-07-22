from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "NutriVerse_Product_System_AI_Context.pdf"
LOGO = ROOT / "public" / "brand" / "nutriverse-app-icon-200.png"

PAGE_W, PAGE_H = A4
MARGIN_X = 1.65 * cm
MARGIN_Y = 1.55 * cm

INK = colors.HexColor("#0B2419")
MUTED = colors.HexColor("#587064")
BRAND = colors.HexColor("#00A876")
BRAND_DARK = colors.HexColor("#007A55")
LIME = colors.HexColor("#9FD62D")
PALE = colors.HexColor("#EAF8F1")
PALE_2 = colors.HexColor("#F5FAF7")
LINE = colors.HexColor("#D7E8DE")
AMBER = colors.HexColor("#B96900")
RED = colors.HexColor("#A22C2C")


def register_fonts() -> tuple[str, str]:
    regular = Path(r"C:\Windows\Fonts\arial.ttf")
    bold = Path(r"C:\Windows\Fonts\arialbd.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("NutriSans", str(regular)))
        pdfmetrics.registerFont(TTFont("NutriSansBold", str(bold)))
        return "NutriSans", "NutriSansBold"
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_fonts()


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="NVTitle", fontName=FONT_BOLD, fontSize=30, leading=34,
    textColor=INK, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="NVSubtitle", fontName=FONT, fontSize=12.5, leading=18,
    textColor=MUTED, spaceAfter=16,
))
styles.add(ParagraphStyle(
    name="NVH1", fontName=FONT_BOLD, fontSize=19, leading=24,
    textColor=INK, spaceBefore=4, spaceAfter=10, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="NVH2", fontName=FONT_BOLD, fontSize=13.5, leading=17,
    textColor=BRAND_DARK, spaceBefore=12, spaceAfter=6, keepWithNext=True,
))
styles.add(ParagraphStyle(
    name="NVBody", fontName=FONT, fontSize=9.4, leading=14.2,
    textColor=INK, spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="NVSmall", fontName=FONT, fontSize=8, leading=11,
    textColor=MUTED, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="NVCardTitle", fontName=FONT_BOLD, fontSize=10.2, leading=13,
    textColor=INK, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="NVTableHeader", fontName=FONT_BOLD, fontSize=9.4, leading=11.6,
    textColor=colors.white,
))
styles.add(ParagraphStyle(
    name="NVCardBody", fontName=FONT, fontSize=8.3, leading=11.5,
    textColor=MUTED,
))
styles.add(ParagraphStyle(
    name="NVCallout", fontName=FONT_BOLD, fontSize=9.4, leading=13.5,
    textColor=BRAND_DARK,
))
styles.add(ParagraphStyle(
    name="NVCode", fontName="Courier", fontSize=7.55, leading=10.5,
    textColor=INK,
))


def para(text: str, style: str = "NVBody") -> Paragraph:
    return Paragraph(escape(text).replace("\n", "<br/>"), styles[style])


def rich(text: str, style: str = "NVBody") -> Paragraph:
    return Paragraph(text.replace("\n", "<br/>"), styles[style])


def section(title: str, intro: str | None = None) -> list:
    block = [para(title, "NVH1")]
    if intro:
        block.append(para(intro))
    return block


def bullets(items: list[str]) -> list:
    return [rich(f'<font color="#00A876"><b>-</b></font> {escape(item)}') for item in items]


def note(title: str, body: str, tone: str = "green") -> Table:
    palette = {
        "green": (PALE, BRAND_DARK),
        "amber": (colors.HexColor("#FFF5E7"), AMBER),
        "red": (colors.HexColor("#FFF0F0"), RED),
    }
    fill, accent = palette[tone]
    table = Table([[rich(f'<font color="#{accent.hexval()[2:]}"><b>{escape(title)}</b></font><br/>{escape(body)}', "NVCardBody")]], colWidths=[PAGE_W - 2 * MARGIN_X])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("BOX", (0, 0), (-1, -1), 0.65, colors.HexColor("#CBE7D8")),
        ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return table


def cards(items: list[tuple[str, str]], cols: int = 2) -> Table:
    width = (PAGE_W - 2 * MARGIN_X) / cols
    rows = []
    for start in range(0, len(items), cols):
        row = []
        for title, body in items[start:start + cols]:
            row.append([para(title, "NVCardTitle"), para(body, "NVCardBody")])
        while len(row) < cols:
            row.append("")
        rows.append(row)
    table = Table(rows, colWidths=[width] * cols, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE_2),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return table


def data_table(headers: list[str], rows: list[list[str]], widths: list[float]) -> Table:
    converted = [[para(header, "NVTableHeader") for header in headers]]
    for row in rows:
        converted.append([para(cell, "NVCardBody") for cell in row])
    table = Table(converted, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


class NutriDoc(BaseDocTemplate):
    def __init__(self, filename: str):
        super().__init__(filename, pagesize=A4, leftMargin=MARGIN_X, rightMargin=MARGIN_X, topMargin=MARGIN_Y, bottomMargin=1.35 * cm)
        from reportlab.platypus import Frame, PageTemplate
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates([PageTemplate(id="Nutri", frames=[frame], onPage=self.draw_header_footer)])

    def draw_header_footer(self, canvas, doc):
        canvas.saveState()
        if doc.page > 1:
            canvas.setStrokeColor(LINE)
            canvas.line(MARGIN_X, PAGE_H - 0.92 * cm, PAGE_W - MARGIN_X, PAGE_H - 0.92 * cm)
            canvas.setFont(FONT_BOLD, 7.5)
            canvas.setFillColor(BRAND_DARK)
            canvas.drawString(MARGIN_X, PAGE_H - 0.67 * cm, "NUTRIVERSE - PRODUCT SYSTEM & AI CONTEXT")
            canvas.setFont(FONT, 7.5)
            canvas.setFillColor(MUTED)
            canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 0.67 * cm, "Dokumen kerja - Juli 2026")
        canvas.setStrokeColor(LINE)
        canvas.line(MARGIN_X, 0.87 * cm, PAGE_W - MARGIN_X, 0.87 * cm)
        canvas.setFont(FONT, 7.3)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN_X, 0.6 * cm, "Konteks produk untuk tim NutriVerse dan AI pendukung")
        canvas.drawRightString(PAGE_W - MARGIN_X, 0.6 * cm, f"Halaman {doc.page}")
        canvas.restoreState()


def build_pdf() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = NutriDoc(str(OUTPUT))
    story: list = []

    # Cover
    story.append(Spacer(1, 1.45 * cm))
    if LOGO.exists():
        image = Image(str(LOGO), width=2.5 * cm, height=2.5 * cm)
        image.hAlign = "LEFT"
        story.append(image)
        story.append(Spacer(1, 0.32 * cm))
    story.append(para("NutriVerse", "NVTitle"))
    story.append(para("Product System, Workflow, and AI Context", "NVTitle"))
    story.append(para("Dokumen induk untuk menjelaskan logika produk, rancangan pengalaman, aturan sistem, serta status implementasi NutriVerse kepada anggota tim dan AI pendukung.", "NVSubtitle"))
    story.append(note("Tujuan dokumen", "Jika isi dokumen ini diberikan kepada AI lain, AI tersebut harus memahami bahwa NutriVerse bukan sekadar aplikasi tracking kesehatan. Ini adalah sistem pembentukan kebiasaan sehat yang digamifikasi secara aman, adil, dan berorientasi privasi.", "green"))
    story.append(Spacer(1, 0.7 * cm))
    story.append(cards([
        ("Produk", "Aplikasi kesehatan kompetitif untuk Gen Z dengan CHPS: aktivitas GPS nyata -> XP -> tier dan leaderboard -> HP -> reward."),
        ("Prinsip pengaman", "Tidak ada XP dari foto makanan, jurnal, chat, atau Moment. Kompetisi dibatasi oleh validasi, batas XP, dan privasi."),
        ("Status", "Frontend MVP/prototipe aktif. Beberapa interaksi masih simulasi lokal dan membutuhkan backend sebelum produksi."),
        ("Pembaca utama", "Tim produk, desain, frontend, backend, QA, moderator, mitra reward, dan AI yang membantu proyek."),
    ]))
    story.append(Spacer(1, 0.8 * cm))
    story.append(para("Versi konteks: Juli 2026", "NVSmall"))
    story.append(para("Sumber: rancangan produk, keputusan evaluasi tim, dan implementasi frontend pada repositori NutriVerse.", "NVSmall"))
    story.append(PageBreak())

    # How to use + contents
    story += section("1. Cara memakai dokumen ini", "Dokumen ini adalah kontrak konteks. AI atau anggota tim harus menggunakan bagian aturan inti sebagai batas sebelum menyarankan perubahan produk maupun kode.")
    story += bullets([
        "Baca bagian 2 sampai 5 sebelum mengubah mekanisme XP, HP, challenge, aktivitas, atau leaderboard.",
        "Baca bagian 6 sampai 12 sebelum merancang halaman atau flow pengguna.",
        "Baca bagian 13 sampai 16 sebelum mengklaim suatu fitur telah siap produksi.",
        "Jika ada konflik antara ide baru dan aturan inti, jangan membuat asumsi. Tandai keputusan yang membutuhkan persetujuan tim produk.",
    ])
    story.append(note("Larangan klaim", "Jangan menyebut simulasi frontend sebagai verifikasi produksi, sistem AI klinis, transaksi reward nyata, atau autentikasi aman. Selalu pisahkan status Active UI, Simulated, Requires Server, dan Roadmap.", "amber"))
    story.append(Spacer(1, 0.22 * cm))
    story += section("Daftar isi", None)
    contents = [
        "1. Cara memakai dokumen ini", "2. Ringkasan produk dan masalah yang diselesaikan", "3. CHPS dan core loop", "4. Aturan inti yang tidak boleh dilanggar", "5. Model XP, HP, tier, dan challenge", "6. Verifikasi GPS dan anti-cheat", "7. Flow akun dan pengalaman pengguna", "8. Peta halaman aplikasi user", "9. Journey, Health Pulse, dan Nora", "10. Komunitas, event, leaderboard, Moments, dan Studio Share", "11. Reward, profil, pengaturan, dan break reminder", "12. Portal admin /admin", "13. Privasi, keamanan, dan moderasi", "14. Desain, responsivitas, dan identitas brand", "15. Arsitektur teknis dan status implementasi", "16. Data, state, dan kontrak backend", "17. Metrik keberhasilan, QA, dan roadmap", "18. Prompt konteks siap salin untuk AI", "19. Glosarium",
    ]
    story += bullets(contents)
    story.append(PageBreak())

    # Product summary
    story += section("2. Ringkasan produk dan masalah yang diselesaikan", "NutriVerse membuat hidup sehat terasa seperti permainan kompetitif, tetapi tidak mengorbankan keselamatan, keadilan, atau privasi.")
    story.append(para("Target utamanya adalah Gen Z Indonesia yang sering memahami kesehatan sebagai sesuatu yang berat, membosankan, atau tidak konsisten. NutriVerse menerjemahkan kebiasaan nyata menjadi progres yang dapat dilihat: aktivitas fisik tervalidasi meningkatkan XP, membuka tier, memperbaiki posisi kompetitif, dan menghasilkan HP yang dapat ditukar pada Reward Store."))
    story.append(cards([
        ("Masalah perilaku", "Motivasi bergerak tidak konsisten; target kesehatan terasa abstrak; progres kecil sulit terlihat; dan media sosial sering mendorong perbandingan yang tidak sehat."),
        ("Jawaban NutriVerse", "Loop tindakan kecil -> bukti aktivitas nyata -> progres terukur -> dukungan sosial -> refleksi. Kompetisi dibuat suportif melalui liga, scope yang setara, dan batas aman."),
        ("Nilai pengguna", "Pengguna tahu langkah berikutnya, melihat konsistensi, mendapat validasi fair, memiliki ruang refleksi privat, dan dapat membagikan pencapaian aman."),
        ("Nilai bisnis/komunitas", "Retensi melalui kebiasaan, promosi organik lewat template media sosial ber-watermark, event lokal, challenge, reward mitra, dan komunitas sehat."),
    ]))
    story.append(Spacer(1, 0.16 * cm))
    story.append(note("Posisi etis", "Gamifikasi adalah alat untuk membangun kebiasaan, bukan alat untuk membuat pengguna berolahraga berlebihan atau merasa bersalah karena makan/beristirahat.", "green"))

    story += section("3. CHPS dan core loop", "CHPS adalah Competitive Health Progression System. Sistem ini memisahkan aktivitas yang benar-benar dapat dipercaya dari aktivitas informatif atau sosial.")
    loop_rows = [[
        "1. Scan makanan", "2. Aktivitas GPS", "3. Validasi", "4. Progres", "5. Reward & refleksi",
    ], [
        "Estimasi gizi dan saran langkah kecil. Selalu 0 XP.", "Jalan, lari, atau sepeda dimulai secara sadar oleh pengguna.", "Server mengevaluasi telemetry, pace, koordinat, dan risiko spoofing.", "Aktivitas verified memberi XP; challenge valid dapat memberi bonus satu kali; tier dan leaderboard diperbarui.", "HP dipakai untuk reward. Journey, Health Pulse, dan Nora membantu membaca pola tanpa menghakimi.",
    ]]
    loop_table = Table([[para(cell, "NVTableHeader") for cell in loop_rows[0]], [para(cell, "NVCardBody") for cell in loop_rows[1]]], colWidths=[(PAGE_W - 2 * MARGIN_X) / 5] * 5)
    loop_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, -1), PALE_2), ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(loop_table)
    story.append(Spacer(1, 0.15 * cm))
    story.append(para("Urutan ini penting: makanan membantu keputusan sehat, tetapi bukan sumber farming reward. Satu-satunya pintu kompetitif adalah aktivitas fisik nyata yang melewati validasi."))
    story.append(PageBreak())

    # invariants / economics
    story += section("4. Aturan inti yang tidak boleh dilanggar", "Aturan berikut adalah invariant produk. Jangan mengubahnya tanpa keputusan eksplisit dari tim produk.")
    invariants = [
        "XP kompetitif hanya berasal dari aktivitas fisik nyata yang tervalidasi. Pada MVP: jalan, lari, dan sepeda berbasis GPS.",
        "Challenge dapat memberi bonus XP satu kali, tetapi hanya bila syaratnya diselesaikan oleh aktivitas GPS verified yang relevan. Challenge tidak boleh menjadi jalur bypass validasi.",
        "Scan makanan, chat Nora, jurnal, refleksi, self-report, Moment, dan unggahan foto tidak memberi XP maupun HP.",
        "XP dan HP adalah dua mata uang berbeda. XP hanya naik sebagai progres peringkat; HP dapat dibelanjakan pada reward.",
        "Aktivitas pending, needs-review, not-verified, manual-review, atau simulated tidak boleh memengaruhi saldo, ranking, XP kompetitif, atau challenge kompetitif.",
        "Rest day dan recovery dihormati melalui streak protection, tetapi tidak diberi XP.",
        "Leaderboard tidak boleh mengekspos rute presisi, koordinat, jurnal privat, detail makanan, atau kondisi kesehatan sensitif.",
        "Nora adalah pendamping wellness, bukan dokter, verifikator aktivitas, pemberi reward, atau mesin keputusan klinis.",
    ]
    story += bullets(invariants)
    story.append(note("Konsekuensi desain", "Tampilan yang tampak menyenangkan tetapi melanggar aturan di atas tetap dianggap salah. Contoh: memberi XP karena foto makanan, menambahkan XP manual untuk Moment, atau menampilkan rute GPS di komunitas.", "red"))

    story += section("5. Model XP, HP, tier, dan challenge", "Model ekonomi harus mudah dipahami pengguna dan dapat diaudit oleh sistem.")
    story.append(data_table(
        ["Komponen", "Fungsi", "Aturan utama", "Status MVP"],
        [
            ["XP", "Progres kompetitif dan tier.", "Hanya aktivitas verified + bonus challenge verified. Tidak berkurang.", "Tampilan dan simulasi aktif; grant final perlu server."],
            ["HP", "Mata uang Reward Store.", "Hanya sumber tepercaya; ada cap, anti-inflasi, ledger, stok, dan audit.", "Saldo/redeem masih simulasi lokal."],
            ["Tier", "Identitas progres dari Sprout sampai Legend.", "Naik mengikuti XP kumulatif; tidak menentukan nilai kesehatan pengguna.", "UI/progres demo tersedia."],
            ["Challenge", "Misi harian, mingguan, bulanan, dan event.", "Manual/self-report boleh muncul sebagai kebiasaan, tetapi bukan sumber reward kompetitif.", "State lokal/deterministik; server pending."],
        ],
        [2.0 * cm, 3.0 * cm, 6.5 * cm, 4.0 * cm],
    ))
    story.append(Spacer(1, 0.18 * cm))
    story.append(para("Rancangan progres aman: tetapkan cap XP harian, diminishing return setelah ambang, dan streak protection untuk hari pemulihan. Nilai angka cap/multiplier belum dianggap final sampai diuji dan disetujui tim produk."))
    story.append(PageBreak())

    # Activity verification
    story += section("6. Verifikasi GPS dan anti-cheat", "Aktivitas harus dinilai sebagai bukti telemetry, bukan hanya angka pace rata-rata. Browser hanya boleh memberi preview; keputusan final dilakukan server.")
    story.append(para("Flow aktivitas: pengguna memilih jenis aktivitas -> memberi izin lokasi -> menekan Mulai -> GPS aktif hanya sepanjang sesi -> pengguna menyelesaikan atau membatalkan -> telemetry dikirim untuk validasi -> sistem mengembalikan status dan alasan ringkas -> reward baru diberikan bila hasil verified."))
    story.append(data_table(
        ["Status", "Arti bagi pengguna", "Dampak sistem"],
        [
            ["pending", "Aktivitas sedang diproses.", "Tidak ada XP/HP/ranking sampai selesai."],
            ["verified", "Sinyal telemetry lolos pemeriksaan.", "Eligible untuk XP, HP sesuai aturan, challenge, dan leaderboard."],
            ["needs-review", "Ada sinyal yang butuh peninjauan tambahan.", "Ditahan dari reward; tampil sebagai riwayat privat."],
            ["not-verified", "Data tidak memenuhi standar, misalnya durasi/duplikasi bermasalah.", "Tidak memberi reward atau ranking; tetap dapat disimpan privat."],
            ["manual-review", "Banding/peninjauan admin sedang berjalan.", "Reward ditahan sampai hasil keputusan."],
        ],
        [3.0 * cm, 6.0 * cm, 6.5 * cm],
    ))
    story.append(Spacer(1, 0.18 * cm))
    story.append(para("Sinyal anti-cheat minimum: batas kecepatan menurut jenis aktivitas, lonjakan koordinat/jarak tidak mungkin, urutan timestamp, sampel duplikat, gap telemetry, akurasi GPS, pola kendaraan, durasi ekstrem, sumber lokasi simulasi, replay/spoofing, dan aktivitas duplikat lintas sesi."))
    story.append(note("Prinsip keadilan", "Satu sinyal risiko tidak otomatis membuat pengguna curang. UI harus menjelaskan alasan dengan bahasa netral dan menyediakan mekanisme banding/peninjauan manusia.", "green"))

    # User account flow
    story += section("7. Flow akun dan pengalaman pengguna", "Semua halaman personal dilindungi sesi. Pengguna tanpa sesi hanya melihat landing, Masuk, atau Daftar.")
    account_steps = [
        "Landing publik: menjelaskan CHPS, cara kerja, tier/liga, dan reward. Jika ada sesi, landing menampilkan sapaan serta jalan ke Dasbor.",
        "Daftar: identitas akun -> baseline kesehatan yang relevan -> tingkat aktivitas/tujuan -> personalisasi nama pendamping AI. Input bersifat onboarding, bukan diagnosis.",
        "Masuk Google / login: tersedia sebagai alur UI. Produksi membutuhkan OAuth, backend, session management, dan proteksi role.",
        "Setelah masuk: pengguna melihat dashboard personal, bottom navigation mobile, serta drawer untuk menu lengkap.",
        "Profil: nama AI Companion hanya dapat diubah di Preferensi Pendamping AI pada Profil, bukan di halaman chat Nora.",
        "Logout: menghapus sesi lokal prototipe dan kembali ke landing publik.",
    ]
    story += bullets(account_steps)
    story.append(note("Batas MVP", "Password, baseline, sesi, dan preferensi nama Nora masih dapat disimulasikan melalui localStorage. Jangan menyamakan ini dengan autentikasi atau penyimpanan produksi.", "amber"))
    story.append(PageBreak())

    # Page map
    story += section("8. Peta halaman aplikasi user", "Navigasi mengikuti tugas utama pengguna. Bahasa antarmuka utama adalah Bahasa Indonesia; nama merek dan istilah teknis seperti XP, HP, dan Health Pulse dipertahankan.")
    route_rows = [
        ["/", "Landing", "Nilai produk, cara kerja CHPS, login/daftar, dan akses Dasbor."],
        ["/dashboard", "Dasbor", "Ringkasan hari ini, tindakan berikutnya, Health Pulse, aktivitas, konsistensi, dan pintu utama Journey."],
        ["/health-pulse", "Health Pulse", "Ringkasan kebiasaan dan dimensi kesehatan; tidak menjadi diagnosis medis."],
        ["/scan", "Pindai Makanan", "Estimasi gizi, level kepercayaan, dan saran langkah kecil. Selalu 0 XP."],
        ["/aktivitas", "Aktivitas GPS", "Mulai/selesai aktivitas, status verifikasi, reward preview, dan jalur banding."],
        ["/challenge", "Challenge", "Misi harian/mingguan/bulanan/event dengan syarat trust yang jelas."],
        ["/journey", "Journey", "Timeline kebiasaan, detail catatan, dan jurnal kesehatan privat."],
        ["/companion", "Nora", "Percakapan/panduan kontekstual, brief, dan weekly letter."],
        ["/komunitas", "Komunitas & Peringkat", "Event, challenge komunitas, leaderboard, Moments, dan Studio Share."],
        ["/reward", "Hadiah", "Katalog reward dan simulasi penukaran HP."],
        ["/profil dan /pengaturan", "Identitas & Preferensi", "Profil, target, privasi, nama Nora, tampilan, lokasi, reminder, dan kontrol data."],
    ]
    story.append(data_table(["Route", "Halaman", "Fungsi"], route_rows, [3.0 * cm, 3.4 * cm, 9.1 * cm]))

    # Health, journey, Nora
    story += section("9. Journey, Health Pulse, dan Nora", "Ketiga area ini membentuk siklus refleksi: lihat pola -> pahami konteks -> pilih tindakan berikutnya.")
    story.append(cards([
        ("Health Pulse", "Ringkasan perubahan kebiasaan seperti nutrisi, aktivitas, tidur, hidrasi, dan manajemen berat. Skor membantu refleksi, bukan diagnosis atau nilai diri."),
        ("Journey", "Timeline riwayat aktivitas, nutrisi, recovery, konsistensi, challenge, Health Pulse, refleksi, dan lifestyle. Mendukung visibility private/circle/public."),
        ("Jurnal privat", "Catatan bebas pengguna. Default private, tidak tampil di komunitas, tidak memberi XP/HP, dan Nora hanya boleh mengakses dengan izin eksplisit."),
        ("Nora", "Pendamping wellness dengan satu langkah relevan, quick chat yang dapat ditutup, reminder opt-in, dan bahasa suportif. Tidak mendiagnosis, memberi obat, atau memverifikasi aktivitas."),
    ]))
    story.append(Spacer(1, 0.15 * cm))
    story.append(para("Pengingat jeda: pengguna dapat mengaktifkan reminder setiap sekitar satu jam untuk berdiri, peregangan singkat, atau minum. Reminder harus dapat ditutup/ditunda, nonaktif secara default, dan tidak boleh mengklaim mendeteksi posisi duduk tanpa sensor yang sesuai."))
    story.append(para("Nora menggunakan ringkasan agregat, bukan raw GPS, log makanan mentah, auth ID, atau data privat. Pada MVP, Nora masih berbasis dataset deterministik/simulasi dan bukan live AI API."))
    story.append(PageBreak())

    # Community
    story += section("10. Komunitas, event, leaderboard, Moments, dan Studio Share", "Komunitas dan peringkat digabung dalam satu ruang agar pengguna dapat mengikuti event, memberi dukungan, serta melihat kompetisi sehat tanpa harus berpindah halaman berulang.")
    story.append(para("Event komunitas menggunakan carousel horizontal yang benar: event berpindah halus secara otomatis, dapat dikendalikan tombol kiri/kanan dan titik indikator pada desktop, mendukung swipe/drag di mobile, berhenti ketika hover/fokus/drag, serta menghormati reduced motion."))
    story.append(cards([
        ("Leaderboard", "Scope Liga, Teman, dan Lokal. Pengguna dikelompokkan tier/level/musim sehingga pemula tetap memiliki peluang. Tampilkan XP bersama aktivitas verified dan konsistensi, bukan XP saja."),
        ("Healthy Circle", "Konten dukungan menggunakan istilah Beri Semangat dan Komentar Dukungan. Yang dibagikan hanya ringkasan aman, bukan rute, koordinat, catatan gizi mentah, atau skor kesehatan sensitif."),
        ("NutriVerse Moments", "Fitur sosial ala BeReal/Locket. Hanya kamera langsung; galeri dimatikan agar Moment real-time. Caption + privasi komunitas/teman/privat + laporan/hapus + viewer penuh + PNG watermark."),
        ("Pemisahan bukti", "Moment sosial dapat diberi label diambil saat aktivitas, tetapi tidak pernah menjadi bukti anti-cheat atau sumber XP. Aktivitas GPS verified tetap satu-satunya bukti kompetitif."),
    ]))
    story.append(Spacer(1, 0.18 * cm))
    story.append(para("Kamera Moments menjaga framing dari preview sampai dokumentasi: foto ditampilkan dengan mode fit/contain agar tidak di-crop atau tampak zoom. Di mobile, composer menjadi panel layar penuh dengan header tetap dan area form dapat digulir di dalam panel."))
    story += section("Studio Berbagi Progres", "Studio Share dibuat untuk promosi organik tanpa membocorkan data privat.")
    story += bullets([
        "Pilihan isi: Health Pulse, aktivitas, pencapaian, atau peringkat.",
        "Pilihan output: Story 9:16 dan Post 4:5; PNG siap unggah dengan foto/warna serta PNG transparan untuk overlay di foto pengguna.",
        "Komposisi poster editorial: foto/warna penuh, overlay gelap, logo resmi NutriVerse di kiri atas, angka/headline putih besar, dan tiga insight bawah: Health Pulse, Aktivitas, Hidrasi.",
        "Caption dapat diedit; Web Share mengutamakan file PNG ketika perangkat mendukung. Preview harus konsisten dengan renderer canvas final.",
        "Tidak boleh memasukkan rute presisi, koordinat, jurnal privat, catatan makanan mentah, atau detail kesehatan sensitif.",
    ])
    story.append(PageBreak())

    # Reward Profile
    story += section("11. Reward, profil, pengaturan, dan break reminder", "Area ini memberi pengguna kontrol atas identitas, preferensi, privasi, dan motivasi jangka panjang.")
    story.append(data_table(
        ["Area", "Yang pengguna lakukan", "Batas/aturan"],
        [
            ["Reward Store", "Melihat reward digital/mitra dan menukar HP.", "Saldo, stok, expiry, anti-inflasi, dan ledger wajib jelas. MVP redeem adalah simulasi lokal."],
            ["Profil", "Melihat identitas, Journey Day, tier, metrik ringkas, serta mengubah nama pendamping AI.", "Profil tidak mengekspos data privat secara default. Nama Nora hanya diedit di sini."],
            ["Pengaturan privasi", "Mengatur visibility profil/pulse/aktivitas, izin lokasi, dan data control.", "GPS hanya aktif ketika sesi; rute presisi tidak boleh publik."],
            ["Tema & preferensi", "Mengatur tampilan, Morning Brief, insight, safety checks, dan reminder.", "Kontrol harus persisten saat backend siap dan bisa dijelaskan dengan jelas."],
            ["Break reminder", "Opt-in untuk pengingat jeda/perenggangan.", "Tidak memberi XP/hukuman; dapat dismiss/snooze; tidak mengklaim sensor yang tidak ada."],
        ],
        [3.0 * cm, 6.1 * cm, 6.4 * cm],
    ))

    story += section("12. Portal admin /admin", "Portal admin adalah ruang operasional perusahaan, bukan halaman publik pengguna. Tema visual konsisten dengan NutriVerse tetapi fokus pada kontrol, moderasi, dan audit.")
    story.append(para("Akses /admin harus memakai autentikasi dan role khusus. User biasa yang membuka /admin harus ditolak atau diarahkan; admin hanya dapat mengubah hal yang sesuai dengan perannya."))
    story.append(cards([
        ("Admin dan role", "Daftar admin, role (misalnya Super Admin/Moderator/Analyst), audit aktivitas, dan pembatasan tindakan sesuai izin."),
        ("Moderasi", "Meninjau laporan pengguna, foto/caption Moment, konten komunitas, keputusan sembunyikan/pulihkan, serta alasan keputusan."),
        ("Operasional", "Mengelola event, challenge, reward, template share, stok reward, leaderboard season/scope, dan pengumuman."),
        ("Sistem", "Memantau pengguna aktif, aktivitas verified, anomali GPS, banding, XP/HP, content report, serta pengaturan global."),
    ]))
    story.append(note("Kewajiban audit", "Perubahan status verifikasi, grant/reversal XP/HP, reward, stok, event, template, dan moderasi harus menghasilkan audit log di backend produksi.", "amber"))
    story.append(PageBreak())

    # privacy
    story += section("13. Privasi, keamanan, dan moderasi", "Data lokasi dan kesehatan memerlukan perlindungan sejak desain, bukan hanya tambahan setelah produk jadi.")
    story += bullets([
        "GPS dimulai hanya setelah pengguna menekan Mulai dan berhenti saat aktivitas selesai/dibatalkan. Jangan melakukan background tracking terus-menerus di luar sesi.",
        "Rute mentah digunakan untuk verifikasi dalam jendela retensi yang ditetapkan. Ringkasan agregat dapat memiliki retensi berbeda; kebijakan final harus ditentukan sebelum produksi.",
        "Pengguna harus mengetahui izin, tujuan data, retensi, penghapusan, ekspor, dan pencabutan izin.",
        "Metadata EXIF/lokasi pada foto Moment perlu dihapus/normalisasi di jalur produksi. Moment memiliki pilihan privasi komunitas, teman, atau privat serta opsi hapus/lapor.",
        "Jurnal, refleksi, dan data makanan rinci adalah private by default. Jangan letakkan pada feed, leaderboard, template sosial, atau admin dashboard tanpa peran/izin yang tepat.",
        "Admin moderation membutuhkan reason code, status penanganan, audit log, dan mekanisme appeal bila keputusan berdampak besar.",
    ])
    story.append(note("Batas kesehatan", "NutriVerse menyediakan informasi kebiasaan sehat, bukan diagnosis, terapi, resep obat, atau pengganti tenaga kesehatan. Hindari bahasa diet shaming, rasa takut, dan kewajiban menebus makanan dengan olahraga.", "red"))

    # Design / responsiveness
    story += section("14. Desain, responsivitas, dan identitas brand", "Antarmuka harus selalu mobile-first dan dapat dibaca dari lebar 320 px sampai desktop tanpa horizontal overflow.")
    story.append(cards([
        ("Bahasa & tone", "Bahasa Indonesia merata, suportif, muda, jelas, dan tidak hiperbolis. Hindari istilah menghakimi; gunakan pilihan langkah kecil dan dorongan netral."),
        ("Layout", "Kartu ringkas, ruang putih cukup, hierarki sederhana, teks tidak terpotong, dan area sentuh nyaman. Hindari CTA Journey berulang di banyak halaman."),
        ("Mobile navigation", "Bottom navigation untuk tujuan utama; drawer untuk menu lengkap. Header/navigasi tidak boleh mengharuskan pengguna scroll ke paling atas."),
        ("Brand", "Warna utama emerald/teal dengan aksen lime. Ikon Lucide. Logo resmi aktif: /public/brand/nutriverse-app-icon-200.png; BrandLogo menggabungkan ikon dan wordmark responsif."),
    ]))
    story.append(Spacer(1, 0.16 * cm))
    story.append(para("Setiap fitur data harus memiliki empty state, CTA pertama, indikator sumber/status data, dan jalur tambah/ubah/hapus yang jelas. Status Demo, Simulated, Requires Server, dan Roadmap harus terlihat supaya pengguna tidak salah memahami kemampuan produk."))

    # Implementation
    story += section("15. Arsitektur teknis dan status implementasi", "Implementasi saat ini adalah frontend MVP yang telah merangkum desain dan interaksi inti, tetapi belum merupakan sistem produksi end-to-end.")
    story.append(data_table(
        ["Lapisan", "Teknologi/area", "Kondisi sekarang"],
        [
            ["Frontend", "Next.js, React, TypeScript, Tailwind CSS, Lucide.", "Aktif. Rute user, admin, visual design, state interaksi, canvas export, dan responsive UI tersedia."],
            ["Data frontend", "Dataset deterministik, state React, localStorage pada session/preference tertentu.", "Simulasi/prototipe. Tidak boleh diperlakukan sebagai database atau source of truth produksi."],
            ["Aktivitas", "GPS browser + kalkulasi/rute client-side demo.", "Hanya demonstrasi. Verifikasi, reward, anti-spoofing final harus server-side."],
            ["Auth", "Form login/daftar dan sesi lokal UI.", "Belum production-ready. Memerlukan OAuth, password handling aman, server session/JWT, RBAC, dan database."],
            ["Admin", "/admin, dashboard operasional, moderation, role UI, settings UI.", "Tampilan/prototipe. Enforcement role, audit persistence, dan authorization perlu backend."],
            ["Export", "Canvas PNG dan Web Share fallback.", "Aktif di browser. Penyimpanan/asset processing server belum menjadi source final."],
        ],
        [3.0 * cm, 6.0 * cm, 6.5 * cm],
    ))
    story.append(PageBreak())

    # backend contract
    story += section("16. Data, state, dan kontrak backend", "Backend perlu dibangun sebagai sistem tepercaya karena bagian kompetitif dan reward tidak boleh ditentukan oleh browser pengguna.")
    story.append(para("Entitas minimum produksi: User, AuthIdentity, Profile, CompanionPreference, ActivitySession, TelemetrySample, VerificationResult, Appeal, XPGrant, HPLedgerEntry, Challenge, ChallengeProgress, LeaderboardSeason, LeaderboardScope, Reward, RewardInventory, Redemption, JourneyEntry, JournalEntry, NutritionEntry, Moment, ContentReport, Event, AdminUser, AdminRole, dan AuditLog."))
    story.append(data_table(
        ["Peristiwa", "Pemilik keputusan", "Output wajib"],
        [
            ["Aktivitas selesai", "Server verification engine", "Verification status + reason codes + trusted distance/duration + eligible reward."],
            ["Aktivitas verified", "Reward/ledger service", "XP/HP grant idempotent, cap/diminishing calculation, challenge update, audit event."],
            ["Challenge selesai", "Challenge service", "Cek eligibility activity verified, beri bonus satu kali jika memenuhi, update progress."],
            ["Reward ditukar", "Redemption/inventory service", "Atomic HP debit, stock check, redemption record, fulfillment status, audit event."],
            ["Moment dipublikasi", "Content/media service", "EXIF removal, privacy enforcement, moderation state, report/delete path."],
            ["Admin bertindak", "RBAC + audit service", "Role enforcement, actor, timestamp, before/after, reason, and review trail."],
        ],
        [3.4 * cm, 5.1 * cm, 7.0 * cm],
    ))
    story.append(Spacer(1, 0.18 * cm))
    story.append(note("Idempotensi", "Grant XP/HP, penyelesaian challenge, dan penukaran reward wajib idempotent. Pemanggilan ulang endpoint atau retry jaringan tidak boleh menggandakan saldo/reward.", "amber"))

    # success + QA
    story += section("17. Metrik keberhasilan, QA, dan roadmap", "North Star Metric bukan total XP. Ukur keberhasilan dari kebiasaan yang lebih konsisten dan aman.")
    story.append(cards([
        ("North-star candidates", "Hari aktif tervalidasi per minggu, retensi minggu ke-4, dan peningkatan konsistensi dari baseline pengguna."),
        ("Trust metrics", "Persentase aktivitas verified, false positive/negative, waktu penyelesaian banding, aktivitas anomali, dan kepatuhan cap XP."),
        ("Wellbeing metrics", "Proporsi pengguna aktif tanpa melewati batas aman, penggunaan recovery/reminder secara sukarela, serta tidak adanya pola diet shaming."),
        ("Community metrics", "Partisipasi event, dukungan sosial sehat, kualitas moderasi, penggunaan Moment tanpa pelanggaran privasi, dan share PNG organik."),
    ]))
    story.append(Spacer(1, 0.15 * cm))
    story.append(para("Checklist QA utama: test 320 px/mobile/desktop; tidak ada overflow horizontal; GPS permission/start/stop; status pending/verified/review; tidak ada reward dari scan/jurnal/Moment; cap XP/diminishing; privacy visibility; event & Moment carousel swipe; composer kamera mobile; viewer foto penuh; PNG export; login/register; user biasa ditolak dari admin; moderator role; audit log; empty/error state; dan reduced motion."))
    story += section("Roadmap prioritas", None)
    story += bullets([
        "Tahap 1 - Stabilkan frontend: responsive audit, accessibility, empty/error states, copy Indonesia, dan demo labels.",
        "Tahap 2 - Fondasi backend: auth/OAuth, database, profile, privacy/RBAC, session, media storage, dan audit log.",
        "Tahap 3 - Trust engine: server telemetry ingestion, anti-cheat multi-sinyal, verification queue, appeal, XP/HP ledger, idempotency.",
        "Tahap 4 - Operasional: admin real, moderation, event/reward inventory, leaderboard season, analytics, policy retensi.",
        "Tahap 5 - Ekspansi adil: wearable/indoor/adaptive sports trust model dan partner fulfillment setelah rule/economy matang.",
    ])
    story.append(PageBreak())

    # AI prompt
    story += section("18. Prompt konteks siap salin untuk AI", "Gunakan prompt ini di awal percakapan dengan AI lain. Setelah itu, tambahkan task spesifik yang ingin dikerjakan.")
    prompt = """Anda membantu mengembangkan NutriVerse, aplikasi web kesehatan bergaya game kompetitif untuk Gen Z Indonesia. Inti produk adalah CHPS (Competitive Health Progression System): aktivitas fisik nyata berbasis GPS yang tervalidasi menghasilkan XP, menaikkan tier dari Sprout hingga Legend, dan memengaruhi leaderboard yang suportif. XP kompetitif hanya boleh berasal dari aktivitas nyata berstatus verified. Challenge harian/mingguan/bulanan/event boleh memberi bonus XP satu kali hanya jika target dipenuhi oleh aktivitas GPS verified yang relevan. Scan makanan, jurnal, refleksi, self-report, chat Nora, foto, dan NutriVerse Moments selalu 0 XP dan 0 HP. XP adalah progres peringkat yang hanya naik; HP adalah mata uang reward yang dibelanjakan.

Gunakan anti-cheat multi-sinyal: pace/kecepatan, lonjakan koordinat, timestamp/duplikasi, gap telemetry, akurasi GPS, pola kendaraan, durasi ekstrem, GPS palsu/replay, dan anomali lintas sesi. Status aktivitas: pending, verified, needs-review, not-verified, manual-review. Jangan menyebut pengguna curang hanya dari satu sinyal; sediakan alasan netral dan banding. Pemberian XP/HP, anti-spoofing, challenge reward, dan ledger harus server-side serta idempotent. Terapkan cap XP harian, diminishing return, dan streak protection tanpa memberi XP saat istirahat.

Produk memiliki Dashboard, Health Pulse, Scan Makanan, Aktivitas GPS, Challenge, Journey + jurnal privat, Nora Companion, Komunitas & Peringkat, Reward Store, Profil/Pengaturan, serta portal admin /admin. Nora adalah pendamping wellness yang suportif, bukan dokter, verifikator, atau pemberi reward. Komunitas menggunakan Liga/Teman/Lokal dan tidak boleh menampilkan rute/koordinat presisi. NutriVerse Moments adalah foto sosial real-time ala BeReal/Locket dengan kamera langsung saja, caption/privacy/report/delete/viewer/PNG watermark, tetapi bukan bukti anti-cheat dan tidak memberi XP. Studio Share mengekspor template poster aman tanpa data sensitif.

Seluruh UI berbahasa Indonesia, mobile-first, responsif minimal 320 px sampai desktop, dan bernada suportif tanpa diet shaming/dark pattern. Bedakan fitur Active UI, Simulated, Requires Server, dan Roadmap. Saat ini frontend memakai Next.js + React + TypeScript + Tailwind; auth, database, verification production, ledger, moderation persistence, AI API, dan fulfillment belum siap produksi. Jangan mengubah aturan inti tanpa persetujuan eksplisit tim produk."""
    code_table = Table([[Paragraph(escape(prompt).replace("\n", "<br/>"), styles["NVCode"])]], colWidths=[PAGE_W - 2 * MARGIN_X])
    code_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE_2), ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(code_table)
    story.append(PageBreak())

    # Glossary
    story += section("19. Glosarium", "Istilah inti yang harus dipakai secara konsisten.")
    glossary = [
        ["CHPS", "Competitive Health Progression System - sistem progres kompetitif NutriVerse."],
        ["XP", "Experience/Progress Points untuk tier dan peringkat; hanya dari aktivitas verified dan bonus challenge verified."],
        ["HP", "Health Points - saldo untuk Reward Store, bukan peringkat."],
        ["Health Pulse", "Ringkasan kebiasaan/indikator wellness untuk refleksi, bukan diagnosis medis."],
        ["Verified activity", "Aktivitas dengan telemetry yang lolos evaluasi trust engine."],
        ["Potential reward", "Preview reward sebelum verifikasi final. Bukan saldo yang sudah diberikan."],
        ["Streak protection", "Perlindungan konsistensi pada waktu istirahat sehat tanpa memberikan XP."],
        ["NutriVerse Moments", "Konten foto sosial kamera langsung yang tidak memengaruhi XP atau anti-cheat."],
        ["Journey", "Riwayat kebiasaan dan refleksi pengguna dengan visibility private/circle/public."],
        ["Nora", "Pendamping wellness kontekstual, tidak mendiagnosis atau memberikan reward."],
        ["Simulated", "Data/interaksi demo yang tidak berasal dari sistem produksi tepercaya."],
        ["Requires Server", "Fungsi yang tampil di UI tetapi memerlukan backend sebelum dapat dipercaya di produksi."],
    ]
    story.append(data_table(["Istilah", "Makna"], glossary, [4.5 * cm, 11.0 * cm]))
    story.append(Spacer(1, 0.35 * cm))
    story.append(note("Penutup", "NutriVerse harus memenangkan kepercayaan pengguna sebelum mengejar metrik kompetisi. Jika sebuah fitur memperindah tampilan tetapi memperlemah fairness, privasi, keselamatan, atau kejelasan status data, revisi fitur tersebut.", "green"))

    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
