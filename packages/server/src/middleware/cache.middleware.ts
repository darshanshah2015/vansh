import type { Request, Response, NextFunction } from 'express';

export function defaultNoCache(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

export function cacheControl(value: string) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', value);
    next();
  };
}
