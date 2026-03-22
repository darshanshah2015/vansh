import { Router } from 'express';
import { validateBody } from '../../../middleware/validate.middleware';
import { authRateLimiter } from '../../../middleware/rate-limit.middleware';
import { requireAuth } from '../../../middleware/auth.middleware';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validation/auth.validation';
import * as authController from '../controllers/auth.controller';

export const authRoutes = Router();

authRoutes.post('/signup', authRateLimiter, validateBody(signupSchema), authController.signup);
authRoutes.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
authRoutes.post('/logout', authController.logout);
authRoutes.get('/me', requireAuth, authController.me);
authRoutes.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
authRoutes.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);
