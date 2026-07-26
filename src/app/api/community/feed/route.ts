import { NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

function formatWaktuLalu(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Baru saja";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} mnt lalu`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam lalu`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari lalu`;
  
  return date.toLocaleDateString('id-ID');
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Fetch all PUBLIC and CIRCLE posts since it's a demo.
    const posts = await db.post.findMany({
      where: {
        isHidden: false,
        privacyLevel: {
          in: ["PUBLIC", "CIRCLE"]
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
          }
        },
        activitySession: {
          select: {
            distanceMeters: true,
            verificationStatus: true,
          }
        },
        comments: {
          include: {
            user: { select: { name: true, avatarUrl: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        reactions: {
          include: {
            user: { select: { username: true } }
          }
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          }
        }
      }
    });

    // Format to match the frontend `Post` type
    const formattedPosts = posts.map(post => {
      // Determine time
      const timeStr = formatWaktuLalu(post.createdAt);
      
      // Determine kind
      let kind = "reflection";
      if (post.kind === "ACTIVITY") kind = "activity";
      if (post.kind === "CONSISTENCY") kind = "consistency";

      // Determine detail string and trustLevel
      let detail = "Catatan Komunitas";
      let trustLevel = "self-reported";

      if (post.activitySession) {
        trustLevel = post.activitySession.verificationStatus === "VERIFIED" ? "verified" : "pending";
        if (post.activitySession.distanceMeters > 0) {
          detail = `${(post.activitySession.distanceMeters / 1000).toFixed(1).replace(".", ",")} km · Progres Terverifikasi`;
        } else {
          detail = "Progres Terverifikasi";
        }
      } else if (post.kind === "CONSISTENCY") {
        detail = "Konsistensi Terjaga";
      }

      return {
        id: post.id,
        name: post.user.name,
        time: timeStr,
        kind,
        text: post.content,
        detail,
        encourages: post._count.reactions,
        comments: post._count.comments,
        commentList: post.comments.map(c => ({
          id: c.id,
          userName: c.user.name,
          text: c.content
        })),
        reactionList: post.reactions.map(r => r.user.username),
        trustLevel
      };
    });

    return NextResponse.json({ success: true, posts: formattedPosts });
  } catch (error: any) {
    console.error("Community Feed Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat perjalanan komunitas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let userId = body.userId;
    const username = body.username;
    
    if (!userId && username) {
      const user = await db.user.findUnique({ where: { username } });
      if (user) userId = user.id;
    }

    if (!userId) {
      // Get the first available user as fallback for demo
      const user = await db.user.findFirst();
      if (!user) {
        return NextResponse.json({ success: false, error: "No user found in database" }, { status: 400 });
      }
      userId = user.id;
    }

    const post = await db.post.create({
      data: {
        userId,
        content: body.text,
        kind: body.kind || "REFLECTION",
        privacyLevel: "CIRCLE",
      }
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Community Post Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membagikan postingan" },
      { status: 500 }
    );
  }
}
