import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { ownedStoragePath } from "@/lib/storage-ownership";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PRIVATE_BUCKETS = [
  "activity-shares",
  "journal-attachments",
] as const;

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get("bucket");
    const path = ownedStoragePath(
      searchParams.get("path"),
      user.authUserId,
    );
    if (
      !bucket ||
      !PRIVATE_BUCKETS.includes(
        bucket as (typeof PRIVATE_BUCKETS)[number],
      ) ||
      !path
    ) {
      return NextResponse.json(
        { success: false, error: "Target file tidak valid." },
        { status: 400 },
      );
    }
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 10 * 60);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      expiresInSeconds: 600,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
