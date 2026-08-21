from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT = OUT_DIR / "NutriVerse_APICTA_2026_Rencana_Kesiapan_dan_RAB.pdf"
LOGO = ROOT / "public" / "brand" / "nutriverse-app-icon-200.png"

PAGE_W, PAGE_H = A4
EMERALD = colors.HexColor("#087F5B")
EMERALD_DARK = colors.HexColor("#075C43")
MINT = colors.HexColor("#E7F7F0")
INK = colors.HexColor("#16312A")
MUTED = colors.HexColor("#5D716A")
LINE = colors.HexColor("#D8E6E0")
PALE = colors.HexColor("#F7FBF9")
GOLD = colors.HexColor("#CC8B16")


def rupiah(value: int) -> str:
    return "Rp" + f"{value:,}".replace(",", ".")


def p(text: str, style: ParagraphStyle):
    return Paragraph(text, style)


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_footer(pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw_footer(self, page_count):
        if self._pageNumber == 1:
            return
        self.saveState()
        self.setStrokeColor(LINE)
        self.setLineWidth(0.5)
        self.line(1.65 * cm, 1.35 * cm, PAGE_W - 1.65 * cm, 1.35 * cm)
        self.setFillColor(MUTED)
        self.setFont("Helvetica", 8)
        self.drawString(1.65 * cm, 0.85 * cm, "NutriVerse | Rencana kesiapan APICTA 2026")
        label = f"{self._pageNumber} / {page_count}"
        self.drawRightString(PAGE_W - 1.65 * cm, 0.85 * cm, label)
        self.restoreState()


def build_pdf():
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=30,
        leading=35,
        textColor=INK,
        alignment=TA_LEFT,
        spaceAfter=10,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=13,
        leading=19,
        textColor=MUTED,
    )
    section = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=EMERALD_DARK,
        spaceBefore=8,
        spaceAfter=8,
    )
    subsection = ParagraphStyle(
        "Subsection",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        textColor=INK,
        spaceBefore=7,
        spaceAfter=4,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=INK,
        spaceAfter=6,
    )
    small = ParagraphStyle(
        "Small",
        parent=body,
        fontSize=8.2,
        leading=11.3,
        textColor=MUTED,
    )
    table_header = ParagraphStyle(
        "TableHeader",
        parent=small,
        fontName="Helvetica-Bold",
        textColor=colors.white,
    )
    quote = ParagraphStyle(
        "Quote",
        parent=body,
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=16,
        textColor=EMERALD_DARK,
        leftIndent=10,
        rightIndent=10,
        alignment=TA_CENTER,
    )
    card_title = ParagraphStyle(
        "CardTitle",
        parent=body,
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=EMERALD_DARK,
        spaceAfter=2,
    )
    cover_kicker = ParagraphStyle(
        "CoverKicker",
        parent=body,
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=EMERALD,
        leading=13,
    )

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=1.65 * cm,
        leftMargin=1.65 * cm,
        topMargin=1.55 * cm,
        bottomMargin=1.8 * cm,
        title="NutriVerse - Rencana Kesiapan APICTA 2026 dan RAB",
        author="Tim NutriVerse",
    )
    story = []

    # Cover
    story.append(Spacer(1, 1.25 * cm))
    if LOGO.exists():
        story.append(Image(str(LOGO), width=1.35 * cm, height=1.35 * cm))
        story.append(Spacer(1, 0.35 * cm))
    story.append(p("NUTRIVERSE", cover_kicker))
    story.append(Spacer(1, 0.18 * cm))
    story.append(p("Rencana Kesiapan APICTA 2026", title))
    story.append(p("Strategi kompetisi dan RAB inti untuk pengembangan produk tahap awal", subtitle))
    story.append(Spacer(1, 1.0 * cm))

    cover_box = Table(
        [[p("<b>Tujuan dokumen</b><br/>Menjadi dasar koordinasi internal Tim NutriVerse dan pengajuan dukungan ABP Universitas AMIKOM Yogyakarta.", body)]],
        colWidths=[15.7 * cm],
    )
    cover_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), MINT),
        ("BOX", (0, 0), (-1, -1), 0.7, EMERALD),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 13),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
    ]))
    story.append(cover_box)
    story.append(Spacer(1, 1.0 * cm))

    cover_metrics = Table(
        [[
            p("<b>Prestasi awal</b><br/>Juara AMICTA 2026<br/><font color='#5D716A'>Kategori Aplikasi Sistem Informasi</font>", body),
            p("<b>Target berikutnya</b><br/>Kesiapan seleksi dan APICTA 2026<br/><font color='#5D716A'>Jakarta, Desember 2026</font>", body),
            p("<b>Anggaran inti</b><br/><font size='16'><b>Rp2.500.000</b></font><br/><font color='#5D716A'>Fokus kompetisi, bukan scale-up</font>", body),
        ]],
        colWidths=[5.2 * cm, 5.2 * cm, 5.3 * cm],
    )
    cover_metrics.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
    ]))
    story.append(cover_metrics)
    story.append(Spacer(1, 4.4 * cm))
    story.append(p("Disusun untuk kebutuhan koordinasi Tim NutriVerse dan presentasi kepada ABP Universitas AMIKOM Yogyakarta", small))
    story.append(PageBreak())

    # Page 2: context & strategic direction
    story.append(p("1. Ringkasan keputusan", section))
    story.append(p(
        "NutriVerse tidak perlu diperlakukan sebagai startup yang harus langsung siap melayani pengguna dalam skala besar. "
        "Untuk kebutuhan APICTA, prioritasnya adalah demonstrasi produk yang stabil, alur cerita yang jelas, bukti manfaat awal, dan kesiapan tim menjawab pertanyaan juri.", body))

    decision_data = [[
        p("<b>Tetap dipakai</b><br/>Next.js, Prisma, Supabase, MapLibre, dan workflow n8n yang telah dibuat.", body),
        p("<b>Tidak perlu sekarang</b><br/>Migrasi database, n8n Cloud berbayar, peta premium, aplikasi native, dan microservice.", body),
        p("<b>Target kompetisi</b><br/>Demo andal, 15-20 tester, video cadangan, dan materi Bahasa Inggris sederhana.", body),
    ]]
    decision_table = Table(decision_data, colWidths=[5.2 * cm, 5.2 * cm, 5.3 * cm])
    decision_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), MINT),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#FFF7E7")),
        ("BACKGROUND", (2, 0), (2, 0), PALE),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(decision_table)
    story.append(Spacer(1, 0.4 * cm))

    story.append(p("Dasar kompetisi", subsection))
    story.append(p(
        "APICTA 2026 menyediakan kategori Tertiary Student Project untuk proyek mahasiswa S1. Halaman pendaftaran APICTA Indonesia menyatakan bahwa produk yang masih dalam tahap pengembangan atau pilot tetap dapat diajukan apabila inovasi, implementasi, manfaat, dan demonstrasinya dapat dipresentasikan. "
        "Penilaian mencakup inovasi, keunggulan teknologi, dampak, potensi keberlanjutan, kualitas implementasi, serta presentasi dan demonstrasi.", body))
    story.append(p(
        "Kemenangan AMICTA 2026 kategori Aplikasi Sistem Informasi merupakan bukti validasi awal NutriVerse. Untuk APICTA, prestasi ini diposisikan sebagai landasan, sementara materi final harus menonjolkan masalah yang diselesaikan, cara kerja solusi, keamanan data, dampak awal, dan arah pengembangan.", body))

    story.append(p("Narasi inti yang disarankan", subsection))
    narrative = Table(
        [[p("NutriVerse membantu Gen Z membangun kebiasaan sehat secara suportif melalui pencatatan nutrisi, aktivitas GPS tervalidasi, progres bergaya game, dan AI Companion. AI tidak mengambil alih keputusan kompetitif atau medis; semua XP, HP, dan validasi aktivitas tetap dikendalikan oleh backend.", quote)]],
        colWidths=[15.7 * cm],
    )
    narrative.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EFFAF5")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, EMERALD),
        ("LEFTPADDING", (0, 0), (-1, -1), 15),
        ("RIGHTPADDING", (0, 0), (-1, -1), 15),
        ("TOPPADDING", (0, 0), (-1, -1), 13),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 13),
    ]))
    story.append(narrative)
    story.append(PageBreak())

    # Page 3: technical architecture
    story.append(p("2. Arsitektur inti untuk demo kompetisi", section))
    story.append(p(
        "Arsitektur berikut menjaga teknologi yang sudah digunakan. Tujuannya adalah mengurangi risiko perubahan menjelang lomba, bukan mengejar tool baru.", body))

    arch_rows = [
        [p("Lapisan", table_header), p("Tool", table_header), p("Peran pada demo", table_header)],
        [p("Akses publik", body), p("Domain + Cloudflare Free", body), p("URL profesional, HTTPS, cache aset statis, dan perlindungan dasar.", body)],
        [p("Aplikasi", body), p("Rumahweb VPS L + Next.js", body), p("Menjalankan dashboard, API, autentikasi server, dan logika aplikasi.", body)],
        [p("Workflow AI", body), p("n8n Community Edition", body), p("Meneruskan permintaan Nora dan scanner ke model AI tanpa mengubah logika XP/HP.", body)],
        [p("Data", body), p("Supabase", body), p("PostgreSQL, Auth, dan Storage foto. Pro hanya diaktifkan menjelang demo/final bila dibutuhkan.", body)],
        [p("Model AI", body), p("OpenAI API", body), p("Respons Nora dan analisis terkontrol dengan limit penggunaan serta fallback aman.", body)],
    ]
    arch = Table(arch_rows, colWidths=[3.2 * cm, 4.1 * cm, 8.4 * cm], repeatRows=1)
    arch.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), EMERALD_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(arch)
    story.append(Spacer(1, 0.35 * cm))

    story.append(p("Batas keamanan yang wajib dijaga", subsection))
    safety_rows = [
        [p("Komponen", card_title), p("Aturan", card_title)],
        [p("n8n", body), p("Tidak punya akses untuk memberi XP/HP, memverifikasi GPS, atau mengubah reward. n8n hanya mengolah workflow AI.", body)],
        [p("OpenAI", body), p("API key hanya berada di credential n8n atau environment server. Tidak pernah di browser.", body)],
        [p("GPS dan kesehatan", body), p("Tidak menampilkan koordinat presisi pada leaderboard, komunitas, atau materi presentasi.", body)],
        [p("Demo", body), p("Siapkan akun demo, data simulasi, dan video cadangan agar presentasi tidak bergantung pada jaringan.", body)],
    ]
    safety = Table(safety_rows, colWidths=[4.1 * cm, 11.6 * cm], repeatRows=1)
    safety.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#FFF7E7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(safety)
    story.append(Spacer(1, 0.3 * cm))
    story.append(p("Catatan implementasi: n8n tetap dapat dipakai tanpa memigrasikan aplikasi. Konfigurasi cukup mengarahkan N8N_WEBHOOK_URL dan N8N_SCAN_WEBHOOK_URL ke n8n yang berjalan pada VPS. Jalur aplikasi, Supabase, dan struktur frontend tidak perlu diganti.", small))
    story.append(PageBreak())

    # Page 4: budget
    story.append(p("3. Rencana anggaran biaya inti", section))
    story.append(p(
        "RAB ini hanya mencakup kesiapan lomba sampai Desember 2026. Anggaran tidak ditujukan untuk ekspansi bisnis atau layanan publik berskala besar. Asumsi waktu: empat bulan operasional hingga final APICTA.", body))

    budget = [
        [p("No.", table_header), p("Komponen", table_header), p("Dasar perhitungan", table_header), p("Biaya", table_header)],
        [p("1", body), p("Domain .com", body), p("1 tahun untuk URL demo profesional", body), p(rupiah(300000), body)],
        [p("2", body), p("Rumahweb VPS L", body), p("Rp245.000 x 4 bulan", body), p(rupiah(980000), body)],
        [p("3", body), p("n8n Community Edition", body), p("Self-hosted di VPS; lisensi Rp0", body), p(rupiah(0), body)],
        [p("4", body), p("Supabase Pro", body), p("1 bulan menjelang demo/final", body), p(rupiah(450000), body)],
        [p("5", body), p("Kredit OpenAI API", body), p("Nora dan scanner dengan spending cap", body), p(rupiah(200000), body)],
        [p("6", body), p("Uji GPS dan kuota data", body), p("15-20 tester dan pengujian perangkat", body), p(rupiah(250000), body)],
        [p("7", body), p("Cadangan teknis", body), p("Kurs, kegagalan layanan, atau kebutuhan kecil", body), p(rupiah(320000), body)],
        [p("", body), p("<b>Total pengajuan</b>", body), p("<b>Fokus kesiapan kompetisi</b>", body), p("<b>" + rupiah(2500000) + "</b>", body)],
    ]
    budget_table = Table(budget, colWidths=[1.0 * cm, 4.1 * cm, 7.2 * cm, 3.4 * cm], repeatRows=1)
    budget_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), EMERALD_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -2), 0.45, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, PALE]),
        ("BACKGROUND", (0, -1), (-1, -1), MINT),
        ("LINEABOVE", (0, -1), (-1, -1), 1.2, EMERALD),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (-1, 1), (-1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(budget_table)
    story.append(Spacer(1, 0.4 * cm))

    story.append(p("Pengeluaran yang ditunda", subsection))
    deferred = Table(
        [[
            p("<b>Ditunda sampai ada kebutuhan nyata</b><br/>n8n Cloud Starter, database baru, peta berbayar, email berbayar, Redis, microservice, aplikasi mobile native, wearable, iklan, reward, dan infrastruktur multi-server.", body),
            p("<b>Alasannya</b><br/>Tidak menambah nilai utama penilaian pada tahap kompetisi, sementara meningkatkan biaya dan risiko konfigurasi.", body),
        ]],
        colWidths=[9.2 * cm, 6.5 * cm],
    )
    deferred.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#FFF7E7")),
        ("BACKGROUND", (1, 0), (1, 0), PALE),
        ("BOX", (0, 0), (-1, -1), 0.45, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(deferred)
    story.append(PageBreak())

    # Page 5: execution plan / checklist
    story.append(p("4. Tahapan kerja sampai kompetisi", section))
    story.append(p("Kunci keberhasilan tim adalah membatasi pekerjaan ke hal yang dapat dibuktikan pada demo. Setiap tahap memiliki keluaran yang jelas.", body))

    phases = [
        [p("Fase", table_header), p("Target utama", table_header), p("Keluaran yang harus ada", table_header)],
        [p("1. Stabilkan produk", body), p("Agustus", body), p("Deploy VPS, domain, HTTPS, akun demo, dan semua alur inti dapat dibuka tanpa error.", body)],
        [p("2. Uji terbatas", body), p("September", body), p("15-20 tester mencoba onboarding, scan, aktivitas, dan Nora; temuan dicatat dan diperbaiki.", body)],
        [p("3. Bukti dan narasi", body), p("Oktober", body), p("Ringkasan hasil uji, arsitektur, kebijakan privasi singkat, deck Bahasa Indonesia dan Inggris.", body)],
        [p("4. Simulasi penjurian", body), p("November", body), p("Demo 5-7 menit, video cadangan 2-3 menit, daftar pertanyaan juri, dan latihan peran tim.", body)],
        [p("5. Final readiness", body), p("Desember", body), p("Supabase Pro aktif, backup data, test perangkat, materi offline, dan checklist demo selesai.", body)],
    ]
    phases_table = Table(phases, colWidths=[4.0 * cm, 2.4 * cm, 9.3 * cm], repeatRows=1)
    phases_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), EMERALD_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(phases_table)
    story.append(Spacer(1, 0.35 * cm))

    story.append(p("Checklist final presentasi", subsection))
    checklist_items = [
        "Akun demo dan data demonstrasi siap, tanpa memakai data pribadi tester.",
        "URL demo, Nginx, n8n, Supabase, dan AI diuji sehari sebelum presentasi.",
        "Video demo 2-3 menit tersimpan offline di laptop dan drive tim.",
        "Pitch menjelaskan masalah, solusi, cara kerja, bukti awal, keamanan data, dan roadmap.",
        "Setiap anggota mengetahui perannya: pembuka, demonstrator, penjawab teknis, dan penutup.",
        "Tim siap menerangkan batasan produk secara jujur: AI bukan diagnosis medis dan GPS tidak menjadi bukti tunggal tanpa validasi server.",
    ]
    checklist = [[p("<font color='#087F5B'>[ ]</font> " + item, body)] for item in checklist_items]
    checklist_table = Table(checklist, colWidths=[15.7 * cm])
    checklist_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(checklist_table)
    story.append(Spacer(1, 0.3 * cm))
    story.append(p("Keputusan yang perlu disepakati tim sekarang", subsection))
    story.append(p(
        "1) menyetujui RAB inti Rp2.500.000; 2) memilih satu anggota penanggung jawab deployment VPS dan n8n; 3) menetapkan 15-20 tester; 4) membagi peran presentasi; dan 5) mengonfirmasi jalur nominasi APICTA kepada ABP atau panitia resmi.", body))
    story.append(PageBreak())

    # Sources
    story.append(p("5. Sumber dan catatan", section))
    story.append(p("Dokumen ini memakai sumber resmi berikut. Harga dan ketentuan dapat berubah, sehingga konfirmasi ulang sebelum pembayaran diperlukan.", body))
    sources = [
        ("APICTA Indonesia - Pendaftaran APICTA Awards 2026", "https://apicta.id/register/"),
        ("APICTA Indonesia - FAQ APICTA Awards 2026", "https://apicta.id/faq/"),
        ("AMICTA Universitas AMIKOM - Kategori Product-Based", "https://amicta.amikom.ac.id/product-based/"),
        ("Rumahweb - VPS", "https://www.rumahweb.com/vps-murah/"),
        ("Supabase - Pricing", "https://supabase.com/pricing"),
        ("n8n - Pricing dan Community Edition", "https://n8n.io/pricing/"),
        ("OpenAI - GPT-5 mini", "https://developers.openai.com/api/docs/models/gpt-5-mini"),
    ]
    source_rows = [[p(f"<b>{i}.</b> {name}<br/><font color='#087F5B'>{url}</font>", body)] for i, (name, url) in enumerate(sources, 1)]
    source_table = Table(source_rows, colWidths=[15.7 * cm])
    source_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(source_table)
    story.append(Spacer(1, 0.6 * cm))
    story.append(p("Dokumen kerja internal - Tim NutriVerse", card_title))
    story.append(p("Versi 1.0 | Disusun 11 Agustus 2026 | Untuk dibagikan melalui grup WhatsApp dan dibawa dalam diskusi dengan ABP Universitas AMIKOM Yogyakarta.", small))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
