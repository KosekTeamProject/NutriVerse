import {
  ConnectionStatus,
  Prisma,
  PrivacyLevel,
} from "@prisma/client";

export function visiblePostWhere(
  userId: string,
  postId?: string,
): Prisma.PostWhereInput {
  return {
    id: postId,
    isHidden: false,
    OR: [
      { userId },
      { privacyLevel: PrivacyLevel.PUBLIC },
      {
        privacyLevel: PrivacyLevel.CIRCLE,
        user: {
          is: {
            OR: [
              {
                connectionsSent: {
                  some: {
                    addresseeId: userId,
                    status: ConnectionStatus.ACCEPTED,
                  },
                },
              },
              {
                connectionsReceived: {
                  some: {
                    requesterId: userId,
                    status: ConnectionStatus.ACCEPTED,
                  },
                },
              },
            ],
          },
        },
      },
      {
        privacyLevel: { not: PrivacyLevel.PRIVATE },
        guild: {
          is: {
            members: { some: { userId } },
          },
        },
      },
    ],
  };
}
