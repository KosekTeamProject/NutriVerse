import {
  ConnectionStatus,
  Prisma,
  PrivacyLevel,
} from "@prisma/client";

export function visibleMomentWhere(
  userId: string,
  momentId?: string,
): Prisma.MomentWhereInput {
  return {
    id: momentId,
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
    ],
  };
}
