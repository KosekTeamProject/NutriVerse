import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit } from "@/lib/api";
import { bootstrapUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignInPayload = { email?: unknown; password?: unknown };

export async function POST(request: NextRequest) {
 try {
  assertSameOrigin(request);
  await enforceRateLimit(request, "auth:sign-in", 10, 15 * 60_000);
  const body = (await request.json().catch(() => null)) as SignInPayload | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ success: false, error: "Email dan kata sandi wajib diisi." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return NextResponse.json({ success: false, error: error?.message ?? "Login gagal." }, { status: 401 });

  const user = await bootstrapUser(data.user);
  const domain = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      username: true,
      healthProfile: { select: { onboardingCompleted: true } },
      companionPreference: {
        select: { companionName: true, companionAvatarId: true },
      },
    },
  });
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: domain?.username,
      avatarUrl: user.avatarUrl,
      companionName: domain?.companionPreference?.companionName ?? "Nora",
      companionAvatarId:
        domain?.companionPreference?.companionAvatarId ?? "sparkles",
      onboardingCompleted: domain?.healthProfile?.onboardingCompleted ?? false,
      provider: "password",
    },
  });
 } catch (error) {
   return apiErrorResponse(error);
 }
}
