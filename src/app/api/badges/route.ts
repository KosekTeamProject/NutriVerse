import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { getUserBadgeGallery, reconcileUserBadges } from "@/server/badges/badge-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    await reconcileUserBadges(user.id);
    const badges = await getUserBadgeGallery(user.id);
    return NextResponse.json({
      success: true,
      badges,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
