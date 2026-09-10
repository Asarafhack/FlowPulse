export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly status: number;
  readonly errors: FieldError[] | undefined;

  constructor(status: number, message: string, errors?: FieldError[]) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.errors = errors;
  }
}

export const badRequest = (message = "Bad request") => new AppError(400, message);
export const unauthorized = (message = "Authentication required") => new AppError(401, message);
export const forbidden = (message = "You do not have access to this resource") =>
  new AppError(403, message);
export const notFound = (message = "Resource not found") => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);
export const validationFailed = (errors: FieldError[]) =>
  new AppError(422, "Validation failed", errors);
export const tooManyRequests = (message = "Too many requests, please try again later") =>
  new AppError(429, message);
