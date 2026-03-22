import { z } from 'zod';

export const createTreeSchema = z.object({
  name: z.string().min(1, 'Tree name is required').max(255),
  description: z.string().max(1000).optional(),
});

export const updateTreeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export const listTreesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  gotra: z.string().optional(),
});

export const getTreeBySlugSchema = z.object({
  slug: z.string().min(1),
});

const personDataSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.coerce.date().optional(),
});

export const createTreeFromWizardSchema = z.object({
  treeName: z.string().min(1).max(255),
  self: personDataSchema.extend({
    gotra: z.string().optional(),
  }),
  parents: z.array(personDataSchema).max(2).optional(),
  spouse: personDataSchema
    .extend({
      marriageDate: z.coerce.date().optional(),
    })
    .optional(),
  siblings: z.array(personDataSchema).max(20).optional(),
});

export const matchingSearchSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.coerce.date().optional(),
  gotra: z.string().optional(),
  parentNames: z.array(z.string()).optional(),
});
