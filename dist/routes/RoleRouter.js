"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleRouter = void 0;
const express_1 = __importDefault(require("express"));
const RoleController_1 = __importDefault(require("../controllers/RoleController"));
// routes
class RoleRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/list", RoleController_1.default.list)
            .post("/update", RoleController_1.default.update);
    }
}
exports.RoleRouter = RoleRouter;
