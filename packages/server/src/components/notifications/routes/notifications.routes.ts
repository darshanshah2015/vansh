import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.middleware';
import * as notificationsController from '../controllers/notifications.controller';

export const notificationRoutes = Router();

notificationRoutes.get('/', requireAuth, notificationsController.getNotifications);
notificationRoutes.get('/unread-count', requireAuth, notificationsController.getUnreadCount);
notificationRoutes.patch('/:id/read', requireAuth, notificationsController.markAsRead);
notificationRoutes.post('/mark-all-read', requireAuth, notificationsController.markAllAsRead);
notificationRoutes.post('/mark-tree-read', requireAuth, notificationsController.markTreeGroupAsRead);
