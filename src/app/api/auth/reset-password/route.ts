import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "auth:reset", 6, 15 * 60_000);
    const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
    const password = typeof body?.password === "string" ? body.password : "";
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { success: false, error: "Kata sandi harus terdiri dari 8-72 karakter." },
        { status: 400 },
      );
    }
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
