import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestOrigin, safeRedirectPath } from "@/server/auth/oauth";

export async function GET(request: NextRequest) {
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
  const callbackUrl = new URL("/api/auth/callback", requestOrigin(request));
  callbackUrl.searchParams.set("next", next);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    const failureUrl = new URL("/", requestOrigin(request));
    failureUrl.searchParams.set("auth_error", "google_oauth_start_failed");
    return NextResponse.redirect(failureUrl);
  }

  return NextResponse.redirect(data.url);
}
