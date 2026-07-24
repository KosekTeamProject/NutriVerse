import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { buildCommunityOverview } from "@/server/progress/progress-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const overview = await buildCommunityOverview(user.id);
    return NextResponse.json(
      { success: true, overview },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
