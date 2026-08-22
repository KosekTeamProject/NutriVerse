import {
  NotificationType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

function preferenceField(type: NotificationType) {
  if (type === NotificationType.SOCIAL) {
    return "notificationsSocial" as const;
  }
  if (
    type === NotificationType.ACTIVITY ||
    type === NotificationType.CHEAT_ALERT ||
    type === NotificationType.EVENT
  ) {
    return "notificationsActivity" as const;
  }
  if (type === NotificationType.CHALLENGE) {
    return "notificationsLeaderboard" as const;
  }
  return null;
}

export async function createUserNotification(
  input: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    respectPreferences?: boolean;
    preferenceOverride?: "notificationsMomentLikes" | "notificationsMomentComments" | "notificationsCommunity";
  },
  database: DatabaseClient = prisma,
) {
  const preference = input.preferenceOverride ?? preferenceField(input.type);
  if (input.respectPreferences !== false && preference) {
    const settings = await database.userSettings.findUnique({
      where: { userId: input.userId },
      select: { [preference]: true },
    });
    if (settings && !settings[preference]) return null;
  }
  return database.userNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 120),
      message: input.message.slice(0, 1_000),
    },
  });
}
