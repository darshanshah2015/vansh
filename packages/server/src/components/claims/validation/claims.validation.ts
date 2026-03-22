import { z } from 'zod';

export const createClaimSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const reviewClaimSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNote: z.string().max(1000).optional(),
});
