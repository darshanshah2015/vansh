import type { Request, Response } from 'express';
import * as mergeService from '../services/merge.service';

export async function createMergeProposal(req: Request, res: Response) {
  const proposal = await mergeService.createMergeProposal(
    req.body.sourceTreeId,
    req.body.targetTreeId,
    req.user!.id,
    req.body.reason
  );
  res.status(201).json({ data: proposal });
}

export async function getMergeProposal(req: Request, res: Response) {
  const proposal = await mergeService.getMergeProposal(req.params.id as string);
  res.json({ data: proposal });
}

export async function addMapping(req: Request, res: Response) {
  const mapping = await mergeService.addMapping(
    req.params.id as string,
    req.body.sourcePersonId,
    req.body.targetPersonId,
    req.user!.id
  );
  res.status(201).json({ data: mapping });
}

export async function removeMapping(req: Request, res: Response) {
  await mergeService.removeMapping(req.params.id as string, req.params.mappingId as string, req.user!.id);
  res.status(204).send();
}

export async function resolveConflict(req: Request, res: Response) {
  const mapping = await mergeService.setConflictResolution(
    req.params.id as string,
    req.params.mappingId as string,
    req.body.resolution,
    req.user!.id
  );
  res.json({ data: mapping });
}

export async function approveMerge(req: Request, res: Response) {
  const result = await mergeService.approveMerge(req.params.id as string, req.user!.id, req.body.side);
  res.json({ data: result });
}

export async function autoDetectMappings(req: Request, res: Response) {
  const mappings = await mergeService.autoDetectMappings(req.params.id as string);
  res.json({ data: mappings });
}

export async function getTreeMergeProposals(req: Request, res: Response) {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await mergeService.getMergeProposalsByTree(req.params.slug as string, page, limit);
  res.json(result);
}
