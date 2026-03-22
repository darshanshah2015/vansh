import { eq, and, count, desc, lt, isNull } from 'drizzle-orm';
import { db } from '@db/index';
import { claims, persons, treeMembers, trees, users } from '@db/schema/index';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../shared/errors/index';
import * as auditService from '../../../shared/services/audit.service';
import * as notificationService from '../../../shared/services/notification.service';

export async function createClaim(personId: string, userId: string, reason?: string) {
  const [person] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  if (!person) throw new NotFoundError('Person', personId);

  if (person.claimedByUserId) {
    throw new ConflictError('This person is already claimed by another user');
  }

  // Check for existing pending claim by this user
  const existing = await db
    .select()
    .from(claims)
    .where(and(eq(claims.personId, personId), eq(claims.userId, userId), eq(claims.status, 'pending')))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError('You already have a pending claim for this person');
  }

  // Check if tree has zero active members (auto-approve immediately)
  const activeMembers = await db
    .select({ total: count() })
    .from(treeMembers)
    .where(and(eq(treeMembers.treeId, person.treeId), eq(treeMembers.status, 'active')));

  const hasActiveMembers = Number(activeMembers[0]?.total ?? 0) > 0;

  const autoApproveAt = new Date();
  autoApproveAt.setDate(autoApproveAt.getDate() + 7);

  const [claim] = await db
    .insert(claims)
    .values({
      personId,
      userId,
      treeId: person.treeId,
      reason: reason ?? null,
      autoApproveAt: hasActiveMembers ? autoApproveAt : null,
      status: hasActiveMembers ? 'pending' : 'approved',
    })
    .returning();

  if (!hasActiveMembers) {
    // Auto-approve immediately: update person and add to tree
    await db.update(persons).set({ claimedByUserId: userId }).where(eq(persons.id, personId));
    await db.insert(treeMembers).values({
      treeId: person.treeId,
      userId,
      status: 'active',
    });
  } else {
    // Notify tree members
    await notificationService.createNotificationsForTreeMembers({
      treeId: person.treeId,
      type: 'claim_submitted',
      title: 'New Claim Request',
      message: `Someone wants to claim ${person.firstName} ${person.lastName}`,
      linkUrl: `/claims/${claim.id}`,
    });
  }

  await auditService.logChange({
    treeId: person.treeId,
    personId,
    userId,
    action: 'claim',
    entityType: 'claim',
    entityId: claim.id,
    newValue: { status: claim.status },
  });

  return claim;
}

export async function approveClaim(claimId: string, userId: string) {
  const [claim] = await db.select().from(claims).where(eq(claims.id, claimId)).limit(1);
  if (!claim) throw new NotFoundError('Claim', claimId);

  if (claim.status !== 'pending') {
    throw new ConflictError('This claim has already been reviewed');
  }

  // Verify reviewer is a tree member
  const member = await db.query.treeMembers.findFirst({
    where: and(eq(treeMembers.treeId, claim.treeId), eq(treeMembers.userId, userId)),
  });
  if (!member) throw new ForbiddenError('You must be a tree member to approve claims');

  const [updated] = await db
    .update(claims)
    .set({
      status: 'approved',
      reviewedById: userId,
      reviewedAt: new Date(),
    })
    .where(eq(claims.id, claimId))
    .returning();

  // Update person and add claimant to tree
  await db
    .update(persons)
    .set({ claimedByUserId: claim.userId })
    .where(eq(persons.id, claim.personId));

  // Check if already a member
  const existingMember = await db.query.treeMembers.findFirst({
    where: and(eq(treeMembers.treeId, claim.treeId), eq(treeMembers.userId, claim.userId)),
  });
  if (!existingMember) {
    await db.insert(treeMembers).values({
      treeId: claim.treeId,
      userId: claim.userId,
      status: 'active',
    });
  }

  // Notify claimant
  await notificationService.createNotification({
    userId: claim.userId,
    treeId: claim.treeId,
    type: 'claim_approved',
    title: 'Claim Approved',
    message: 'Your claim has been approved! You are now a tree member.',
    linkUrl: `/trees/${claim.treeId}`,
  });

  await auditService.logChange({
    treeId: claim.treeId,
    personId: claim.personId,
    userId,
    action: 'claim',
    entityType: 'claim',
    entityId: claimId,
    newValue: { status: 'approved' },
  });

  return updated;
}

