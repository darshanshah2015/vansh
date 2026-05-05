import type { Request, Response } from 'express';
import * as treesService from '../services/trees.service';

export async function createTree(req: Request, res: Response) {
  const tree = await treesService.createTree(req.body, req.user!.id);
  res.status(201).json({ data: tree });
}

export async function getTreeBySlug(req: Request, res: Response) {
  const tree = await treesService.getTreeBySlug(req.params.slug as string);
  res.json({ data: tree });
}

export async function updateTree(req: Request, res: Response) {
  const tree = await treesService.updateTree(req.params.slug as string, req.body, req.user!.id);
  res.json({ data: tree });
}

export async function joinTree(req: Request, res: Response) {
  const tree = await treesService.joinTree(req.params.slug as string, req.user!.id);
  res.json({ data: tree });
}

export async function listTrees(req: Request, res: Response) {
  const result = await treesService.listTrees(req.query as any);
  res.json(result);
}

export async function getTreeStats(req: Request, res: Response) {
  const stats = await treesService.getTreeStats(req.params.slug as string);
  res.json({ data: stats });
}

export async function getTreeActivity(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await treesService.getTreeActivity(req.params.slug as string, page, limit);
  res.json(result);
}

export async function getTreeMembers(req: Request, res: Response) {
  const members = await treesService.getTreeMembers(req.params.slug as string);
  res.json({ data: members });
}

export async function createTreeFromWizard(req: Request, res: Response) {
  const tree = await treesService.createTreeFromWizard(req.body, req.user!.id);
  res.status(201).json({ data: tree });
}

export async function searchMatches(req: Request, res: Response) {
  const matchingService = await import('../../../shared/services/matching.service');
  const matches = await matchingService.findMatches(req.body);
  res.json({ data: matches });
}
