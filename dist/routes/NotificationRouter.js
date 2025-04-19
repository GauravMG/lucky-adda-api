"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRouter = void 0;
const express_1 = __importDefault(require("express"));
const NotificationController_1 = __importDefault(require("../controllers/NotificationController"));
// routes
class NotificationRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/create", NotificationController_1.default.create)
            .post("/list", NotificationController_1.default.list)
            .post("/update", NotificationController_1.default.update)
            .post("/delete", NotificationController_1.default.delete);
    }
}
exports.NotificationRouter = NotificationRouter;
