"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const APIResponse_1 = require("../lib/APIResponse");
// import {uploadMultipleFiles, uploadSingleFile} from "../lib/Digitalocean"
const exceptions_1 = require("../lib/exceptions");
class UploadController {
    constructor() {
        this.uploadSingle = this.uploadSingle.bind(this);
        this.uploadMultiple = this.uploadMultiple.bind(this);
    }
    async uploadSingle(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            if (!req.file) {
                throw new exceptions_1.BadRequestException("No file provided");
            }
            const filePath = path_1.default.join("uploads", req.file.filename);
            const url = `${process.env.BASE_URL_API}/${filePath}`;
            return response.successResponse({
                message: `File uploaded successfully`,
                data: { url }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async uploadMultiple(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            if (!req.files || !Array.isArray(req.files)) {
                throw new exceptions_1.BadRequestException("No files provided");
            }
            const files = req.files.map((file) => ({
                filePath: file.path
            }));
            // Upload all files to DigitalOcean Spaces
            // const urls: string[] = await uploadMultipleFiles(files)
            const urls = [""];
            return response.successResponse({
                message: `Files uploaded successfully`,
                data: { urls }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new UploadController();
