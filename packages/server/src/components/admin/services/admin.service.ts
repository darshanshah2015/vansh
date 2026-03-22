import { eq, and, count, desc, sql, lt } from 'drizzle-orm';
import { db } from '@db/index';
import {
  users,
  trees,
  treeMembers,
  persons,
  relationships,
  claims,
  mergeProposals,
  deletionRequests,
  auditLogs,
  notifications,
} from '@db/schema/index';
import { NotFoundError, ConflictError } from '../../../shared/errors/index';
import * as auditService from '../../../shared/services/audit.service';
import * as notificationService from '../../../shared/services/notification.service';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function getDashboardStats() {
  const [userCount] = await db.select({ total: count() }).from(users);
  const [treeCount] = await db.select({ total: count() }).from(trees);
  const [pendingVerifications] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.verificationStatus, 'pending'));
  const [pendingDeletions] = await db
    .select({ total: count() })
    .from(deletionRequests)
    .where(eq(deletionRequests.status, 'pending'));
  const [pendingMerges] = await db
    .select({ total: count() })
    .from(mergeProposals)
    .where(eq(mergeProposals.status, 'proposed'));

  return {
    totalUsers: Number(userCount?.total ?? 0),
    totalTrees: Number(treeCount?.total ?? 0),
    pendingVerifications: Number(pendingVerifications?.total ?? 0),
    pendingDeletions: Number(pendingDeletions?.total ?? 0),
    pendingMerges: Number(pendingMerges?.total ?? 0),
  };
}

export async function getRecentActivity(limit = 20) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      oldValue: auditLogs.oldValue,
      newValue: auditLogs.newValue,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
      userFirstName: users.firstName,
      userLastName: users.lastName,
      treeId: auditLogs.treeId,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function listVerificationRequests(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        verificationStatus: users.verificationStatus,
        aadhaarPhotoKey: users.aadhaarPhotoKey,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.verificationStatus, 'pending'))
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(users)
      .where(eq(users.verificationStatus, 'pending')),
  ]);

  return {
    items,
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
  };
}

export async function approveVerification(userId: string, adminId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new NotFoundError('User', userId);

  await db.update(users).set({ verificationStatus: 'verified' }).where(eq(users.id, userId));

  await notificationService.createNotification({
    userId,
    type: 'verification_approved',
    title: 'Verification Approved',
    message: 'Your identity has been verified. You can now edit tree data.',
  });

  await auditService.logChange({
    userId: adminId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    oldValue: { verificationStatus: user.verificationStatus },
    newValue: { verificationStatus: 'verified' },
  });
}

export async function rejectVerification(userId: string, adminId: string, reason?: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new NotFoundError('User', userId);

  await db.update(users).set({ verificationStatus: 'rejected' }).where(eq(users.id, userId));

  await notificationService.createNotification({
    userId,
    type: 'verification_rejected',
    title: 'Verification Rejected',
    message: reason
      ? `Your verification was rejected: ${reason}`
      : 'Your verification was rejected.',
  });

  await auditService.logChange({
    userId: adminId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    oldValue: { verificationStatus: user.verificationStatus },
    newValue: { verificationStatus: 'rejected', reason },
  });
}

export async function listDeletionRequests(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: deletionRequests.id,
        reason: deletionRequests.reason,
        status: deletionRequests.status,
        createdAt: deletionRequests.createdAt,
        personId: deletionRequests.personId,
        personFirstName: persons.firstName,
        personLastName: persons.lastName,
        treeId: deletionRequests.treeId,
        treeName: trees.name,
        requestedByFirstName: users.firstName,
        requestedByLastName: users.lastName,
      })
      .from(deletionRequests)
      .innerJoin(persons, eq(deletionRequests.personId, persons.id))
      .innerJoin(trees, eq(deletionRequests.treeId, trees.id))
      .innerJoin(users, eq(deletionRequests.requestedById, users.id))
      .where(eq(deletionRequests.status, 'pending'))
      .orderBy(deletionRequests.createdAt)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(deletionRequests)
      .where(eq(deletionRequests.status, 'pending')),
  ]);

  return {
    items,
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
  };
}

export async function approveDeletion(requestId: string, adminId: string) {
  const [request] = await db
    .select()
    .from(deletionRequests)
    .where(eq(deletionRequests.id, requestId))
    .limit(1);
  if (!request) throw new NotFoundError('Deletion request', requestId);

  await db.transaction(async (tx) => {
    // Delete relationships first
    await tx
      .delete(relationships)
      .where(
        sql`${relationships.personId1} = ${request.personId} OR ${relationships.personId2} = ${request.personId}`
      );

    // Delete person
    await tx.delete(persons).where(eq(persons.id, request.personId));

    // Update request
    await tx
      .update(deletionRequests)
      .set({ status: 'approved', reviewedById: adminId, reviewedAt: new Date() })
      .where(eq(deletionRequests.id, requestId));

    // Update tree member count
    const [tree] = await tx.select().from(trees).where(eq(trees.id, request.treeId)).limit(1);
    if (tree && tree.memberCount > 0) {
      await tx
        .update(trees)
        .set({ memberCount: tree.memberCount - 1 })
        .where(eq(trees.id, request.treeId));
    }
  });

  await auditService.logChange({
    treeId: request.treeId,
    personId: request.personId,
    userId: adminId,
    action: 'delete',
    entityType: 'person',
    entityId: request.personId,
  });

  await notificationService.createNotificationsForTreeMembers({
    treeId: request.treeId,
    type: 'deletion_approved',
    title: 'Person Deleted',
    message: 'A person was removed from the tree by an admin.',
    linkUrl: `/trees/${request.treeId}`,
  });
}

export async function rejectDeletion(requestId: string, adminId: string, reviewNote?: string) {
  await db
    .update(deletionRequests)
    .set({
      status: 'rejected',
      reviewedById: adminId,
      reviewNote: reviewNote ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(deletionRequests.id, requestId));
}

export async function resetUserPassword(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new NotFoundError('User', userId);

  const tempPassword = crypto.randomBytes(8).toString('hex');
  const hash = await bcrypt.hash(tempPassword, 10);

  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));

  await notificationService.createNotification({
    userId,
    type: 'password_reset',
    title: 'Password Reset',
    message: 'Your password has been reset by an admin. Please log in with your temporary password.',
  });

  return tempPassword;
}

export async function deactivateUser(userId: string, adminId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new NotFoundError('User', userId);

  await db.update(users).set({ isActive: false }).where(eq(users.id, userId));

  // Cancel pending claims
  await db
    .update(claims)
    .set({ status: 'rejected', reviewNote: 'User deactivated', reviewedById: adminId, reviewedAt: new Date() })
    .where(and(eq(claims.userId, userId), eq(claims.status, 'pending')));

  await auditService.logChange({
    userId: adminId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    oldValue: { isActive: true },
    newValue: { isActive: false },
  });
}

export async function reactivateUser(userId: string, adminId: string) {
  await db.update(users).set({ isActive: true }).where(eq(users.id, userId));

  await auditService.logChange({
    userId: adminId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    oldValue: { isActive: false },
    newValue: { isActive: true },
  });
}

export async function changeUserRole(userId: string, role: 'user' | 'admin', adminId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new NotFoundError('User', userId);

  await db.update(users).set({ role }).where(eq(users.id, userId));

  await auditService.logChange({
    userId: adminId,
    action: 'update',
    entityType: 'user',
    entityId: userId,
    oldValue: { role: user.role },
    newValue: { role },
  });
}
