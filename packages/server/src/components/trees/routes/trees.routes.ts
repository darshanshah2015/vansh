import { Router } from 'express';
import { validateBody, validateQuery, validateParams } from '../../../middleware/validate.middleware';
import { requireAuth } from '../../../middleware/auth.middleware';
import { searchRateLimiter, createRateLimiter } from '../../../middleware/rate-limit.middleware';
import {
  createTreeSchema,
  updateTreeSchema,
  listTreesSchema,
  getTreeBySlugSchema,
  createTreeFromWizardSchema,
  matchingSearchSchema,
} from '../validation/trees.validation';
import * as treesController from '../controllers/trees.controller';

export const treeRoutes = Router();

treeRoutes.post('/', requireAuth, validateBody(createTreeSchema), treesController.createTree);
treeRoutes.get('/', searchRateLimiter, validateQuery(listTreesSchema), treesController.listTrees);
treeRoutes.get('/:slug', treesController.getTreeBySlug);
treeRoutes.patch('/:slug', requireAuth, validateBody(updateTreeSchema), treesController.updateTree);
treeRoutes.get('/:slug/stats', treesController.getTreeStats);
treeRoutes.get('/:slug/activity', treesController.getTreeActivity);
treeRoutes.get('/:slug/members', treesController.getTreeMembers);

// Tree claims
treeRoutes.get('/:slug/claims', requireAuth, async (req, res) => {
  const claimsController = await import('../../claims/controllers/claims.controller');
  return claimsController.getTreeClaims(req, res);
});

// Tree merge proposals
treeRoutes.get('/:slug/merge-proposals', requireAuth, async (req, res) => {
  const mergeController = await import('../../merge/controllers/merge.controller');
  return mergeController.getTreeMergeProposals(req, res);
});

// Wizard and matching
treeRoutes.post(
  '/wizard',
  requireAuth,
  validateBody(createTreeFromWizardSchema),
  treesController.createTreeFromWizard
);

const matchingRateLimiter = createRateLimiter(60 * 1000, 10);
treeRoutes.post(
  '/matching/search',
  requireAuth,
  matchingRateLimiter,
  validateBody(matchingSearchSchema),
  treesController.searchMatches
);
