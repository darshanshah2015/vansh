import { z } from 'zod';

export const createPersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.coerce.date().optional(),
  dateOfDeath: z.coerce.date().optional(),
  gotra: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
});

export const updatePersonSchema = createPersonSchema.partial();

export const deleteRequestSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const listPersonsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const createRelationshipSchema = z.object({
  personId1: z.string().uuid(),
  personId2: z.string().uuid(),
  relationshipType: z.enum([
    'parent_child',
    'spouse',
    'step_parent_child',
    'adoptive_parent_child',
    'half_sibling',
  ]),
  marriageDate: z.coerce.date().optional(),
  divorceDate: z.coerce.date().optional(),
});
