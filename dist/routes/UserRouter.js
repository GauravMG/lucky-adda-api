"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRouter = void 0;
const express_1 = __importDefault(require("express"));
const UserController_1 = __importDefault(require("../controllers/UserController"));
// routes
class UserRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/list", UserController_1.default.list)
            .post("/update", UserController_1.default.update)
            .post("/delete", UserController_1.default.delete);
    }
}
exports.UserRouter = UserRouter;
