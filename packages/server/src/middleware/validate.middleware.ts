import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        detail: issue.message,
        pointer: '/body/' + issue.path.join('/'),
      }));
      _res.status(400).json({
        type: 'https://vansh.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'The request contains invalid data',
        errors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        detail: issue.message,
        pointer: '/query/' + issue.path.join('/'),
      }));
      _res.status(400).json({
        type: 'https://vansh.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'The request contains invalid data',
        errors,
      });
      return;
    }
    req.query = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        detail: issue.message,
        pointer: '/params/' + issue.path.join('/'),
      }));
      _res.status(400).json({
        type: 'https://vansh.app/errors/validation-error',
        title: 'Validation Error',
        status: 400,
        detail: 'The request contains invalid data',
        errors,
      });
      return;
    }
    req.params = result.data;
    next();
  };
}
