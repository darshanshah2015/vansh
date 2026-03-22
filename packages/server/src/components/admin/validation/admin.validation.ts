import { z } from 'zod';

export const reviewVerificationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reason: z.string().max(500).optional(),
});

export const changeRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

export const changeStatusSchema = z.object({
  isActive: z.boolean(),
});

export const reviewDeletionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNote: z.string().max(500).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});
