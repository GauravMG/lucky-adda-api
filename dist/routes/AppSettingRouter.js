"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSettingRouter = void 0;
const express_1 = __importDefault(require("express"));
const AppSettingController_1 = __importDefault(require("../controllers/AppSettingController"));
// routes
class AppSettingRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/list", AppSettingController_1.default.list)
            .post("/update", AppSettingController_1.default.update);
    }
}
exports.AppSettingRouter = AppSettingRouter;
