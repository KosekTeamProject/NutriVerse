import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ApiRequestError,
  apiErrorResponse,
  assertSameOrigin,
  enforceRateLimit,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeUploadedImage } from "@/server/storage/image-processing";

const BUCKETS = {
  avatars: {
    max: 5 * 1024 * 1024,
    public: true,
    maxDimension: 2_048,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "post-images": {
    max: 10 * 1024 * 1024,
    public: true,
    maxDimension: 4_096,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  "activity-shares": {
    max: 10 * 1024 * 1024,
    public: false,
    maxDimension: 4_096,
    mimeTypes: ["image/png"],
  },
  "journal-attachments": {
    max: 10 * 1024 * 1024,
    public: false,
    maxDimension: 4_096,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
} as const;

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "storage:upload", 30, 60 * 60_000);
    await requireCurrentUser();
    const form = await request.formData();
    const bucket = form.get("bucket");
    const file = form.get("file");
    if (typeof bucket !== "string" || !(bucket in BUCKETS) || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Bucket atau file tidak valid." }, { status: 400 });
    }
    const config = BUCKETS[bucket as keyof typeof BUCKETS];
    if (
      file.size <= 0 ||
      file.size > config.max ||
      !config.mimeTypes.some((mimeType) => mimeType === file.type)
    ) {
      return NextResponse.json({ success: false, error: "Tipe atau ukuran file tidak diizinkan." }, { status: 400 });
    }
    const sanitized = await sanitizeUploadedImage({
      bytes: Buffer.from(await file.arrayBuffer()),
      declaredContentType: file.type,
      maxBytes: config.max,
      maxDimension: config.maxDimension,
    });
    const supabase = await createSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: "Sesi tidak valid." }, { status: 401 });
    }
    const path = `${authData.user.id}/${randomUUID()}.${sanitized.extension}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, sanitized.bytes, {
        contentType: sanitized.contentType,
        upsert: false,
      });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    const publicUrl = config.public
      ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      : null;
    return NextResponse.json(
      {
        success: true,
        bucket,
        path,
        publicUrl,
        contentType: sanitized.contentType,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "UNSUPPORTED_IMAGE_TYPE",
        "INVALID_IMAGE_CONTENT",
        "PROCESSED_IMAGE_TOO_LARGE",
      ].includes(error.message)
    ) {
      return apiErrorResponse(
        new ApiRequestError(
          "Isi gambar tidak valid atau melebihi batas setelah diproses.",
          400,
          error.message,
        ),
      );
    }
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
