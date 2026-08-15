import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.cmsTag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ success: true, tags });
}
