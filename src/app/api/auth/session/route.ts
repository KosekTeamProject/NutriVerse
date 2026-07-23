import { NextResponse } from "next/server";
import { authErrorResponse, requireCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return authErrorResponse(error);
  }
}
