export class AppError extends Error {
    constructor(message) {
        super(message)
        this.timestamp = new Date().toISOString()
    }
}

export class BadRequestError extends AppError {}

export class NotFoundError extends AppError {}

export class ConflictError extends AppError {}

export class UnprocessableEntityError extends AppError {}