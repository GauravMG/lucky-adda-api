"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const moment_1 = __importDefault(require("moment"));
const Logger_1 = require("../utils/Logger"); // Importing the error log stream
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    let errorMessage = err.message ?? "Something went wrong";
    let errorStatusCode = err.statusCode ?? 422;
    let errorCode = err.errorCode;
    // Handle Prisma errors first
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002":
                errorMessage =
                    "A unique constraint violation occurred. The data you are trying to enter already exists.";
                errorStatusCode = 400;
                errorCode = "unique_constraint_violation";
                break;
            case "P2003":
                errorMessage =
                    "A foreign key constraint failed. Ensure referenced data exists.";
                errorStatusCode = 400;
                errorCode = "foreign_key_constraint_failed";
                break;
            case "P2025":
                errorMessage = "The requested record was not found in the database.";
                errorStatusCode = 404;
                errorCode = "record_not_found";
                break;
            default:
                errorMessage = "A database error occurred.";
                errorStatusCode = 500;
                errorCode = `prisma_error_${err.code}`;
                break;
        }
    }
    else if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        errorMessage = "Invalid data format. Please check your input.";
        errorStatusCode = 400;
        errorCode = "prisma_validation_error";
    }
    else if (err instanceof client_1.Prisma.PrismaClientInitializationError) {
        errorMessage = "Database connection error. Please try again later.";
        errorStatusCode = 500;
        errorCode = "prisma_initialization_error";
    }
    else if (err instanceof client_1.Prisma.PrismaClientRustPanicError) {
        errorMessage = "A critical database error occurred. Please try again later.";
        errorStatusCode = 500;
        errorCode = "prisma_panic_error";
    }
    // Handle JWT-related errors
    if (["jwt_expired", "jwt_malformed", "jwt expired", "jwt malformed"].includes(errorMessage)) {
        errorStatusCode = 401;
        errorCode = "unauthorized";
    }
    // Set default error codes if not assigned yet
    if (!errorCode) {
        switch (errorStatusCode) {
            case 400:
                errorCode = "unexpected_error";
                break;
            case 401:
                errorCode = "unauthorized";
                break;
            case 403:
                errorCode = "not_enough_permissions";
                break;
            case 404:
                errorCode = "not_found";
                break;
            default:
                errorCode = "internal_server_error";
                break;
        }
    }
    // Create the error log message with timestamp and request details
    const errorMessageLogging = `${(0, moment_1.default)().format("YYYY-MM-DD HH:mm:ss")} - ` +
        `${req.method} ${req.url} ` + // Request method and URL
        `- ${errorMessage} ` + // Error message
        `- Status: ${errorStatusCode} ` + // Status code
        `- IP: ${req.ip} ` + // Client IP address
        `- User-Agent: ${req.get("User-Agent")} ` + // User-Agent
        `- Referrer: ${req.get("Referrer") || "N/A"} ` + // Referrer (if available)
        `- Stack Trace: ${err.stack || "No stack trace available"}\n`; // Stack trace (if available)
    // Write to the error log stream
    (0, Logger_1.logMessage)("error", errorMessageLogging);
    let errorFinalObject = {
        success: false,
        status: errorStatusCode,
        message: errorMessage,
        code: errorCode
    };
    if (err.data) {
        errorFinalObject.data = err.data;
    }
    // In development, send the full error stack for debugging
    if (process.env.NODE_ENV === "development") {
        errorFinalObject = {
            ...errorFinalObject,
            stack: err instanceof Error ? err.stack : undefined // Include stack trace in dev mode
        };
    }
    return res.status(errorStatusCode).json(errorFinalObject);
};
exports.errorHandler = errorHandler;
