import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { trees } from './trees.schema';
import { users } from './auth.schema';
import { genderEnum, relationshipTypeEnum } from './enums';

export const persons = pgTable(
  'persons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    treeId: uuid('tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    middleName: varchar('middle_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    gender: genderEnum('gender').notNull(),
    dateOfBirth: timestamp('date_of_birth', { withTimezone: true, mode: 'date' }),
    dateOfDeath: timestamp('date_of_death', { withTimezone: true, mode: 'date' }),
    isAlive: boolean('is_alive').notNull().default(true),
    gotra: varchar('gotra', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    photoKey: varchar('photo_key', { length: 255 }),
    bio: text('bio'),
    claimedByUserId: uuid('claimed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('persons_tree_id_idx').on(table.treeId),
    index('persons_tree_lastname_idx').on(table.treeId, table.lastName),
  ]
);

export const relationships = pgTable(
  'relationships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    treeId: uuid('tree_id')
      .notNull()
      .references(() => trees.id, { onDelete: 'cascade' }),
    personId1: uuid('person_id_1')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    personId2: uuid('person_id_2')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    relationshipType: relationshipTypeEnum('relationship_type').notNull(),
    marriageDate: timestamp('marriage_date', { withTimezone: true, mode: 'date' }),
    divorceDate: timestamp('divorce_date', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('relationships_persons_idx').on(table.personId1, table.personId2),
    index('relationships_tree_id_idx').on(table.treeId),
  ]
);

export const personsRelations = relations(persons, ({ one, many }) => ({
  tree: one(trees, { fields: [persons.treeId], references: [trees.id] }),
  claimedBy: one(users, { fields: [persons.claimedByUserId], references: [users.id] }),
  relationshipsAsP1: many(relationships, { relationName: 'person1' }),
  relationshipsAsP2: many(relationships, { relationName: 'person2' }),
}));

export const relationshipsRelations = relations(relationships, ({ one }) => ({
  tree: one(trees, { fields: [relationships.treeId], references: [trees.id] }),
  person1: one(persons, {
    fields: [relationships.personId1],
    references: [persons.id],
    relationName: 'person1',
  }),
  person2: one(persons, {
    fields: [relationships.personId2],
    references: [persons.id],
    relationName: 'person2',
  }),
}));
