import { PrivacyLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  apiErrorResponse,
  assertSameOrigin,
} from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 30, 1),
      100,
    );
    const cursor = searchParams.get("cursor") || undefined;
    const entries = await prisma.journeyEntry.findMany({
      where: { userId: user.id },
      include: {
        activitySession: {
          include: { verificationResult: true },
        },
        nutritionEntry: true,
        journalEntry: {
          include: { attachments: true },
        },
      },
      orderBy: [{ entryDate: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = entries.length > limit;
    const page = hasMore ? entries.slice(0, limit) : entries;
    return NextResponse.json({
      success: true,
      entries: page,
      nextCursor: hasMore ? page.at(-1)?.id : null,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireCurrentUser();
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const activitySessionId =
      typeof body?.activitySessionId === "string"
        ? body.activitySessionId
        : null;
    const nutritionEntryId =
      typeof body?.nutritionEntryId === "string"
        ? body.nutritionEntryId
        : null;
    const journalEntryId =
      typeof body?.journalEntryId === "string" ? body.journalEntryId : null;
    if (!activitySessionId && !nutritionEntryId && !journalEntryId) {
      return NextResponse.json(
        { success: false, error: "Journey harus memiliki sumber data." },
        { status: 400 },
      );
    }
    const [activity, nutrition, journal] = await Promise.all([
      activitySessionId
        ? prisma.activitySession.findFirst({
            where: { id: activitySessionId, userId: user.id },
            select: { id: true },
          })
        : null,
      nutritionEntryId
        ? prisma.nutritionEntry.findFirst({
            where: { id: nutritionEntryId, userId: user.id },
            select: { id: true },
          })
        : null,
      journalEntryId
        ? prisma.journalEntry.findFirst({
            where: { id: journalEntryId, userId: user.id },
            select: { id: true },
          })
        : null,
    ]);
    if (
      (activitySessionId && !activity) ||
      (nutritionEntryId && !nutrition) ||
      (journalEntryId && !journal)
    ) {
      return NextResponse.json(
        { success: false, error: "Salah satu sumber Journey tidak ditemukan." },
        { status: 404 },
      );
    }
    const privacyLevel =
      typeof body?.privacyLevel === "string" &&
      Object.values(PrivacyLevel).includes(
        body.privacyLevel as PrivacyLevel,
      )
        ? (body.privacyLevel as PrivacyLevel)
        : PrivacyLevel.PRIVATE;
    const duplicate = await prisma.journeyEntry.findFirst({
      where: {
        userId: user.id,
        activitySessionId,
        nutritionEntryId,
        journalEntryId,
      },
    });
    if (duplicate) {
      return NextResponse.json({
        success: true,
        entry: duplicate,
        idempotentReplay: true,
      });
    }
    const entry = await prisma.journeyEntry.create({
      data: {
        userId: user.id,
        activitySessionId,
        nutritionEntryId,
        journalEntryId,
        privacyLevel,
      },
    });
    return NextResponse.json(
      { success: true, entry, idempotentReplay: false },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
