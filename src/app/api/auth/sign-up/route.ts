import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, enforceRateLimit } from "@/lib/api";
import { bootstrapUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignUpPayload = { email?: unknown; password?: unknown; name?: unknown };

export async function POST(request: NextRequest) {
 try {
  assertSameOrigin(request);
  enforceRateLimit(request, "auth:sign-up", 5, 60 * 60_000);
  const body = (await request.json().catch(() => null)) as SignUpPayload | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!email.includes("@") || password.length < 8 || name.length < 2) {
    return NextResponse.json({ success: false, error: "Nama, email valid, dan kata sandi minimal 8 karakter wajib diisi." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error || !data.user) {
    return NextResponse.json({ success: false, error: error?.message ?? "Pendaftaran gagal." }, { status: 400 });
  }

  const user = await bootstrapUser(data.user);
  return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name }, requiresEmailConfirmation: !data.session }, { status: 201 });
 } catch (error) {
   return apiErrorResponse(error);
 }
}
