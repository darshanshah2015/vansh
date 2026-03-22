import { z } from 'zod';

export const createMergeProposalSchema = z.object({
  sourceTreeId: z.string().uuid(),
  targetTreeId: z.string().uuid(),
  reason: z.string().max(1000).optional(),
});

export const addMappingSchema = z.object({
  sourcePersonId: z.string().uuid(),
  targetPersonId: z.string().uuid(),
});

export const resolveConflictSchema = z.object({
  resolution: z.string().max(5000),
});

export const approveMergeSchema = z.object({
  side: z.enum(['source', 'target']),
});
