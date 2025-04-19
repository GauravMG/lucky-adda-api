"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const _1 = require(".");
const router = express_1.default.Router();
// auth routes
router.use("/v1/auth", new _1.AuthRouter().router);
// master routes
router.use("/v1/role", new _1.RoleRouter().router);
// helper routes
router.use("/v1/upload", new _1.UploadRouter().router);
// user routes
router.use("/v1/user", new _1.UserRouter().router);
router.use("/v1/wallet", new _1.WalletRouter().router);
router.use("/v1/user-bank-detail", new _1.UserBankDetailRouter().router);
// other routes
router.use("/v1/document", new _1.DocumentRouter().router);
router.use("/v1/notification", new _1.NotificationRouter().router);
router.use("/v1/app-setting", new _1.AppSettingRouter().router);
// game routes
router.use("/v1/game", new _1.GameRouter().router);
// payment routes
router.use("/v1/payment", new _1.PaymentRouter().router);
exports.default = router;
