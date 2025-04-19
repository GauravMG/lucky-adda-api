"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBankDetailRouter = void 0;
const express_1 = __importDefault(require("express"));
const UserBankDetailController_1 = __importDefault(require("../controllers/UserBankDetailController"));
// routes
class UserBankDetailRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/save", UserBankDetailController_1.default.save)
            .post("/list", UserBankDetailController_1.default.list)
            .post("/delete", UserBankDetailController_1.default.delete);
    }
}
exports.UserBankDetailRouter = UserBankDetailRouter;
