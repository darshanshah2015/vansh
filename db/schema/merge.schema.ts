import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth.schema';
import { trees } from './trees.schema';
import { persons } from './persons.schema';
import { mergeStatusEnum } from './enums';

export const mergeProposals = pgTable(
  'merge_proposals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceTreeId: uuid('source_tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    targetTreeId: uuid('target_tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    proposedById: uuid('proposed_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: mergeStatusEnum('status').notNull().default('proposed'),
    reason: text('reason'),
    reviewedById: uuid('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
    reviewNote: text('review_note'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('merge_proposals_source_tree_idx').on(table.sourceTreeId),
    index('merge_proposals_target_tree_idx').on(table.targetTreeId),
    index('merge_proposals_status_idx').on(table.status),
  ]
);

export const mergeProposalMappings = pgTable(
  'merge_proposal_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => mergeProposals.id, { onDelete: 'cascade' }),
    sourcePersonId: uuid('source_person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    targetPersonId: uuid('target_person_id').references(() => persons.id, {
      onDelete: 'set null',
    }),
    resolution: text('resolution'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [index('merge_mappings_proposal_idx').on(table.proposalId)]
);

export const mergeProposalsRelations = relations(mergeProposals, ({ one, many }) => ({
  sourceTree: one(trees, { fields: [mergeProposals.sourceTreeId], references: [trees.id] }),
  targetTree: one(trees, { fields: [mergeProposals.targetTreeId], references: [trees.id] }),
  proposedBy: one(users, { fields: [mergeProposals.proposedById], references: [users.id] }),
  reviewedBy: one(users, { fields: [mergeProposals.reviewedById], references: [users.id] }),
  mappings: many(mergeProposalMappings),
}));

export const mergeProposalMappingsRelations = relations(mergeProposalMappings, ({ one }) => ({
  proposal: one(mergeProposals, {
    fields: [mergeProposalMappings.proposalId],
    references: [mergeProposals.id],
  }),
  sourcePerson: one(persons, {
    fields: [mergeProposalMappings.sourcePersonId],
    references: [persons.id],
  }),
  targetPerson: one(persons, {
    fields: [mergeProposalMappings.targetPersonId],
    references: [persons.id],
  }),
}));
