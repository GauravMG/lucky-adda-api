"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
function replaceSpecialChars(inputString) {
    return inputString.replace(/[^a-zA-Z0-9]/g, "-");
}
// Define storage settings
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(process.cwd(), "public/uploads")); // Directory for uploads
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${replaceSpecialChars(file.originalname)}-${uniqueSuffix}${extension}`);
    }
});
// Define file filter to allow only certain file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    }
    else {
        cb(new Error("Unsupported file type"), false); // Reject the file
    }
};
// Set limits for uploaded files
const limits = {
    fileSize: 20 * 1024 * 1024 // 20 MB
};
// Create the Multer instance
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits
});
exports.default = upload;
