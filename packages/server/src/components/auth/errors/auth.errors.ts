import { DomainError } from '../../../shared/errors/base.error';

export class EmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`An account with email '${email}' already exists`, 'email-already-exists', 409);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password', 'invalid-credentials', 401);
  }
}

export class SessionExpiredError extends DomainError {
  constructor() {
    super('Your session has expired. Please log in again.', 'session-expired', 401);
  }
}

export class InvalidResetTokenError extends DomainError {
  constructor() {
    super('Invalid or expired password reset token', 'invalid-reset-token', 400);
  }
}
