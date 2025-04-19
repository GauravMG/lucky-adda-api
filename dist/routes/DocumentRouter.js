"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRouter = void 0;
const express_1 = __importDefault(require("express"));
const DocumentController_1 = __importDefault(require("../controllers/DocumentController"));
// routes
class DocumentRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/contact-detail", DocumentController_1.default.contactDetail)
            .post("/faq", DocumentController_1.default.faq)
            .post("/privacy-policy", DocumentController_1.default.privacyPolicy)
            .post("/tnc", DocumentController_1.default.tnc)
            .post("/help-and-support", DocumentController_1.default.helpAndSupport);
    }
}
exports.DocumentRouter = DocumentRouter;
