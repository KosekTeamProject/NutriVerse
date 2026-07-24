import { CompanionSender } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
  stringValue,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildProgressOverview } from "@/server/progress/progress-service";

function companionReply(
  question: string,
  overview: Awaited<ReturnType<typeof buildProgressOverview>>,
) {
  const normalized = question.toLowerCase();
  if (
    [
      "diagnosa",
      "diagnose",
      "sakit",
      "obat",
      "suplemen",
      "terapi",
      "dokter",
      "prescription",
    ].some((keyword) => normalized.includes(keyword))
  ) {
    return "Aku dapat membantu membaca kebiasaan yang tercatat, tetapi tidak dapat mendiagnosis kondisi medis atau menggantikan tenaga kesehatan profesional.";
  }
  if (
    normalized.includes("pulse") ||
    normalized.includes("kesehatan") ||
    normalized.includes("mengapa")
  ) {
    const pulse = overview.healthPulse.current;
    const score = (dimension: string) =>
      pulse.dimensions.find((item) => item.dimension === dimension)?.score ?? 0;
    return `Health Pulse-mu saat ini ${pulse.score.toFixed(1)}. Komponennya berasal dari nutrisi ${score("nutrition")}%, aktivitas ${score("activity")}%, tidur ${score("sleep")}%, hidrasi ${score("hydration")}%, dan berat ${score("weight")}%.`;
  }
  if (
    normalized.includes("jalan") ||
    normalized.includes("aktivitas") ||
    normalized.includes("target")
  ) {
    const distance = overview.daily.walkingDistance;
    return `Jarak jalan terverifikasi hari ini ${distance.value.toFixed(2)} ${distance.unit} dari target ${distance.target.toFixed(2)} ${distance.unit}. Progres database-mu ${distance.percent}%.`;
  }
  if (
    normalized.includes("protein") ||
    normalized.includes("gizi") ||
    normalized.includes("nutrisi") ||
    normalized.includes("makanan")
  ) {
    const protein = overview.daily.protein;
    const calories = overview.daily.calories;
    return `Catatan hari ini menunjukkan protein ${protein.value.toFixed(0)} dari ${protein.target.toFixed(0)} ${protein.unit}, serta energi ${calories.value.toFixed(0)} dari ${calories.target.toFixed(0)} ${calories.unit}. Angka ini dihitung dari riwayat makanan di database.`;
  }
  if (
    normalized.includes("air") ||
    normalized.includes("hidrasi") ||
    normalized.includes("minum")
  ) {
    const water = overview.daily.water;
    return `Hidrasi hari ini tercatat ${water.value.toFixed(0)} dari ${water.target.toFixed(0)} ${water.unit}, atau ${water.percent}% target.`;
  }
  if (
    normalized.includes("challenge") ||
    normalized.includes("tantangan")
  ) {
    const challenge = overview.challenges[0];
    return challenge
      ? `Tantangan "${challenge.title}" sudah ${challenge.progressPercent}% (${challenge.currentValue.toFixed(1)} dari ${challenge.targetValue.toFixed(1)} ${challenge.unit}).`
      : "Belum ada tantangan aktif pada akunmu di database.";
  }
  return `Dari data hari ini, progres perjalananmu ${overview.todayJourney.progressPercent}%, streak ${overview.economy.streakDays} hari, dan Health Pulse ${overview.healthPulse.current.score.toFixed(1)}. Pilih satu langkah kecil yang nyaman untuk dilanjutkan.`;
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const newest = await prisma.companionConversation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
    return NextResponse.json({
      success: true,
      messages: newest.reverse(),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "companion:message", 30, 60_000);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const content = stringValue(body?.content, "Pesan", {
      min: 1,
      max: 2_000,
    });
    const overview = await buildProgressOverview(user.id);
    const reply = companionReply(content, overview);
    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.companionConversation.create({
        data: {
          userId: user.id,
          sender: CompanionSender.USER,
          content,
        },
      }),
      prisma.companionConversation.create({
        data: {
          userId: user.id,
          sender: CompanionSender.ASSISTANT,
          content: reply,
          emotionContext: "DATABASE_PROGRESS",
        },
      }),
    ]);
    return NextResponse.json(
      { success: true, messages: [userMessage, assistantMessage] },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
