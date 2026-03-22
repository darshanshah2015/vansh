import { eq, and, count, desc, ne, lt, or, sql } from 'drizzle-orm';
import { db } from '@db/index';
import {
  mergeProposals,
  mergeProposalMappings,
  persons,
  relationships,
  trees,
  treeMembers,
  users,
} from '@db/schema/index';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../shared/errors/index';
import * as auditService from '../../../shared/services/audit.service';
import * as notificationService from '../../../shared/services/notification.service';
import * as matchingService from '../../../shared/services/matching.service';

export async function createMergeProposal(
  sourceTreeId: string,
  targetTreeId: string,
  userId: string,
  reason?: string
) {
  if (sourceTreeId === targetTreeId) {
    throw new ConflictError('Cannot merge a tree with itself');
  }

  const [sourceTree] = await db.select().from(trees).where(eq(trees.id, sourceTreeId)).limit(1);
  if (!sourceTree) throw new NotFoundError('Tree', sourceTreeId);

  const [targetTree] = await db.select().from(trees).where(eq(trees.id, targetTreeId)).limit(1);
  if (!targetTree) throw new NotFoundError('Tree', targetTreeId);

  // Verify user is a member of the source tree
  const member = await db.query.treeMembers.findFirst({
    where: and(eq(treeMembers.treeId, sourceTreeId), eq(treeMembers.userId, userId)),
  });
  if (!member) throw new ForbiddenError('You must be a member of the source tree');

  // Check no active merge proposal between these trees
  const existing = await db
    .select()
    .from(mergeProposals)
    .where(
      and(
        or(
          and(
            eq(mergeProposals.sourceTreeId, sourceTreeId),
            eq(mergeProposals.targetTreeId, targetTreeId)
          ),
          and(
            eq(mergeProposals.sourceTreeId, targetTreeId),
            eq(mergeProposals.targetTreeId, sourceTreeId)
          )
        ),
        or(eq(mergeProposals.status, 'proposed'), eq(mergeProposals.status, 'under_review'))
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError('An active merge proposal already exists between these trees');
  }

  const [proposal] = await db
    .insert(mergeProposals)
    .values({
      sourceTreeId,
      targetTreeId,
      proposedById: userId,
      reason: reason ?? null,
    })
    .returning();

  // Notify both trees' members
  await notificationService.createNotificationsForTreeMembers({
    treeId: sourceTreeId,
    excludeUserId: userId,
    type: 'merge_proposed',
    title: 'Merge Proposal',
    message: `A merge has been proposed between "${sourceTree.name}" and "${targetTree.name}"`,
    linkUrl: `/merge/${proposal.id}`,
  });

  await notificationService.createNotificationsForTreeMembers({
    treeId: targetTreeId,
    type: 'merge_proposed',
    title: 'Merge Proposal',
    message: `A merge has been proposed between "${sourceTree.name}" and "${targetTree.name}"`,
    linkUrl: `/merge/${proposal.id}`,
  });

  await auditService.logChange({
    treeId: sourceTreeId,
    userId,
    action: 'merge',
    entityType: 'merge_proposal',
    entityId: proposal.id,
    newValue: { sourceTreeId, targetTreeId, status: 'proposed' },
  });

  return proposal;
}

export async function addMapping(
  proposalId: string,
  sourcePersonId: string,
  targetPersonId: string,
  userId: string
) {
  const proposal = await getProposalOrThrow(proposalId);
  verifyProposalActive(proposal);

  // Verify persons belong to correct trees
  const [sourcePerson] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, sourcePersonId), eq(persons.treeId, proposal.sourceTreeId)))
    .limit(1);
  if (!sourcePerson) throw new NotFoundError('Source person not found in source tree');

  const [targetPerson] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, targetPersonId), eq(persons.treeId, proposal.targetTreeId)))
    .limit(1);
  if (!targetPerson) throw new NotFoundError('Target person not found in target tree');

  // Check for duplicate mapping
  const existingMapping = await db
    .select()
    .from(mergeProposalMappings)
    .where(
      and(
        eq(mergeProposalMappings.proposalId, proposalId),
        eq(mergeProposalMappings.sourcePersonId, sourcePersonId)
      )
    )
    .limit(1);

  if (existingMapping.length > 0) {
    throw new ConflictError('A mapping already exists for this source person');
  }

  const [mapping] = await db
    .insert(mergeProposalMappings)
    .values({ proposalId, sourcePersonId, targetPersonId })
    .returning();

  // Move to under_review if first mapping
  if (proposal.status === 'proposed') {
    await db
      .update(mergeProposals)
      .set({ status: 'under_review' })
      .where(eq(mergeProposals.id, proposalId));
  }

  return mapping;
}

