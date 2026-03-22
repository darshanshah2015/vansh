import { eq, and } from 'drizzle-orm';
import { db } from '@db/index';
import { auditLogs, persons, relationships, treeMembers } from '@db/schema/index';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../shared/errors/index';
import * as auditService from '../../../shared/services/audit.service';

export async function revertChange(auditLogId: string, userId: string, reason?: string) {
  const [entry] = await db.select().from(auditLogs).where(eq(auditLogs.id, auditLogId)).limit(1);
  if (!entry) throw new NotFoundError('Audit log entry', auditLogId);

  // Verify user is a verified tree member
  if (entry.treeId) {
    const member = await db.query.treeMembers.findFirst({
      where: and(eq(treeMembers.treeId, entry.treeId), eq(treeMembers.userId, userId)),
    });
    if (!member) throw new ForbiddenError('You must be a tree member to revert changes');
  }

  // Only update and delete actions can be reverted
  if (entry.action !== 'update' && entry.action !== 'delete') {
    throw new ConflictError(`Cannot revert a "${entry.action}" action`);
  }

  if (!entry.oldValue) {
    throw new ConflictError('No previous value to restore');
  }

  const oldValue = entry.oldValue as Record<string, unknown>;

  // Apply revert based on entity type
  switch (entry.entityType) {
    case 'person': {
      if (entry.action === 'update') {
        // Restore old field values
        const [existing] = await db
          .select()
          .from(persons)
          .where(eq(persons.id, entry.entityId))
          .limit(1);
        if (!existing) throw new NotFoundError('Person', entry.entityId);

        await db.update(persons).set(oldValue).where(eq(persons.id, entry.entityId));
      }
      break;
    }
    case 'relationship': {
      if (entry.action === 'delete' && oldValue) {
        // Re-create deleted relationship
        await db.insert(relationships).values({
          id: entry.entityId,
          ...oldValue,
        } as any);
      }
      break;
    }
    default:
      throw new ConflictError(`Reverting "${entry.entityType}" is not supported`);
  }

  // Log the revert action
  await auditService.logChange({
    treeId: entry.treeId ?? undefined,
    personId: entry.personId ?? undefined,
    userId,
    action: 'revert',
    entityType: entry.entityType,
    entityId: entry.entityId,
    oldValue: entry.newValue,
    newValue: entry.oldValue,
  });

  return { reverted: true, entityType: entry.entityType, entityId: entry.entityId };
}
