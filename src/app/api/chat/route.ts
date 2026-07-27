import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { message, sessionId, companionName, userContext, progress } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    // Save User message to database
    await prisma.companionConversation.create({
      data: {
        userId: user.id,
        sender: "USER",
        content: message,
      },
    });

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      return NextResponse.json({ error: "Konfigurasi n8n tidak ditemukan" }, { status: 500 });
    }

    // Mengirim pesan ke n8n Webhook beserta sessionId, companionName, dan userContext (profil user)
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, sessionId, companionName, userContext, progress }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n Error ${response.status}: ${errorText}`);
    }

    // Mengambil balasan dari n8n
    const textResponse = await response.text();
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      // Jika n8n membalas dengan teks biasa (bukan JSON)
      console.log("Response dari n8n bukan JSON:", textResponse);
      const reply = textResponse || "AI merespons tanpa teks.";
      await prisma.companionConversation.create({
        data: { userId: user.id, sender: "ASSISTANT", content: reply },
      });
      return NextResponse.json({ reply });
    }
    
    // Sesuaikan 'data.reply' dengan format JSON yang dikembalikan oleh node 'Respond to Webhook' di n8n
    console.log("DATA DARI N8N:", data);
    
    // Jika n8n mengembalikan array (default dari Webhook node tanpa Respond to Webhook)
    if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }
    
    const finalReply = data.reply || data.output || data.text || "AI merespons, namun format tidak dikenali.";
    
    // Save AI reply to database
    await prisma.companionConversation.create({
      data: {
        userId: user.id,
        sender: "ASSISTANT",
        content: finalReply,
      },
    });

    return NextResponse.json({ reply: finalReply });
  } catch (error) {
    console.error("Error memanggil n8n:", error);
    const errorMessage = error instanceof Error ? error.message : "Gagal terhubung ke AI Agent";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
