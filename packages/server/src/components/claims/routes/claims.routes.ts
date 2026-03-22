import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateBody } from '../../../middleware/validate.middleware';
import { createClaimSchema, reviewClaimSchema } from '../validation/claims.validation';
import * as claimsController from '../controllers/claims.controller';

export const claimRoutes = Router();

claimRoutes.get('/my', requireAuth, claimsController.getMyClaims);
claimRoutes.patch('/:id', requireAuth, validateBody(reviewClaimSchema), (req, res) => {
  if (req.body.status === 'approved') {
    return claimsController.approveClaim(req, res);
  }
  return claimsController.rejectClaim(req, res);
});
