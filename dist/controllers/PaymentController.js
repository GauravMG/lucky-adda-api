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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIResponse_1 = require("../lib/APIResponse");
const PrismaLib_1 = require("../lib/PrismaLib");
const exceptions_1 = require("../lib/exceptions");
const CommonModel_1 = __importDefault(require("../models/CommonModel"));
const PayFromUpi = __importStar(require("../services/PayFromUpi"));
class PaymentController {
    commonModelPaymentTransaction;
    commonModelWallet;
    commonModelUser;
    idColumnPaymentTransaction = "paymentTransactionId";
    idColumnWallet = "walletId";
    idColumnUser = "userId";
    constructor() {
        this.commonModelPaymentTransaction = new CommonModel_1.default("PaymentTransaction", this.idColumnPaymentTransaction, []);
        this.commonModelWallet = new CommonModel_1.default("Wallet", this.idColumnWallet, []);
        this.commonModelUser = new CommonModel_1.default("User", this.idColumnUser, [
            "roleId",
            "fullName",
            "mobile"
        ]);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.webhook = this.webhook.bind(this);
    }
    async create(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const { amount } = req.body;
            let transactionPayload = {};
            const [user] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const [user] = await this.commonModelUser.list(transaction, {
                    filter: {
                        userId
                    }
                });
                if (!user) {
                    throw new exceptions_1.BadRequestException("User doesn't exist");
                }
                transactionPayload = {
                    type: "any",
                    user_name: user.fullName,
                    user_email: `${user.userId}_${user.mobile}@yopmail.com`,
                    user_mobile: user.mobile,
                    amount: parseInt(amount),
                    redirect_url: process.env.PAYMENT_REDIRECT_URL
                };
                return [user];
            });
            const result = await PayFromUpi.createTransaction(transactionPayload);
            let paymentTransactionId = null;
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const [paymentTransaction] = await this.commonModelPaymentTransaction.bulkCreate(transaction, [
                    {
                        userId,
                        amount,
                        paymentStatus: "pending",
                        requestJSON: JSON.stringify(transactionPayload),
                        transactionCreateResponseJSON: JSON.stringify(result)
                    }
                ], userId);
                paymentTransactionId = paymentTransaction.paymentTransactionId;
                return [];
            });
            return response.successResponse({
                message: `Transaction created successfully.`,
                data: {
                    paymentTransactionId,
                    ...(result?.data ?? result)
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId } = req.headers;
            const { paymentTransactionId, paymentStatus, responseJSON } = req.body;
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const [paymentTransaction] = await this.commonModelPaymentTransaction.list(transaction, {
                    filter: {
                        paymentTransactionId
                    }
                });
                if (!paymentTransaction) {
                    throw new exceptions_1.BadRequestException("Transaction doesn't exist");
                }
                await this.commonModelPaymentTransaction.updateById(transaction, {
                    paymentStatus,
                    responseJSON: typeof responseJSON === "string"
                        ? responseJSON
                        : JSON.stringify(responseJSON)
                }, paymentTransactionId, userId);
                return [];
            });
            return response.successResponse({
                message: `Transaction created successfully.`
            });
        }
        catch (error) {
            next(error);
        }
    }
    async webhook(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            console.log(`req.body`, req.body);
            console.log(`req.query`, req.query);
            console.log(`req.params`, req.params);
            return response.successResponse({
                message: `Payment response received successfully`
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new PaymentController();
