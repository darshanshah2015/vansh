import { DomainError } from './base.error';

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'conflict', 409);
  }
}
