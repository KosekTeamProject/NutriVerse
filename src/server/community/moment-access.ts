import {
  ConnectionStatus,
  Prisma,
  PrivacyLevel,
} from "@prisma/client";
import { COMMUNITY_APPROVAL, COMMUNITY_MEMBER } from "@/server/community/community-constants";

export function visibleMomentWhere(
  userId: string,
  momentId?: string,
): Prisma.MomentWhereInput {
  return {
    id: momentId,
    isHidden: false,
    AND: [
      {
        OR: [
          { userId },
          { privacyLevel: PrivacyLevel.PUBLIC },
          {
            privacyLevel: PrivacyLevel.CIRCLE,
            user: {
              is: {
                OR: [
                  { connectionsSent: { some: { addresseeId: userId, status: ConnectionStatus.ACCEPTED } } },
                  { connectionsReceived: { some: { requesterId: userId, status: ConnectionStatus.ACCEPTED } } },
                ],
              },
            },
          },
          {
            privacyLevel: PrivacyLevel.COMMUNITY,
            community: {
              is: {
                approvalStatus: COMMUNITY_APPROVAL.APPROVED,
                isActive: true,
                members: { some: { userId, status: COMMUNITY_MEMBER.ACTIVE } },
              },
            },
          },
        ],
      },
      {
        OR: [{ userId }, { isArchived: false }],
      },
      {
        OR: [
          { userId },
          {
            user: {
              is: {
                connectionsSent: { none: { addresseeId: userId, status: ConnectionStatus.BLOCKED } },
                connectionsReceived: { none: { requesterId: userId, status: ConnectionStatus.BLOCKED } },
              },
            },
          },
        ],
      },
    ],
  };
}
