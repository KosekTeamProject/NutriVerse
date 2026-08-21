import { GuildRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, assertSameOrigin, enforceRateLimit, stringValue } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { communityCreatorEligibility } from "@/server/community/community-policy";
import { COMMUNITY_APPROVAL, COMMUNITY_JOIN, COMMUNITY_MEMBER } from "@/server/community/community-constants";

function communityRules(value: unknown) {
  if (!Array.isArray(value)) throw new ApiRequestError("Tambahkan minimal tiga peraturan komunitas.");
  const rules = value.map((item, index) => stringValue(item, `Peraturan ${index + 1}`, { min: 3, max: 160 })).filter(Boolean);
  if (rules.length < 3 || rules.length > 10) throw new ApiRequestError("Peraturan komunitas harus berjumlah 3-10.");
  return rules;
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const [proposals, eligibility] = await Promise.all([
      prisma.guild.findMany({
        where: { leaderId: user.id },
        select: { id: true, name: true, category: true, approvalStatus: true, reviewNote: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      communityCreatorEligibility(user.id),
    ]);
    return NextResponse.json({ success: true, proposals, eligibility });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, "community:proposal", 3, 24 * 60 * 60_000);
    const user = await requireCurrentUser();
    const eligibility = await communityCreatorEligibility(user.id);
    if (!eligibility.usernameReady) throw new ApiRequestError("Atur username sebelum membuat komunitas.", 409, "USERNAME_REQUIRED");
    if (!eligibility.tierReady) throw new ApiRequestError(`Minimal rank ${eligibility.minimumTier} diperlukan untuk membuat komunitas.`, 403, "TIER_REQUIRED");
    if (eligibility.used >= eligibility.limit) throw new ApiRequestError(`Batas ${eligibility.limit} komunitas aktif sudah tercapai.`, 409, "COMMUNITY_LIMIT_REACHED");
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const name = stringValue(body?.name, "Nama komunitas", { min: 3, max: 40 });
    const duplicate = await prisma.guild.findFirst({ where: { name: { equals: name, mode: "insensitive" }, approvalStatus: { not: COMMUNITY_APPROVAL.REJECTED } }, select: { id: true } });
    if (duplicate) throw new ApiRequestError("Nama komunitas tersebut sudah digunakan.", 409, "COMMUNITY_NAME_TAKEN");
    const joinPolicy = body?.joinPolicy === COMMUNITY_JOIN.APPROVAL ? COMMUNITY_JOIN.APPROVAL : COMMUNITY_JOIN.OPEN;
    const community = await prisma.$transaction(async (transaction) => {
      const created = await transaction.guild.create({
        data: {
          name,
          description: stringValue(body?.description, "Deskripsi", { min: 50, max: 1_000 }),
          category: stringValue(body?.category, "Kategori", { min: 3, max: 60 }),
          rules: communityRules(body?.rules),
          emblemUrl: typeof body?.emblemUrl === "string" && body.emblemUrl.trim() ? stringValue(body.emblemUrl, "Logo URL", { max: 2_000 }) : null,
          joinPolicy,
          leaderId: user.id,
          isActive: true,
          approvalStatus: COMMUNITY_APPROVAL.PENDING_REVIEW,
        },
      });
      await transaction.guildMember.create({ data: { guildId: created.id, userId: user.id, role: GuildRole.OWNER, status: COMMUNITY_MEMBER.ACTIVE, approvedAt: new Date() } });
      return created;
    });
    return NextResponse.json({ success: true, community }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
