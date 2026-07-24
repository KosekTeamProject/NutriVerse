import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api";
import { runBackendMaintenance } from "@/server/maintenance/backend-maintenance-service";

function authorized(request: NextRequest) {
  const configured = process.env.MAINTENANCE_SECRET;
  if (!configured) return false;
  const bearer = request.headers.get("authorization");
  const supplied =
    bearer?.startsWith("Bearer ")
      ? bearer.slice("Bearer ".length)
      : request.headers.get("x-maintenance-secret");
  if (!supplied) return false;
  const actual = Buffer.from(supplied);
  const expected = Buffer.from(configured);
  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}

async function handle(request: NextRequest) {
  try {
    if (!process.env.MAINTENANCE_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: "MAINTENANCE_SECRET belum dikonfigurasi.",
        },
        { status: 503 },
      );
    }
    if (!authorized(request)) {
      return NextResponse.json(
        { success: false, error: "Kredensial maintenance tidak valid." },
        { status: 401 },
      );
    }
    const report = await runBackendMaintenance();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export const GET = handle;
export const POST = handle;
