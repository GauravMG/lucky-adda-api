"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMessage = exports.accessLogStream = void 0;
const rotating_file_stream_1 = require("rotating-file-stream");
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const fs_1 = __importDefault(require("fs"));
// Define log directories
const logBasePath = path_1.default.join(process.cwd(), "public/logs");
const accessLogPath = path_1.default.join(logBasePath, "access");
const errorLogPath = path_1.default.join(logBasePath, "error");
[accessLogPath, errorLogPath].forEach((dir) => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
});
// Helper function for dynamic log filenames
const generateLogFilename = (baseName) => {
    const date = (0, moment_1.default)().format("YYYY-MM-DD"); // e.g., 2024-12-12
    return `${baseName}-${date}.log`;
};
// Rotating file streams for access and error logs
exports.accessLogStream = (0, rotating_file_stream_1.createStream)((time, index) => generateLogFilename("access"), {
    interval: "1d", // Rotate daily
    path: accessLogPath // Access logs directory
});
const errorLogStream = (0, rotating_file_stream_1.createStream)((time, index) => generateLogFilename("error"), {
    interval: "1d", // Rotate daily
    path: errorLogPath // Error logs directory
});
// Helper function for logging
const logMessage = (type, message) => {
    const formattedMessage = `${new Date().toISOString()} - ${message}\n`;
    // Log to the console if in development mode
    if (process.env.NODE_ENV === "development") {
        if (type === "access") {
            console.log(`[ACCESS]: ${message}`);
        }
        else if (type === "error") {
            console.error(`[ERROR]: ${message}`);
        }
    }
    // Write to the appropriate log stream
    if (type === "access") {
        exports.accessLogStream.write(formattedMessage);
    }
    else if (type === "error") {
        errorLogStream.write(formattedMessage);
    }
};
exports.logMessage = logMessage;
