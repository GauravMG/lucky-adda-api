"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRouter = void 0;
const express_1 = __importDefault(require("express"));
const WalletController_1 = __importDefault(require("../controllers/WalletController"));
// routes
class WalletRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/create", WalletController_1.default.create)
            .post("/list", WalletController_1.default.list)
            .post("/update", WalletController_1.default.update)
            .post("/top-winner", WalletController_1.default.topWinner)
            .post("/convert-winning", WalletController_1.default.convertWinning);
    }
}
exports.WalletRouter = WalletRouter;
