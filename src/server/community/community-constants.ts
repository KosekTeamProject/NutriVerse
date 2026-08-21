// String constants deliberately avoid runtime enum lookups from a Prisma Client
// that may still be cached by Next.js during a schema hot-reload.
export const COMMUNITY_APPROVAL = {
  PENDING_REVIEW: "PENDING_REVIEW",
  NEEDS_REVISION: "NEEDS_REVISION",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
} as const;

export const COMMUNITY_JOIN = {
  OPEN: "OPEN",
  APPROVAL: "APPROVAL",
} as const;

export const COMMUNITY_MEMBER = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  BANNED: "BANNED",
} as const;
