import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../shared/errors/index';
import { logger } from '../shared/logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof DomainError) {
    res.status(err.statusCode).json({
      type: `https://vansh.app/errors/${err.errorType}`,
      title: err.errorType
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      status: err.statusCode,
      detail: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      detail: issue.message,
      pointer: '/' + issue.path.join('/'),
    }));

    res.status(400).json({
      type: 'https://vansh.app/errors/validation-error',
      title: 'Validation Error',
      status: 400,
      detail: 'The request contains invalid data',
      errors,
    });
    return;
  }

  // PostgreSQL unique constraint violation
  if ((err as any)?.code === '23505') {
    res.status(409).json({
      type: 'https://vansh.app/errors/conflict',
      title: 'Conflict',
      status: 409,
      detail: 'A record with this value already exists',
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');

  res.status(500).json({
    type: 'https://vansh.app/errors/internal-error',
    title: 'Internal Server Error',
    status: 500,
    detail: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}
