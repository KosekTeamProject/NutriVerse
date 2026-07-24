import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/server/auth/oauth";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "auth:forgot", 4, 60 * 60_000);
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email.includes("@")) {
      return NextResponse.json({ success: false, error: "Alamat email tidak valid." }, { status: 400 });
    }
    const redirectTo = new URL("/api/auth/callback", requestOrigin(request));
    redirectTo.searchParams.set("next", "/reset-password");
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo.toString() });
    return NextResponse.json({
      success: true,
      message: "Jika akun tersedia, tautan pemulihan telah dikirim ke email tersebut.",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
