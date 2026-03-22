import { pgTable, uuid, varchar, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth.schema';
import { treeMemberStatusEnum } from './enums';

export const trees = pgTable(
  'trees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: varchar('description', { length: 1000 }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    memberCount: integer('member_count').notNull().default(0),
    generationCount: integer('generation_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('trees_slug_idx').on(table.slug)]
);

export const treeMembers = pgTable(
  'tree_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    treeId: uuid('tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: treeMemberStatusEnum('status').notNull().default('active'),
    joinedAt: timestamp('joined_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tree_members_tree_user_idx').on(table.treeId, table.userId),
  ]
);

export const treesRelations = relations(trees, ({ one, many }) => ({
  createdBy: one(users, { fields: [trees.createdById], references: [users.id] }),
  members: many(treeMembers),
}));

export const treeMembersRelations = relations(treeMembers, ({ one }) => ({
  tree: one(trees, { fields: [treeMembers.treeId], references: [trees.id] }),
  user: one(users, { fields: [treeMembers.userId], references: [users.id] }),
}));
