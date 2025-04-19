"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRouter = void 0;
const express_1 = __importDefault(require("express"));
const GameController_1 = __importDefault(require("../controllers/GameController"));
// routes
class GameRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
        this.router
            .post("/create", GameController_1.default.create)
            .post("/list", GameController_1.default.list)
            .post("/update", GameController_1.default.update)
            .post("/delete", GameController_1.default.delete)
            .post("/list-result", GameController_1.default.listGameResults)
            .post("/list-result-chart", GameController_1.default.listGameResultsChart)
            .post("/save-user-bet", GameController_1.default.saveUserBet)
            .post("/list-user-bet", GameController_1.default.listUserBet)
            .post("/process-result", GameController_1.default.handleGameResult);
    }
}
exports.GameRouter = GameRouter;
