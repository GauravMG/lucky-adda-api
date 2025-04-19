"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRouter = void 0;
const express_1 = __importDefault(require("express"));
const PaymentController_1 = __importDefault(require("../controllers/PaymentController"));
// routes
class PaymentRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/create", PaymentController_1.default.create)
            .post("/update", PaymentController_1.default.update)
            .get("/webhook", PaymentController_1.default.webhook)
            .post("/webhook", PaymentController_1.default.webhook);
    }
}
exports.PaymentRouter = PaymentRouter;
