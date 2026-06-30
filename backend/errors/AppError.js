export class AppError extends Error {
  constructor(message) {
    super(message);
    this.timestamp = new Date().toISOString();
  }
}

export class BadRequestError extends AppError {}

export class NotFoundError extends AppError {}

export class ConflictError extends AppError {}

// 401 — credenciales inválidas o token ausente/expirado.
export class UnauthorizedError extends AppError {}

// 403 — autenticado, pero sin permiso sobre el recurso solicitado.
export class ForbiddenError extends AppError {}

