import { eq, and, count, desc, sql } from 'drizzle-orm';
import { db } from '@db/index';
import { notifications, trees } from '@db/schema/index';

export async function getNotifications(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        linkUrl: notifications.linkUrl,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        treeId: notifications.treeId,
        treeName: trees.name,
      })
      .from(notifications)
      .leftJoin(trees, eq(notifications.treeId, trees.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(notifications)
      .where(eq(notifications.userId, userId)),
  ]);

  return {
    items,
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return Number(result?.total ?? 0);
}

export async function markAsRead(notificationId: string, userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllAsRead(userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function markTreeGroupAsRead(userId: string, treeId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.treeId, treeId),
        eq(notifications.isRead, false)
      )
    );
}