export async function removeMapping(proposalId: string, mappingId: string, userId: string) {
  const proposal = await getProposalOrThrow(proposalId);
  verifyProposalActive(proposal);

  const [deleted] = await db
    .delete(mergeProposalMappings)
    .where(
      and(
        eq(mergeProposalMappings.id, mappingId),
        eq(mergeProposalMappings.proposalId, proposalId)
      )
    )
    .returning();

  if (!deleted) throw new NotFoundError('Mapping', mappingId);
  return deleted;
}

export async function setConflictResolution(
  proposalId: string,
  mappingId: string,
  resolution: string,
  userId: string
) {
  const proposal = await getProposalOrThrow(proposalId);
  verifyProposalActive(proposal);

  const [updated] = await db
    .update(mergeProposalMappings)
    .set({ resolution })
    .where(
      and(
        eq(mergeProposalMappings.id, mappingId),
        eq(mergeProposalMappings.proposalId, proposalId)
      )
    )
    .returning();

  if (!updated) throw new NotFoundError('Mapping', mappingId);
  return updated;
}

export async function autoDetectMappings(proposalId: string) {
  const proposal = await getProposalOrThrow(proposalId);

  // Get all persons from both trees
  const sourcePersons = await db
    .select()
    .from(persons)
    .where(eq(persons.treeId, proposal.sourceTreeId));

  const targetPersons = await db
    .select()
    .from(persons)
    .where(eq(persons.treeId, proposal.targetTreeId));

  // Get existing mappings to exclude
  const existingMappings = await db
    .select()
    .from(mergeProposalMappings)
    .where(eq(mergeProposalMappings.proposalId, proposalId));

  const mappedSourceIds = new Set(existingMappings.map((m) => m.sourcePersonId));
  const mappedTargetIds = new Set(
    existingMappings.map((m) => m.targetPersonId).filter(Boolean) as string[]
  );

  const newMappings: Array<{ sourcePersonId: string; targetPersonId: string; confidence: number }> =
    [];

  for (const sp of sourcePersons) {
    if (mappedSourceIds.has(sp.id)) continue;

    for (const tp of targetPersons) {
      if (mappedTargetIds.has(tp.id)) continue;

      const matches = await matchingService.findMatches({
        firstName: sp.firstName,
        lastName: sp.lastName,
        dateOfBirth: sp.dateOfBirth,
        gotra: sp.gotra,
      });

      const match = matches.find((m) => m.personId === tp.id);
      if (match && match.confidence >= 60) {
        newMappings.push({
          sourcePersonId: sp.id,
          targetPersonId: tp.id,
          confidence: match.confidence,
        });
        mappedTargetIds.add(tp.id);
        break;
      }
    }
  }

  // Insert auto-detected mappings
  const inserted = [];
  for (const m of newMappings) {
    const [mapping] = await db
      .insert(mergeProposalMappings)
      .values({
        proposalId,
        sourcePersonId: m.sourcePersonId,
        targetPersonId: m.targetPersonId,
        resolution: JSON.stringify({ autoDetected: true, confidence: m.confidence }),
      })
      .returning();
    inserted.push(mapping);
  }

  return inserted;
}

export async function approveMerge(proposalId: string, userId: string, side: 'source' | 'target') {
  const proposal = await getProposalOrThrow(proposalId);

  if (proposal.status !== 'under_review' && proposal.status !== 'proposed') {
    throw new ConflictError('This proposal is not in a reviewable state');
  }

  // Verify user is member of the correct tree
  const treeId = side === 'source' ? proposal.sourceTreeId : proposal.targetTreeId;
  const member = await db.query.treeMembers.findFirst({
    where: and(eq(treeMembers.treeId, treeId), eq(treeMembers.userId, userId)),
  });
  if (!member) throw new ForbiddenError(`You must be a member of the ${side} tree`);

  // Store approval in reviewNote as JSON (both sides need to approve)
  const currentNote = proposal.reviewNote ? JSON.parse(proposal.reviewNote) : {};
  currentNote[side] = { userId, approvedAt: new Date().toISOString() };

  const bothApproved = currentNote.source && currentNote.target;

  await db
    .update(mergeProposals)
    .set({
      reviewNote: JSON.stringify(currentNote),
      status: bothApproved ? 'approved' : 'under_review',
      reviewedById: userId,
      reviewedAt: bothApproved ? new Date() : null,
    })
    .where(eq(mergeProposals.id, proposalId));

  if (bothApproved) {
    await executeMerge(proposalId, userId);
  }

  return { approved: bothApproved, side, currentApprovals: currentNote };
}

