import { pgTable, uuid, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth.schema';
import { trees } from './trees.schema';
import { auditActionEnum } from './enums';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    treeId: uuid('tree_id').references(() => trees.id, { onDelete: 'cascade' }),
    personId: uuid('person_id'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: auditActionEnum('action').notNull(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [index('audit_logs_tree_created_idx').on(table.treeId, table.createdAt)]
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tree: one(trees, { fields: [auditLogs.treeId], references: [trees.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
