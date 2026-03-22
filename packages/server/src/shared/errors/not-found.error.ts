import { DomainError } from './base.error';

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 'not-found', 404);
  }
}
