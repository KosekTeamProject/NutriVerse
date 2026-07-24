import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LetterSummary = {
  greeting?: string;
  opening?: string;
  highlights?: string[];
  growthArea?: string;
  nextWeekFocus?: string;
  closing?: string;
};

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const archive = await prisma.weeklyLetterArchive.findFirst({
      where: { userId: user.id },
      orderBy: [{ weekEnd: "desc" }, { generatedAt: "desc" }],
    });
    if (!archive) {
      return NextResponse.json({ success: true, letter: null });
    }
    const summary =
      archive.summaryJson &&
      typeof archive.summaryJson === "object" &&
      !Array.isArray(archive.summaryJson)
        ? (archive.summaryJson as LetterSummary)
        : {};
    return NextResponse.json({
      success: true,
      letter: {
        id: archive.id,
        title: archive.letterTitle,
        greeting: summary.greeting ?? `Halo ${user.name.split(" ")[0]},`,
        opening: summary.opening ?? archive.letterContent,
        highlights: Array.isArray(summary.highlights)
          ? summary.highlights.filter((item) => typeof item === "string")
          : [],
        growthArea:
          summary.growthArea ??
          "Jaga ritme yang nyaman dan lengkapi catatan harian secara konsisten.",
        nextWeekFocus:
          summary.nextWeekFocus ??
          "Pilih satu target kecil yang realistis untuk dilanjutkan.",
        closing: summary.closing ?? "Sampai di refleksi berikutnya.",
        periodStart: archive.weekStart.toISOString(),
        periodEnd: archive.weekEnd.toISOString(),
        status: "active",
        isMock: false,
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
