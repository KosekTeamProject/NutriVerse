import { CmsPublicationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  const category = searchParams.get("category")?.trim();
  const articles = await prisma.cmsArticle.findMany({
    where: {
      status: CmsPublicationStatus.PUBLISHED,
      ...(slug ? { slug } : {}),
      ...(category ? { category: { slug: category } } : {}),
      OR: [
        { publishedAt: null },
        { publishedAt: { lte: new Date() } },
      ],
    },
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: slug ? 1 : 50,
  });
  return NextResponse.json({ success: true, articles });
}
