import type { Request, Response } from 'express';
import * as auditRevertService from '../services/audit-revert.service';

export async function revertChange(req: Request, res: Response) {
  const result = await auditRevertService.revertChange(
    req.params.id as string,
    req.user!.id,
    req.body.reason
  );
  res.json({ data: result });
}
