import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '@db/index';
import { persons, relationships, treeMembers, trees, deletionRequests, auditLogs, users } from '@db/schema/index';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/index';
import * as auditService from '../../../shared/services/audit.service';
import * as notificationService from '../../../shared/services/notification.service';
import * as matchingService from '../../../shared/services/matching.service';

async function verifyTreeMember(treeId: string, userId: string) {
  const member = await db.query.treeMembers.findFirst({
    where: and(eq(treeMembers.treeId, treeId), eq(treeMembers.userId, userId)),
  });
  if (!member) throw new ForbiddenError('You must be a verified tree member');
}

export async function addPerson(
  slug: string,
  data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth?: Date;
    dateOfDeath?: Date;
    gotra?: string;
    phone?: string;
    email?: string;
    bio?: string;
  },
  userId: string
) {
  const [tree] = await db.select().from(trees).where(eq(trees.slug, slug)).limit(1);
  if (!tree) throw new NotFoundError('Tree', slug);

  await verifyTreeMember(tree.id, userId);

  const isAlive = !data.dateOfDeath;

  const [person] = await db
    .insert(persons)
    .values({
      treeId: tree.id,
      firstName: data.firstName,
      middleName: data.middleName ?? null,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ?? null,
      dateOfDeath: data.dateOfDeath ?? null,
      isAlive,
      gotra: data.gotra ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      bio: data.bio ?? null,
    })
    .returning();

  await db.update(trees).set({ memberCount: tree.memberCount + 1 }).where(eq(trees.id, tree.id));

  await auditService.logChange({
    treeId: tree.id,
    personId: person.id,
    userId,
    action: 'create',
    entityType: 'person',
    entityId: person.id,
    newValue: { firstName: person.firstName, lastName: person.lastName },
  });

  await notificationService.createNotificationsForTreeMembers({
    treeId: tree.id,
    excludeUserId: userId,
    type: 'person_added',
    title: 'Person Added',
    message: `${data.firstName} ${data.lastName} was added to the tree`,
    linkUrl: `/trees/${slug}`,
  });

  // Trigger cross-tree duplicate detection (fire-and-forget)
  matchingService
    .findMatches({
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gotra: data.gotra,
    })
    .then((matches) => {
      const crossTreeMatches = matches.filter((m) => m.treeId !== tree.id);
      if (crossTreeMatches.length > 0) {
        const best = crossTreeMatches[0];
        notificationService.createNotificationsForTreeMembers({
          treeId: tree.id,
          type: 'duplicate_detected',
          title: 'Potential Duplicate Found',
          message: `${data.firstName} ${data.lastName} may already exist in "${best.treeName}"`,
          linkUrl: `/trees/${best.treeSlug}`,
        });
      }
    })
    .catch(() => {});

  return person;
}

export async function updatePerson(
  personId: string,
  data: Partial<{
    firstName: string;
    middleName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth: Date;
    dateOfDeath: Date;
    gotra: string;
    phone: string;
    email: string;
    bio: string;
    photoKey: string;
  }>,
  userId: string
) {
  const [person] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  if (!person) throw new NotFoundError('Person', personId);

  await verifyTreeMember(person.treeId, userId);

  const updateData: Record<string, unknown> = { ...data };
  if (data.dateOfDeath !== undefined) {
    updateData.isAlive = !data.dateOfDeath;
  }

  const [updated] = await db
    .update(persons)
    .set(updateData)
    .where(eq(persons.id, personId))
    .returning();

  await auditService.logChange({
    treeId: person.treeId,
    personId: person.id,
    userId,
    action: 'update',
    entityType: 'person',
    entityId: person.id,
    oldValue: person,
    newValue: data,
  });

  return updated;
}

export async function getPerson(personId: string) {
  const [person] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  if (!person) throw new NotFoundError('Person', personId);

  const rels = await db
    .select()
    .from(relationships)
    .where(eq(relationships.personId1, personId));

  const rels2 = await db
    .select()
    .from(relationships)
    .where(eq(relationships.personId2, personId));

  return { ...person, relationships: [...rels, ...rels2] };
}

export async function listPersonsByTree(slug: string, page: number, limit: number) {
  const [tree] = await db.select().from(trees).where(eq(trees.slug, slug)).limit(1);
  if (!tree) throw new NotFoundError('Tree', slug);

  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(persons)
      .where(eq(persons.treeId, tree.id))
      .limit(limit)
      .offset(offset)
      .orderBy(persons.lastName),
    db.select({ total: count() }).from(persons).where(eq(persons.treeId, tree.id)),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}

export async function requestDeletion(personId: string, reason: string, userId: string) {
  const [person] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  if (!person) throw new NotFoundError('Person', personId);

  await verifyTreeMember(person.treeId, userId);

  const [request] = await db
    .insert(deletionRequests)
    .values({
      personId,
      treeId: person.treeId,
      requestedById: userId,
      reason,
    })
    .returning();

  return request;
}

export async function getPersonTimeline(personId: string, page: number, limit: number) {
  const [person] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  if (!person) throw new NotFoundError('Person', personId);

  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        oldValue: auditLogs.oldValue,
        newValue: auditLogs.newValue,
        createdAt: auditLogs.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.personId, personId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(auditLogs).where(eq(auditLogs.personId, personId)),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    },
  };
}
