import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      return NextResponse.json({ error: "Konfigurasi n8n tidak ditemukan" }, { status: 500 });
    }

    // Mengirim pesan ke n8n Webhook
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`n8n merespons dengan status: ${response.status}`);
    }

    // Mengambil balasan dari n8n
    const data = await response.json();
    
    // Sesuaikan 'data.reply' dengan format JSON yang dikembalikan oleh node 'Respond to Webhook' di n8n
    return NextResponse.json({ reply: data.reply || data.output || data.text || "AI merespons, namun format tidak dikenali." });
  } catch (error) {
    console.error("Error memanggil n8n:", error);
    return NextResponse.json({ error: "Gagal terhubung ke AI Agent" }, { status: 500 });
  }
}
