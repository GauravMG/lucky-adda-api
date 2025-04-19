"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestExceptionFor422 = exports.InternalServerException = exports.EntityNotFoundException = exports.ForbiddenException = exports.UnauthorizedException = exports.PayloadValidationException = exports.BadRequestException = exports.ServerError = void 0;
class ServerError extends Error {
    statusCode;
    message;
    errorCode;
    data;
    constructor(statusCode, message, errorCode, data) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errorCode = errorCode;
        this.data = data;
    }
}
exports.ServerError = ServerError;
class BadRequestException extends ServerError {
    constructor(message = "Bad Request", errorCode = "bad_request", data) {
        super(400, message, errorCode, data);
    }
}
exports.BadRequestException = BadRequestException;
class PayloadValidationException extends ServerError {
    constructor(errors = []) {
        super(400, "Bad Request", "body_validation_exception", errors);
    }
}
exports.PayloadValidationException = PayloadValidationException;
class UnauthorizedException extends ServerError {
    constructor(description) {
        super(401, description ? `Unauthorized: ${description}` : "Unauthorized", "unauthorized");
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends ServerError {
    constructor(description) {
        super(403, description ? `Forbidden: ${description}` : "Forbidden", "forbidden");
    }
}
exports.ForbiddenException = ForbiddenException;
class EntityNotFoundException extends ServerError {
    constructor(message = "Entity not found.", errorCode = "not_found") {
        super(404, message, errorCode);
    }
}
exports.EntityNotFoundException = EntityNotFoundException;
class InternalServerException extends ServerError {
    constructor(message = "Internal server error") {
        super(500, message, "unexpected_error");
    }
}
exports.InternalServerException = InternalServerException;
class BadRequestExceptionFor422 extends ServerError {
    constructor(message = "Bad Request", errorCode = "bad_request") {
        super(422, message, errorCode);
    }
}
exports.BadRequestExceptionFor422 = BadRequestExceptionFor422;
