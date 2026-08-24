import {
  NotificationType,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

export const NOTIFICATION_RECENT_READ_WINDOW_MS = 24 * 60 * 60 * 1_000;

function safeInternalActionUrl(value?: string) {
  if (!value) return null;
  const clean = value.trim();
  return clean.startsWith("/") && !clean.startsWith("//")
    ? clean.slice(0, 500)
    : null;
}

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
    requiresAction?: boolean;
    expiresAt?: Date | null;
    actionUrl?: string;
    actionKey?: string;
    dedupeKey?: string;
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
  const dedupeKey = input.dedupeKey?.trim()
    ? `${input.userId}:${input.dedupeKey.trim()}`.slice(0, 500)
    : null;
  const data = {
    userId: input.userId,
    type: input.type,
    title: input.title.slice(0, 120),
    message: input.message.slice(0, 1_000),
    requiresAction: input.requiresAction ?? false,
    expiresAt: input.expiresAt ?? null,
    actionUrl: safeInternalActionUrl(input.actionUrl),
    actionKey: input.actionKey?.trim().slice(0, 200) || null,
    dedupeKey,
  };

  if (!dedupeKey) return database.userNotification.create({ data });
  return database.userNotification.upsert({
    where: { dedupeKey },
    create: data,
    update: {},
  });
}

/**
 * Lifecycle rule:
 * - Informational notifications move to history 24 hours after being read.
 * - Actionable notifications remain active until resolved or expired.
 *
 * Archiving is lazy and idempotent: every notification read refresh can safely
 * call this without requiring a background scheduler.
 */
export async function archiveEligibleUserNotifications(
  userId: string,
  database: DatabaseClient = prisma,
  now = new Date(),
) {
  const recentReadCutoff = new Date(
    now.getTime() - NOTIFICATION_RECENT_READ_WINDOW_MS,
  );

  return database.userNotification.updateMany({
    where: {
      userId,
      archivedAt: null,
      OR: [
        {
          requiresAction: false,
          isRead: true,
          readAt: { lte: recentReadCutoff },
        },
        {
          requiresAction: true,
          OR: [
            { resolvedAt: { not: null } },
            { expiresAt: { lte: now } },
          ],
        },
      ],
    },
    data: { archivedAt: now },
  });
}

export async function resolveUserNotificationsByActionKey(
  userId: string,
  actionKey: string,
  database: DatabaseClient = prisma,
  now = new Date(),
) {
  return database.userNotification.updateMany({
    where: {
      userId,
      actionKey,
      requiresAction: true,
      resolvedAt: null,
    },
    data: {
      resolvedAt: now,
      isRead: true,
      readAt: now,
    },
  });
}

export async function startProcessingUserNotificationsByActionKey(
  userId: string,
  actionKey: string,
  database: DatabaseClient = prisma,
  now = new Date(),
) {
  return database.userNotification.updateMany({
    where: {
      userId,
      actionKey,
      requiresAction: true,
      processingAt: null,
      resolvedAt: null,
    },
    data: {
      processingAt: now,
      isRead: true,
      readAt: now,
    },
  });
}
