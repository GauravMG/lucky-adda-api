"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// auth routes
__exportStar(require("./AuthRouter"), exports);
// master routes
__exportStar(require("./RoleRouter"), exports);
// helper routes
__exportStar(require("./UploadRouter"), exports);
// user routes
__exportStar(require("./UserRouter"), exports);
__exportStar(require("./WalletRouter"), exports);
__exportStar(require("./UserBankDetailRouter"), exports);
// other routes
__exportStar(require("./DocumentRouter"), exports);
__exportStar(require("./NotificationRouter"), exports);
__exportStar(require("./AppSettingRouter"), exports);
// game routes
__exportStar(require("./GameRouter"), exports);
// payment routes
__exportStar(require("./PaymentRouter"), exports);
