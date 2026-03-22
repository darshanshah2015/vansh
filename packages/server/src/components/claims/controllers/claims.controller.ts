import type { Request, Response } from 'express';
import * as claimsService from '../services/claims.service';

export async function createClaim(req: Request, res: Response) {
  const claim = await claimsService.createClaim(req.params.id as string, req.user!.id, req.body.reason);
  res.status(201).json({ data: claim });
}

export async function approveClaim(req: Request, res: Response) {
  const claim = await claimsService.approveClaim(req.params.id as string, req.user!.id);
  res.json({ data: claim });
}

export async function rejectClaim(req: Request, res: Response) {
  const claim = await claimsService.rejectClaim(req.params.id as string, req.user!.id, req.body.reviewNote);
  res.json({ data: claim });
}

export async function getTreeClaims(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await claimsService.getClaimsByTree(req.params.slug as string, page, limit);
  res.json(result);
}

export async function getMyClaims(req: Request, res: Response) {
  const claims = await claimsService.getClaimsByUser(req.user!.id);
  res.json({ data: claims });
}
