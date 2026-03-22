import type { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import * as usersService from '../../users/services/users.service';
import * as treesService from '../../trees/services/trees.service';

export async function getDashboard(req: Request, res: Response) {
  const stats = await adminService.getDashboardStats();
  res.json({ data: stats });
}

export async function getActivity(req: Request, res: Response) {
  const activity = await adminService.getRecentActivity(20);
  res.json({ data: activity });
}

export async function getVerifications(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await adminService.listVerificationRequests(page, limit);
  res.json(result);
}

export async function reviewVerification(req: Request, res: Response) {
  const { status, reason } = req.body;
  if (status === 'approved') {
    await adminService.approveVerification(req.params.id as string, req.user!.id);
  } else {
    await adminService.rejectVerification(req.params.id as string, req.user!.id, reason);
  }
  res.status(204).send();
}

export async function getUsers(req: Request, res: Response) {
  const result = await usersService.listUsers(req.query as any);
  res.json(result);
}

export async function changeRole(req: Request, res: Response) {
  await adminService.changeUserRole(req.params.id as string, req.body.role, req.user!.id);
  res.status(204).send();
}

export async function resetPassword(req: Request, res: Response) {
  const tempPassword = await adminService.resetUserPassword(req.params.id as string);
  res.json({ data: { tempPassword } });
}

export async function changeStatus(req: Request, res: Response) {
  if (req.body.isActive) {
    await adminService.reactivateUser(req.params.id as string, req.user!.id);
  } else {
    await adminService.deactivateUser(req.params.id as string, req.user!.id);
  }
  res.status(204).send();
}

export async function getTrees(req: Request, res: Response) {
  const result = await treesService.listTrees(req.query as any);
  res.json(result);
}

export async function getDeletions(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await adminService.listDeletionRequests(page, limit);
  res.json(result);
}

export async function reviewDeletion(req: Request, res: Response) {
  if (req.body.status === 'approved') {
    await adminService.approveDeletion(req.params.id as string, req.user!.id);
  } else {
    await adminService.rejectDeletion(req.params.id as string, req.user!.id, req.body.reviewNote);
  }
  res.status(204).send();
}

export async function getMerges(req: Request, res: Response) {
  // Stub - merge proposals listing
  res.json({ items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
}
