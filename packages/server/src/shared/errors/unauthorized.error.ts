import { DomainError } from './base.error';

export class UnauthorizedError extends DomainError {
  constructor(message = 'Authentication required') {
    super(message, 'unauthorized', 401);
  }
}
