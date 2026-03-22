export class DomainError extends Error {
  public readonly errorType: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, errorType: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.details = details;
  }
}
