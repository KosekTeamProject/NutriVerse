import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { finalizeEventRewards } from "@/server/events/event-reward-service";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const admin = await requireAdminUser();
    const { eventId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const winnerUserIds = [
      body?.firstPlaceUserId,
      body?.secondPlaceUserId,
      body?.thirdPlaceUserId,
    ];
    if (winnerUserIds.some((value) => typeof value !== "string" || !value)) {
      return NextResponse.json(
        { success: false, error: "Pilih juara 1, 2, dan 3 dari peserta yang hadir." },
        { status: 400 },
      );
    }
    const result = await finalizeEventRewards({
      eventId,
      adminUserId: admin.id,
      winnerUserIds: winnerUserIds as [string, string, string],
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error) {
      const messages: Record<string, string> = {
        EVENT_NOT_FOUND: "Event tidak ditemukan.",
        EVENT_NOT_FINISHED: "Event hanya dapat difinalisasi setelah selesai.",
        EVENT_NEEDS_THREE_ATTENDEES: "Minimal tiga peserta harus ditandai hadir.",
        EVENT_WINNERS_NOT_UNIQUE: "Juara 1, 2, dan 3 harus pengguna yang berbeda.",
        EVENT_WINNER_NOT_ATTENDED: "Pemenang harus berasal dari peserta yang ditandai hadir.",
      };
      if (messages[error.message]) return apiErrorResponse(new ApiRequestError(messages[error.message], 409, error.message));
    }
    return apiErrorResponse(error);
  }
}
