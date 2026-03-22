import type { Request, Response, NextFunction } from 'express';

function stripTags(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '');
  }
  if (Array.isArray(value)) {
    return value.map(stripTags);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = stripTags(val);
    }
    return sanitized;
  }
  return value;
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT')) {
    req.body = stripTags(req.body);
  }
  next();
}