export async function executeMerge(proposalId: string, userId: string) {
  const proposal = await getProposalOrThrow(proposalId);

  const mappings = await db
    .select()
    .from(mergeProposalMappings)
    .where(eq(mergeProposalMappings.proposalId, proposalId));

  const [targetTree] = await db
    .select()
    .from(trees)
    .where(eq(trees.id, proposal.targetTreeId))
    .limit(1);

  // Move unmapped source persons to target tree
  const mappedSourceIds = mappings.map((m) => m.sourcePersonId);
  const unmappedPersons = await db
    .select()
    .from(persons)
    .where(eq(persons.treeId, proposal.sourceTreeId));

  for (const person of unmappedPersons) {
    if (!mappedSourceIds.includes(person.id)) {
      await db
        .update(persons)
        .set({ treeId: proposal.targetTreeId })
        .where(eq(persons.id, person.id));
    }
  }

  // For mapped persons, apply conflict resolutions and remove source duplicates
  for (const mapping of mappings) {
    if (!mapping.targetPersonId) continue;

    if (mapping.resolution) {
      try {
        const res = JSON.parse(mapping.resolution);
        if (res.fields) {
          await db
            .update(persons)
            .set(res.fields)
            .where(eq(persons.id, mapping.targetPersonId));
        }
      } catch {
        // Non-JSON resolution, skip
      }
    }

    // Move relationships from source person to target person
    await db
      .update(relationships)
      .set({ personId1: mapping.targetPersonId })
      .where(
        and(
          eq(relationships.personId1, mapping.sourcePersonId),
          eq(relationships.treeId, proposal.sourceTreeId)
        )
      );

    await db
      .update(relationships)
      .set({ personId2: mapping.targetPersonId })
      .where(
        and(
          eq(relationships.personId2, mapping.sourcePersonId),
          eq(relationships.treeId, proposal.sourceTreeId)
        )
      );

    // Delete the source duplicate
    await db.delete(persons).where(eq(persons.id, mapping.sourcePersonId));
  }

  // Move remaining relationships to target tree
  await db
    .update(relationships)
    .set({ treeId: proposal.targetTreeId })
    .where(eq(relationships.treeId, proposal.sourceTreeId));

  // Move source tree members to target tree
  const sourceMembers = await db
    .select()
    .from(treeMembers)
    .where(eq(treeMembers.treeId, proposal.sourceTreeId));

  for (const member of sourceMembers) {
    const existing = await db.query.treeMembers.findFirst({
      where: and(
        eq(treeMembers.treeId, proposal.targetTreeId),
        eq(treeMembers.userId, member.userId)
      ),
    });
    if (!existing) {
      await db.insert(treeMembers).values({
        treeId: proposal.targetTreeId,
        userId: member.userId,
        status: member.status,
      });
    }
  }

  // Update target tree stats
  const [personCount] = await db
    .select({ total: count() })
    .from(persons)
    .where(eq(persons.treeId, proposal.targetTreeId));

  await db
    .update(trees)
    .set({ memberCount: Number(personCount.total) })
    .where(eq(trees.id, proposal.targetTreeId));

  // Mark proposal as completed
  await db
    .update(mergeProposals)
    .set({ status: 'completed', completedAt: new Date() })
    .where(eq(mergeProposals.id, proposalId));

  // Audit log
  await auditService.logChange({
    treeId: proposal.targetTreeId,
    userId,
    action: 'merge',
    entityType: 'merge_proposal',
    entityId: proposalId,
    newValue: {
      status: 'completed',
      sourceTreeId: proposal.sourceTreeId,
      targetTreeId: proposal.targetTreeId,
      mappingCount: mappings.length,
    },
  });

  // Notify all members of merged tree
  await notificationService.createNotificationsForTreeMembers({
    treeId: proposal.targetTreeId,
    type: 'merge_completed',
    title: 'Trees Merged',
    message: `The tree merge has been completed. All members are now part of "${targetTree.name}".`,
    linkUrl: `/trees/${targetTree.slug}`,
  });
}

