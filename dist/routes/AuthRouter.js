"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const express_1 = __importDefault(require("express"));
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
// routes
class AuthRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/send-otp", AuthController_1.default.sendOTP)
            .post("/sign-in-with-otp", AuthController_1.default.signInWithOTP)
            .post("/get-me", AuthController_1.default.getMe)
            .post("/refresh-token", AuthController_1.default.refreshToken)
            .post("/logout", AuthController_1.default.logout);
    }
}
exports.AuthRouter = AuthRouter;
