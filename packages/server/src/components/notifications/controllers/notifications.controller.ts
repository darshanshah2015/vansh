import type { Request, Response } from 'express';
import * as notificationsService from '../services/notifications.service';

export async function getNotifications(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await notificationsService.getNotifications(req.user!.id, page, limit);
  res.json(result);
}

export async function getUnreadCount(req: Request, res: Response) {
  const count = await notificationsService.getUnreadCount(req.user!.id);
  res.json({ data: { count } });
}

export async function markAsRead(req: Request, res: Response) {
  await notificationsService.markAsRead(req.params.id as string, req.user!.id);
  res.status(204).send();
}

export async function markAllAsRead(req: Request, res: Response) {
  await notificationsService.markAllAsRead(req.user!.id);
  res.status(204).send();
}

export async function markTreeGroupAsRead(req: Request, res: Response) {
  await notificationsService.markTreeGroupAsRead(req.user!.id, req.body.treeId);
  res.status(204).send();
}
