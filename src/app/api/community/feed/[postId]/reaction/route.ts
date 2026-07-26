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

    // Toggle reaction logic
    const existingReaction = await db.postReaction.findFirst({
      where: {
        postId,
        userId,
      }
    });

    if (existingReaction) {
      // Unlike
      await db.postReaction.delete({
        where: { id: existingReaction.id }
      });
      return NextResponse.json({ success: true, action: "unliked" });
    } else {
      // Like
      await db.postReaction.create({
        data: {
          postId,
          userId,
          type: "ENCOURAGE"
        }
      });
      
      const post = await db.post.findUnique({ where: { id: postId }, select: { userId: true } });
      if (post && post.userId !== userId) {
        await db.userNotification.create({
          data: {
            userId: post.userId,
            type: "SOCIAL",
            title: "Postingan Disukai",
            message: `${username || 'Seseorang'} memberi semangat pada perjalanan komunitasmu!`
          }
        });
      }

      return NextResponse.json({ success: true, action: "liked" });
    }
  } catch (error: any) {
    console.error("Reaction Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membagikan reaction" },
      { status: 500 }
    );
  }
}
