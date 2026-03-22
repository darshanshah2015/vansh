import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateBody } from '../../../middleware/validate.middleware';
import {
  createMergeProposalSchema,
  addMappingSchema,
  resolveConflictSchema,
  approveMergeSchema,
} from '../validation/merge.validation';
import * as mergeController from '../controllers/merge.controller';

export const mergeRoutes = Router();

mergeRoutes.post('/', requireAuth, validateBody(createMergeProposalSchema), mergeController.createMergeProposal);
mergeRoutes.get('/:id', requireAuth, mergeController.getMergeProposal);
mergeRoutes.post('/:id/mappings', requireAuth, validateBody(addMappingSchema), mergeController.addMapping);
mergeRoutes.delete('/:id/mappings/:mappingId', requireAuth, mergeController.removeMapping);
mergeRoutes.patch('/:id/mappings/:mappingId/resolve', requireAuth, validateBody(resolveConflictSchema), mergeController.resolveConflict);
mergeRoutes.post('/:id/approve', requireAuth, validateBody(approveMergeSchema), mergeController.approveMerge);
mergeRoutes.post('/:id/auto-detect', requireAuth, mergeController.autoDetectMappings);
