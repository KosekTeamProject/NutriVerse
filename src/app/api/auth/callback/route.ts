import { NextRequest, NextResponse } from "next/server";
import { bootstrapUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestOrigin, safeRedirectPath } from "@/server/auth/oauth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();

  if (!code) {
    const failureUrl = new URL("/", origin);
    failureUrl.searchParams.set("auth_error", "missing_oauth_code");
    return NextResponse.redirect(failureUrl);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    const failureUrl = new URL("/", origin);
    failureUrl.searchParams.set("auth_error", "oauth_code_exchange_failed");
    return NextResponse.redirect(failureUrl);
  }

  try {
    const user = await bootstrapUser(data.user);
    const profile = await prisma.healthProfile.findUnique({
      where: { userId: user.id },
      select: { onboardingCompleted: true },
    });
    if (!profile?.onboardingCompleted && next === "/dashboard") {
      return NextResponse.redirect(new URL("/onboarding?oauth=complete", origin));
    }
  } catch (error) {
    console.error("Failed to synchronize the Supabase user profile.", error);
    await supabase.auth.signOut();
    const failureUrl = new URL("/", origin);
    failureUrl.searchParams.set("auth_error", "profile_sync_failed");
    return NextResponse.redirect(failureUrl);
  }

  return NextResponse.redirect(new URL(next, origin));
}
