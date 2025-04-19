"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const GameController_1 = __importDefault(require("../controllers/GameController"));
// Sample cron job — runs every minute
node_cron_1.default.schedule("* * * * *", () => {
    console.log("Running a task every minute:", new Date().toISOString());
    GameController_1.default.finalizeGameResult();
});
const startCronJobs = () => {
    console.log("Cron jobs initialized.");
};
exports.default = startCronJobs;