export async function rejectClaim(claimId: string, userId: string, reviewNote?: string) {
  const [claim] = await db.select().from(claims).where(eq(claims.id, claimId)).limit(1);
  if (!claim) throw new NotFoundError('Claim', claimId);

  if (claim.status !== 'pending') {
    throw new ConflictError('This claim has already been reviewed');
  }

  const member = await db.query.treeMembers.findFirst({
    where: and(eq(treeMembers.treeId, claim.treeId), eq(treeMembers.userId, userId)),
  });
  if (!member) throw new ForbiddenError('You must be a tree member to reject claims');

  const [updated] = await db
    .update(claims)
    .set({
      status: 'rejected',
      reviewedById: userId,
      reviewNote: reviewNote ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(claims.id, claimId))
    .returning();

  await notificationService.createNotification({
    userId: claim.userId,
    treeId: claim.treeId,
    type: 'claim_rejected',
    title: 'Claim Rejected',
    message: reviewNote ? `Your claim was rejected: ${reviewNote}` : 'Your claim was rejected.',
  });

  await auditService.logChange({
    treeId: claim.treeId,
    personId: claim.personId,
    userId,
    action: 'claim',
    entityType: 'claim',
    entityId: claimId,
    newValue: { status: 'rejected', reviewNote },
  });

  return updated;
}

export async function getClaimsByTree(slug: string, page: number, limit: number) {
  const [tree] = await db.select().from(trees).where(eq(trees.slug, slug)).limit(1);
  if (!tree) throw new NotFoundError('Tree', slug);

  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: claims.id,
        status: claims.status,
        reason: claims.reason,
        reviewNote: claims.reviewNote,
        autoApproveAt: claims.autoApproveAt,
        createdAt: claims.createdAt,
        reviewedAt: claims.reviewedAt,
        personId: claims.personId,
        personFirstName: persons.firstName,
        personLastName: persons.lastName,
        userId: claims.userId,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(claims)
      .innerJoin(persons, eq(claims.personId, persons.id))
      .innerJoin(users, eq(claims.userId, users.id))
      .where(eq(claims.treeId, tree.id))
      .orderBy(desc(claims.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(claims).where(eq(claims.treeId, tree.id)),
  ]);

  return {
    items,
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
  };
}

export async function getClaimsByUser(userId: string) {
  return db
    .select({
      id: claims.id,
      status: claims.status,
      reason: claims.reason,
      reviewNote: claims.reviewNote,
      autoApproveAt: claims.autoApproveAt,
      createdAt: claims.createdAt,
      reviewedAt: claims.reviewedAt,
      personId: claims.personId,
      personFirstName: persons.firstName,
      personLastName: persons.lastName,
      treeId: claims.treeId,
      treeName: trees.name,
      treeSlug: trees.slug,
    })
    .from(claims)
    .innerJoin(persons, eq(claims.personId, persons.id))
    .innerJoin(trees, eq(claims.treeId, trees.id))
    .where(eq(claims.userId, userId))
    .orderBy(desc(claims.createdAt));
}

export async function processAutoApprovals() {
  const pendingClaims = await db
    .select()
    .from(claims)
    .where(
      and(
        eq(claims.status, 'pending'),
        lt(claims.autoApproveAt, new Date())
      )
    );

  for (const claim of pendingClaims) {
    await db
      .update(claims)
      .set({ status: 'approved', reviewedAt: new Date() })
      .where(eq(claims.id, claim.id));

    await db
      .update(persons)
      .set({ claimedByUserId: claim.userId })
      .where(eq(persons.id, claim.personId));

    const existingMember = await db.query.treeMembers.findFirst({
      where: and(eq(treeMembers.treeId, claim.treeId), eq(treeMembers.userId, claim.userId)),
    });
    if (!existingMember) {
      await db.insert(treeMembers).values({
        treeId: claim.treeId,
        userId: claim.userId,
        status: 'active',
      });
    }

    await notificationService.createNotification({
      userId: claim.userId,
      treeId: claim.treeId,
      type: 'claim_approved',
      title: 'Claim Auto-Approved',
      message: 'Your claim was auto-approved after 7 days. You are now a tree member.',
    });
  }

  return pendingClaims.length;
}
