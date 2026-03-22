import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth.schema';
import { persons } from './persons.schema';
import { trees } from './trees.schema';
import { claimStatusEnum } from './enums';

export const claims = pgTable(
  'claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    treeId: uuid('tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    status: claimStatusEnum('status').notNull().default('pending'),
    reason: text('reason'),
    reviewedById: uuid('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
    reviewNote: text('review_note'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    autoApproveAt: timestamp('auto_approve_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('claims_person_id_idx').on(table.personId),
    index('claims_user_id_idx').on(table.userId),
    index('claims_status_idx').on(table.status),
  ]
);

export const claimsRelations = relations(claims, ({ one }) => ({
  person: one(persons, { fields: [claims.personId], references: [persons.id] }),
  user: one(users, { fields: [claims.userId], references: [users.id] }),
  tree: one(trees, { fields: [claims.treeId], references: [trees.id] }),
  reviewedBy: one(users, { fields: [claims.reviewedById], references: [users.id] }),
}));
