import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateBody } from '../../../middleware/validate.middleware';
import { revertChangeSchema } from '../validation/audit.validation';
import * as auditController from '../controllers/audit.controller';

export const auditRoutes = Router();

auditRoutes.post('/:id/revert', requireAuth, validateBody(revertChangeSchema), auditController.revertChange);
