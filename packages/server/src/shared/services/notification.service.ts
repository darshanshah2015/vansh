import { db } from '@db/index';
import { notifications, treeMembers } from '@db/schema/index';
import { eq } from 'drizzle-orm';

export async function createNotification(params: {
  userId: string;
  treeId?: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}) {
  await db.insert(notifications).values({
    userId: params.userId,
    treeId: params.treeId ?? null,
    type: params.type,
    title: params.title,
    message: params.message,
    linkUrl: params.linkUrl ?? null,
  });
}

export async function createNotificationsForTreeMembers(params: {
  treeId: string;
  excludeUserId?: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
}) {
  const members = await db
    .select({ userId: treeMembers.userId })
    .from(treeMembers)
    .where(eq(treeMembers.treeId, params.treeId));

  const values = members
    .filter((m) => m.userId !== params.excludeUserId)
    .map((m) => ({
      userId: m.userId,
      treeId: params.treeId,
      type: params.type,
      title: params.title,
      message: params.message,
      linkUrl: params.linkUrl ?? null,
    }));

  if (values.length > 0) {
    await db.insert(notifications).values(values);
  }
}
