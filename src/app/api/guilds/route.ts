import { GuildRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse, assertSameOrigin, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const guilds = await prisma.guild.findMany({
      include: {
        _count: { select: { members: true, posts: true } },
        members: { where: { userId: user.id }, select: { role: true, joinedAt: true } },
      },
      orderBy: [{ members: { _count: "desc" } }, { name: "asc" }],
    });
    return NextResponse.json({ success: true, guilds });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const guild = await prisma.$transaction(async (transaction) => {
      const created = await transaction.guild.create({
        data: {
          name: stringValue(body?.name, "Nama guild", { min: 3, max: 60 }),
          description:
            typeof body?.description === "string" && body.description.trim()
              ? stringValue(body.description, "Deskripsi", { max: 500 })
              : null,
          leaderId: user.id,
        },
      });
      await transaction.guildMember.create({
        data: { guildId: created.id, userId: user.id, role: GuildRole.OWNER },
      });
      return created;
    });
    return NextResponse.json({ success: true, guild }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
