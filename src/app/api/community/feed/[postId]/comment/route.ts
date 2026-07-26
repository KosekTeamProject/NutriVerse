import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  props: { params: Promise<{ postId: string }> }
) {
  const { postId } = await props.params;
  try {
    const body = await request.json();
    let userId = body.userId;
    const username = body.username;
    const text = body.text;

    if (!text?.trim()) {
      return NextResponse.json({ success: false, error: "Teks kosong" }, { status: 400 });
    }

    if (!userId && username) {
      const user = await db.user.findUnique({ where: { username } });
      if (user) userId = user.id;
    }

    if (!userId) {
      const user = await db.user.findFirst();
      if (!user) {
        return NextResponse.json({ success: false, error: "No user found" }, { status: 400 });
      }
      userId = user.id;
    }

    const comment = await db.postComment.create({
      data: {
        postId,
        userId,
        content: text,
      }
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error("Comment Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membagikan komentar" },
      { status: 500 }
    );
  }
}