export async function getMergeProposal(proposalId: string) {
  const [proposal] = await db
    .select({
      id: mergeProposals.id,
      sourceTreeId: mergeProposals.sourceTreeId,
      targetTreeId: mergeProposals.targetTreeId,
      proposedById: mergeProposals.proposedById,
      status: mergeProposals.status,
      reason: mergeProposals.reason,
      reviewNote: mergeProposals.reviewNote,
      reviewedAt: mergeProposals.reviewedAt,
      completedAt: mergeProposals.completedAt,
      createdAt: mergeProposals.createdAt,
    })
    .from(mergeProposals)
    .where(eq(mergeProposals.id, proposalId))
    .limit(1);

  if (!proposal) throw new NotFoundError('Merge proposal', proposalId);

  // Get tree names
  const [sourceTree] = await db
    .select({ name: trees.name, slug: trees.slug })
    .from(trees)
    .where(eq(trees.id, proposal.sourceTreeId))
    .limit(1);

  const [targetTree] = await db
    .select({ name: trees.name, slug: trees.slug })
    .from(trees)
    .where(eq(trees.id, proposal.targetTreeId))
    .limit(1);

  // Get proposer info
  const [proposer] = await db
    .select({ firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, proposal.proposedById))
    .limit(1);

  // Get mappings with person info
  const mappings = await db
    .select({
      id: mergeProposalMappings.id,
      sourcePersonId: mergeProposalMappings.sourcePersonId,
      targetPersonId: mergeProposalMappings.targetPersonId,
      resolution: mergeProposalMappings.resolution,
    })
    .from(mergeProposalMappings)
    .where(eq(mergeProposalMappings.proposalId, proposalId));

  // Get persons from both trees
  const sourcePersons = await db
    .select({
      id: persons.id,
      firstName: persons.firstName,
      lastName: persons.lastName,
      dateOfBirth: persons.dateOfBirth,
      gotra: persons.gotra,
      gender: persons.gender,
    })
    .from(persons)
    .where(eq(persons.treeId, proposal.sourceTreeId));

  const targetPersons = await db
    .select({
      id: persons.id,
      firstName: persons.firstName,
      lastName: persons.lastName,
      dateOfBirth: persons.dateOfBirth,
      gotra: persons.gotra,
      gender: persons.gender,
    })
    .from(persons)
    .where(eq(persons.treeId, proposal.targetTreeId));

  return {
    ...proposal,
    sourceTree: sourceTree ?? null,
    targetTree: targetTree ?? null,
    proposer: proposer ?? null,
    mappings,
    sourcePersons,
    targetPersons,
    approvals: proposal.reviewNote ? JSON.parse(proposal.reviewNote) : {},
  };
}

export async function listMergeProposals(page: number, limit: number) {
  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: mergeProposals.id,
        sourceTreeId: mergeProposals.sourceTreeId,
        targetTreeId: mergeProposals.targetTreeId,
        proposedById: mergeProposals.proposedById,
        status: mergeProposals.status,
        reason: mergeProposals.reason,
        createdAt: mergeProposals.createdAt,
      })
      .from(mergeProposals)
      .orderBy(desc(mergeProposals.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(mergeProposals),
  ]);

  return {
    items,
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
  };
}

export async function getMergeProposalsByTree(slug: string, page: number, limit: number) {
  const [tree] = await db.select().from(trees).where(eq(trees.slug, slug)).limit(1);
  if (!tree) throw new NotFoundError('Tree', slug);

  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: mergeProposals.id,
        sourceTreeId: mergeProposals.sourceTreeId,
        targetTreeId: mergeProposals.targetTreeId,
        proposedById: mergeProposals.proposedById,
        status: mergeProposals.status,
        reason: mergeProposals.reason,
        createdAt: mergeProposals.createdAt,
        completedAt: mergeProposals.completedAt,
      })
      .from(mergeProposals)
      .where(
        or(eq(mergeProposals.sourceTreeId, tree.id), eq(mergeProposals.targetTreeId, tree.id))
      )
      .orderBy(desc(mergeProposals.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(mergeProposals)
      .where(
        or(eq(mergeProposals.sourceTreeId, tree.id), eq(mergeProposals.targetTreeId, tree.id))
      ),
  ]);

  return {
    items,
    pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
  };
}

export async function findDuplicatesAcrossTrees(personId: string) {
  const [person] = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  if (!person) return [];

  const matches = await matchingService.findMatches({
    firstName: person.firstName,
    lastName: person.lastName,
    dateOfBirth: person.dateOfBirth,
    gotra: person.gotra,
  });

  // Filter out matches from the same tree
  return matches.filter((m) => m.treeId !== person.treeId);
}

export async function expireStaleProposals() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const expired = await db
    .update(mergeProposals)
    .set({ status: 'rejected', reviewNote: JSON.stringify({ expired: true }) })
    .where(
      and(
        or(eq(mergeProposals.status, 'proposed'), eq(mergeProposals.status, 'under_review')),
        lt(mergeProposals.createdAt, thirtyDaysAgo)
      )
    )
    .returning();

  return expired.length;
}

// Helpers
async function getProposalOrThrow(proposalId: string) {
  const [proposal] = await db
    .select()
    .from(mergeProposals)
    .where(eq(mergeProposals.id, proposalId))
    .limit(1);
  if (!proposal) throw new NotFoundError('Merge proposal', proposalId);
  return proposal;
}

function verifyProposalActive(proposal: { status: string }) {
  if (proposal.status !== 'proposed' && proposal.status !== 'under_review') {
    throw new ConflictError('This merge proposal is no longer active');
  }
}
