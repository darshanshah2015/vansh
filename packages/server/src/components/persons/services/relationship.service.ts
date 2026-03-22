import { eq, and, or } from 'drizzle-orm';
import { db } from '@db/index';
import { relationships, persons } from '@db/schema/index';
import { ValidationError, NotFoundError } from '../../../shared/errors/index';
import * as auditService from '../../../shared/services/audit.service';

export async function addRelationship(
  slug: string,
  data: {
    personId1: string;
    personId2: string;
    relationshipType:
      | 'parent_child'
      | 'spouse'
      | 'step_parent_child'
      | 'adoptive_parent_child'
      | 'half_sibling';
    marriageDate?: Date;
    divorceDate?: Date;
  },
  userId: string
) {
  if (data.personId1 === data.personId2) {
    throw new ValidationError('A person cannot have a relationship with themselves');
  }

  const [p1, p2] = await Promise.all([
    db.select().from(persons).where(eq(persons.id, data.personId1)).limit(1),
    db.select().from(persons).where(eq(persons.id, data.personId2)).limit(1),
  ]);

  if (!p1[0]) throw new NotFoundError('Person', data.personId1);
  if (!p2[0]) throw new NotFoundError('Person', data.personId2);
  if (p1[0].treeId !== p2[0].treeId) {
    throw new ValidationError('Both persons must be in the same tree');
  }

  // Check for duplicate relationship
  const existing = await db
    .select()
    .from(relationships)
    .where(
      and(
        eq(relationships.relationshipType, data.relationshipType),
        or(
          and(
            eq(relationships.personId1, data.personId1),
            eq(relationships.personId2, data.personId2)
          ),
          and(
            eq(relationships.personId1, data.personId2),
            eq(relationships.personId2, data.personId1)
          )
        )
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ValidationError('This relationship already exists');
  }

  // Circular parent check for parent_child
  if (data.relationshipType === 'parent_child') {
    const isCircular = await checkCircularParent(data.personId2, data.personId1);
    if (isCircular) {
      throw new ValidationError('This would create a circular parent chain');
    }
  }

  const [rel] = await db
    .insert(relationships)
    .values({
      treeId: p1[0].treeId,
      personId1: data.personId1,
      personId2: data.personId2,
      relationshipType: data.relationshipType,
      marriageDate: data.marriageDate ?? null,
      divorceDate: data.divorceDate ?? null,
    })
    .returning();

  await auditService.logChange({
    treeId: p1[0].treeId,
    userId,
    action: 'create',
    entityType: 'relationship',
    entityId: rel.id,
    newValue: {
      personId1: data.personId1,
      personId2: data.personId2,
      type: data.relationshipType,
    },
  });

  return rel;
}

async function checkCircularParent(childId: string, potentialParentId: string): Promise<boolean> {
  // Walk up the parent chain from potentialParentId; if we reach childId, it's circular
  const visited = new Set<string>();
  const queue = [potentialParentId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === childId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    // Find parents of current (current is personId2 in parent_child where personId1 is parent)
    const parentRels = await db
      .select({ parentId: relationships.personId1 })
      .from(relationships)
      .where(
        and(
          eq(relationships.personId2, current),
          eq(relationships.relationshipType, 'parent_child')
        )
      );

    for (const rel of parentRels) {
      queue.push(rel.parentId);
    }
  }

  return false;
}

export async function removeRelationship(relationshipId: string, userId: string) {
  const [rel] = await db
    .select()
    .from(relationships)
    .where(eq(relationships.id, relationshipId))
    .limit(1);
  if (!rel) throw new NotFoundError('Relationship', relationshipId);

  await db.delete(relationships).where(eq(relationships.id, relationshipId));

  await auditService.logChange({
    treeId: rel.treeId,
    userId,
    action: 'delete',
    entityType: 'relationship',
    entityId: rel.id,
    oldValue: rel,
  });
}

export async function getRelationshipsForPerson(personId: string) {
  const directRels = await db
    .select()
    .from(relationships)
    .where(
      or(eq(relationships.personId1, personId), eq(relationships.personId2, personId))
    );

  // Derive siblings from shared parents
  const parentRels = directRels.filter(
    (r) => r.relationshipType === 'parent_child' && r.personId2 === personId
  );
  const parentIds = parentRels.map((r) => r.personId1);

  let derivedSiblings: string[] = [];
  for (const parentId of parentIds) {
    const childRels = await db
      .select({ childId: relationships.personId2 })
      .from(relationships)
      .where(
        and(
          eq(relationships.personId1, parentId),
          eq(relationships.relationshipType, 'parent_child')
        )
      );
    derivedSiblings.push(...childRels.map((r) => r.childId).filter((id) => id !== personId));
  }
  derivedSiblings = [...new Set(derivedSiblings)];

  // Derive in-laws from spouse + parent links
  const spouseRels = directRels.filter((r) => r.relationshipType === 'spouse');
  const spouseIds = spouseRels.map((r) =>
    r.personId1 === personId ? r.personId2 : r.personId1
  );

  const derivedInLaws: { personId: string; through: string }[] = [];
  for (const spouseId of spouseIds) {
    const spouseParentRels = await db
      .select({ parentId: relationships.personId1 })
      .from(relationships)
      .where(
        and(
          eq(relationships.personId2, spouseId),
          eq(relationships.relationshipType, 'parent_child')
        )
      );
    for (const rel of spouseParentRels) {
      derivedInLaws.push({ personId: rel.parentId, through: spouseId });
    }
  }

  return {
    direct: directRels,
    derivedSiblings,
    derivedInLaws,
  };
}
