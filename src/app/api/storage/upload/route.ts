import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKETS = {
  avatars: { max: 5 * 1024 * 1024, public: true },
  "post-images": { max: 10 * 1024 * 1024, public: true },
  "activity-shares": { max: 10 * 1024 * 1024, public: false },
} as const;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireCurrentUser();
    const form = await request.formData();
    const bucket = form.get("bucket");
    const file = form.get("file");
    if (typeof bucket !== "string" || !(bucket in BUCKETS) || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Bucket atau file tidak valid." }, { status: 400 });
    }
    const config = BUCKETS[bucket as keyof typeof BUCKETS];
    const extension = MIME_EXTENSIONS[file.type];
    if (!extension || file.size <= 0 || file.size > config.max) {
      return NextResponse.json({ success: false, error: "Tipe atau ukuran file tidak diizinkan." }, { status: 400 });
    }
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Sesi tidak valid." }, { status: 401 });
    }
    const path = `${authData.user.id}/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    const publicUrl = config.public
      ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      : null;
    return NextResponse.json({ success: true, bucket, path, publicUrl }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as { bucket?: unknown; path?: unknown } | null;
    if (
      typeof body?.bucket !== "string" ||
      !(body.bucket in BUCKETS) ||
      typeof body.path !== "string"
    ) {
      return NextResponse.json({ success: false, error: "Target file tidak valid." }, { status: 400 });
    }
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user || !body.path.startsWith(`${authData.user.id}/`)) {
      return NextResponse.json({ success: false, error: "File bukan milik pengguna." }, { status: 403 });
    }
    const { error } = await supabase.storage.from(body.bucket).remove([body.path]);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
