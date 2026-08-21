import { ConnectionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, apiErrorResponse, enforceRateLimit } from "@/lib/api";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit(request, "user:profile-search", 60, 60_000);
    const currentUser = await requireCurrentUser();
    const query = (request.nextUrl.searchParams.get("q") ?? "").trim().replace(/^@+/, "");
    if (query.length < 2 || query.length > 30) {
      throw new ApiRequestError("Ketik minimal 2 karakter untuk mencari pengguna.");
    }

    const candidates = await prisma.user.findMany({
      where: {
        isSuspended: false,
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, username: true, avatarUrl: true, bio: true },
      orderBy: [{ username: "asc" }, { name: "asc" }],
      take: 12,
    });

    const candidateIds = candidates.filter((candidate) => candidate.id !== currentUser.id).map((candidate) => candidate.id);
    const connections = candidateIds.length ? await prisma.userConnection.findMany({
      where: {
        OR: [
          { requesterId: currentUser.id, addresseeId: { in: candidateIds } },
          { addresseeId: currentUser.id, requesterId: { in: candidateIds } },
        ],
      },
      select: { requesterId: true, addresseeId: true, status: true },
    }) : [];
    const connectionByUser = new Map(connections.map((connection) => [
      connection.requesterId === currentUser.id ? connection.addresseeId : connection.requesterId,
      connection,
    ]));

    const normalizedQuery = query.toLocaleLowerCase("id-ID");
    const users = candidates
      .filter((candidate) => connectionByUser.get(candidate.id)?.status !== ConnectionStatus.BLOCKED)
      .map((candidate) => {
        const connection = connectionByUser.get(candidate.id);
        const relationship = candidate.id === currentUser.id
          ? "self"
          : connection?.status === ConnectionStatus.ACCEPTED
            ? "friends"
            : connection?.status === ConnectionStatus.PENDING
              ? connection.requesterId === currentUser.id ? "outgoing" : "incoming"
              : "none";
        const username = candidate.username?.toLocaleLowerCase("id-ID") ?? "";
        const name = candidate.name.toLocaleLowerCase("id-ID");
        const relevance = username === normalizedQuery ? 0 : username.startsWith(normalizedQuery) ? 1 : name.startsWith(normalizedQuery) ? 2 : 3;
        return { ...candidate, relationship, relevance };
      })
      .sort((left, right) => left.relevance - right.relevance || left.name.localeCompare(right.name, "id-ID"))
      .slice(0, 8)
      .map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        username: candidate.username,
        avatarUrl: candidate.avatarUrl,
        bio: candidate.bio,
        relationship: candidate.relationship,
      }));

    return NextResponse.json({ success: true, users }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
