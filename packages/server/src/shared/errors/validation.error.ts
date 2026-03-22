import { DomainError } from './base.error';

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'validation-error', 400, details);
  }
}
