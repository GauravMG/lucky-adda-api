"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIResponse_1 = require("../lib/APIResponse");
const PrismaLib_1 = require("../lib/PrismaLib");
const exceptions_1 = require("../lib/exceptions");
const CommonModel_1 = __importDefault(require("../models/CommonModel"));
class AppSettingController {
    commonModelAppSetting;
    idColumnAppSetting = "appSettingId";
    constructor() {
        this.commonModelAppSetting = new CommonModel_1.default("AppSetting", this.idColumnAppSetting, []);
        this.list = this.list.bind(this);
        this.update = this.update.bind(this);
    }
    async list(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const [data] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const [appSetting] = await this.commonModelAppSetting.list(transaction, {
                    range: {
                        page: 1,
                        pageSize: 1
                    }
                });
                return [appSetting];
            });
            return response.successResponse({
                message: `App settings`,
                data: {
                    ...data,
                    amountDeposit: parseInt(process.env.AMOUNT_DEPOSIT),
                    amountConversion: parseInt(process.env.AMOUNT_CONVERSION),
                    amountReferral: parseInt(process.env.AMOUNT_REFERRAL),
                    amountJodi: parseInt(process.env.AMOUNT_JODI),
                    amountHarup: parseInt(process.env.AMOUNT_HARUP)
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
            const { userId, roleId } = req.headers;
            const { appSettingId, ...restPayload } = req.body;
            const [data] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                // check if exists
                const [existingAppSetting] = await this.commonModelAppSetting.list(transaction, {
                    filter: {
                        appSettingId
                    }
                });
                if (!existingAppSetting) {
                    throw new exceptions_1.BadRequestException("App setting doesn't exist. Please contact admin");
                }
                // update transaction
                await this.commonModelAppSetting.updateById(transaction, restPayload, appSettingId, userId);
                // get updated details
                const [appSetting] = await this.commonModelAppSetting.list(transaction, {
                    filter: {
                        appSettingId
                    }
                });
                return [appSetting];
            });
            return response.successResponse({
                message: `App settings updated successfully`,
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new AppSettingController();
