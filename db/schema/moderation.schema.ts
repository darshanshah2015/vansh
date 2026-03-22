import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth.schema';
import { trees } from './trees.schema';
import { persons } from './persons.schema';
import { deletionStatusEnum } from './enums';

export const deletionRequests = pgTable(
  'deletion_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    treeId: uuid('tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    requestedById: uuid('requested_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    status: deletionStatusEnum('status').notNull().default('pending'),
    reviewedById: uuid('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
    reviewNote: text('review_note'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('deletion_requests_status_idx').on(table.status),
    index('deletion_requests_tree_idx').on(table.treeId),
  ]
);

export const deletionRequestsRelations = relations(deletionRequests, ({ one }) => ({
  person: one(persons, { fields: [deletionRequests.personId], references: [persons.id] }),
  tree: one(trees, { fields: [deletionRequests.treeId], references: [trees.id] }),
  requestedBy: one(users, { fields: [deletionRequests.requestedById], references: [users.id] }),
  reviewedBy: one(users, { fields: [deletionRequests.reviewedById], references: [users.id] }),
}));
