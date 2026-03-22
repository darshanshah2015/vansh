import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../../middleware/auth.middleware';
import { validateBody, validateQuery } from '../../../middleware/validate.middleware';
import {
  reviewVerificationSchema,
  changeRoleSchema,
  changeStatusSchema,
  reviewDeletionSchema,
  paginationSchema,
} from '../validation/admin.validation';
import * as adminController from '../controllers/admin.controller';

export const adminRoutes = Router();

// All admin routes require auth + admin role
adminRoutes.use(requireAuth, requireAdmin);

adminRoutes.get('/dashboard', adminController.getDashboard);
adminRoutes.get('/activity', adminController.getActivity);

// Verifications
adminRoutes.get('/verifications', validateQuery(paginationSchema), adminController.getVerifications);
adminRoutes.patch(
  '/verifications/:id',
  validateBody(reviewVerificationSchema),
  adminController.reviewVerification
);

// Users
adminRoutes.get('/users', validateQuery(paginationSchema), adminController.getUsers);
adminRoutes.patch('/users/:id/role', validateBody(changeRoleSchema), adminController.changeRole);
adminRoutes.post('/users/:id/reset-password', adminController.resetPassword);
adminRoutes.patch('/users/:id/status', validateBody(changeStatusSchema), adminController.changeStatus);

// Trees
adminRoutes.get('/trees', validateQuery(paginationSchema), adminController.getTrees);

// Deletions
adminRoutes.get('/deletions', validateQuery(paginationSchema), adminController.getDeletions);
adminRoutes.patch(
  '/deletions/:id',
  validateBody(reviewDeletionSchema),
  adminController.reviewDeletion
);

// Merges
adminRoutes.get('/merges', validateQuery(paginationSchema), adminController.getMerges);
