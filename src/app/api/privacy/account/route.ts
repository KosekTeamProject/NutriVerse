import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const USER_STORAGE_BUCKETS = [
  "avatars",
  "post-images",
  "moments",
  "activity-shares",
  "journal-attachments",
] as const;

async function removeUserStorage(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  authUserId: string,
) {
  for (const bucket of USER_STORAGE_BUCKETS) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(authUserId, { limit: 1_000 });
    if (error || !data?.length) continue;
    await admin.storage
      .from(bucket)
      .remove(data.map((item) => `${authUserId}/${item.name}`));
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(
      request,
      "privacy:delete-account",
      3,
      24 * 60 * 60_000,
    );
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    if (body?.confirmation !== "DELETE") {
      throw new ApiRequestError(
        'Kirim confirmation bernilai "DELETE" untuk menghapus akun.',
      );
    }
    if (!user.authUserId) {
      throw new ApiRequestError(
        "Akun belum terhubung dengan identitas autentikasi.",
        409,
      );
    }
    const admin = createSupabaseAdminClient();
    if (!admin) {
      throw new ApiRequestError(
        "Penghapusan akun belum dikonfigurasi oleh server.",
        503,
        "SUPABASE_ADMIN_NOT_CONFIGURED",
      );
    }

    await removeUserStorage(admin, user.authUserId);
    const { error } = await admin.auth.admin.deleteUser(user.authUserId);
    if (error) {
      throw new ApiRequestError(
        "Identitas autentikasi gagal dihapus.",
        502,
        "AUTH_ACCOUNT_DELETE_FAILED",
      );
    }
    await prisma.user.delete({ where: { id: user.id } });
    return NextResponse.json({
      success: true,
      message: "Akun dan data aplikasi telah dihapus.",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
