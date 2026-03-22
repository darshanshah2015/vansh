import { z } from 'zod';

export const revertChangeSchema = z.object({
  reason: z.string().max(500).optional(),
});
