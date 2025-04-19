"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadRouter = void 0;
const express_1 = __importDefault(require("express"));
const UploadController_1 = __importDefault(require("../controllers/UploadController"));
const Multer_1 = __importDefault(require("../utils/Multer"));
// routes
class UploadRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/single", Multer_1.default.single("file"), UploadController_1.default.uploadSingle)
            .post("/multiple", Multer_1.default.array("files", 10), UploadController_1.default.uploadMultiple);
    }
}
exports.UploadRouter = UploadRouter;
