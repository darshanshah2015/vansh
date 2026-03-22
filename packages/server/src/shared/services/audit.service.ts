import { db } from '@db/index';
import { auditLogs } from '@db/schema/index';

type DbOrTx = typeof db;

export async function logChange(params: {
  treeId?: string;
  personId?: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'claim' | 'merge' | 'revert';
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  tx?: DbOrTx;
}) {
  const executor = params.tx ?? db;
  await executor.insert(auditLogs).values({
    treeId: params.treeId ?? null,
    personId: params.personId ?? null,
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    oldValue: params.oldValue ?? null,
    newValue: params.newValue ?? null,
  });
}
