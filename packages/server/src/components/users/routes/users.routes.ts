import { Router } from 'express';
import multer from 'multer';
import { validateBody, validateQuery } from '../../../middleware/validate.middleware';
import { requireAuth, requireAdmin } from '../../../middleware/auth.middleware';
import { updateProfileSchema, changePasswordSchema, listUsersSchema } from '../validation/users.validation';
import * as usersController from '../controllers/users.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const userRoutes = Router();

userRoutes.get('/profile', requireAuth, usersController.getProfile);
userRoutes.patch('/profile', requireAuth, validateBody(updateProfileSchema), usersController.updateProfile);
userRoutes.post('/change-password', requireAuth, validateBody(changePasswordSchema), usersController.changePassword);
userRoutes.post('/verification/upload', requireAuth, upload.single('aadhaar'), usersController.uploadAadhaar);
userRoutes.get('/', requireAuth, requireAdmin, validateQuery(listUsersSchema), usersController.listUsers);
userRoutes.get('/:id/aadhaar', requireAuth, requireAdmin, usersController.getAadhaarPhoto);
userRoutes.get('/:id', requireAuth, requireAdmin, usersController.getUserById);
