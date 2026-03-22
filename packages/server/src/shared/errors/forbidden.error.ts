import { DomainError } from './base.error';

export class ForbiddenError extends DomainError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 'forbidden', 403);
  }
}
