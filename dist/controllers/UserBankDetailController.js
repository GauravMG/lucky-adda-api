"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
const APIResponse_1 = require("../lib/APIResponse");
const PrismaLib_1 = require("../lib/PrismaLib");
const exceptions_1 = require("../lib/exceptions");
const CommonModel_1 = __importDefault(require("../models/CommonModel"));
const common_1 = require("../types/common");
class UserBankDetailController {
    commonModelUserBankDetail;
    idColumnUserBankDetail = "userBankDetailId";
    constructor() {
        this.commonModelUserBankDetail = new CommonModel_1.default("UserBankDetail", this.idColumnUserBankDetail, []);
        this.save = this.save.bind(this);
        this.list = this.list.bind(this);
        this.delete = this.delete.bind(this);
    }
    async save(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const { userBankDetailId, ...restPayload } = req.body;
            const [data] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                let userBankDetail = null;
                if (userBankDetailId) {
                    // check if exists
                    const [existingUserBankDetail] = await this.commonModelUserBankDetail.list(transaction, {
                        filter: {
                            userBankDetailId
                        }
                    });
                    if (!existingUserBankDetail) {
                        throw new exceptions_1.BadRequestException("Account details doesn't exist");
                    }
                    await this.commonModelUserBankDetail.updateById(transaction, restPayload, userBankDetailId, userId);
                    // get updated details
                    const [updatedUserBankDetail] = await this.commonModelUserBankDetail.list(transaction, {
                        filter: {
                            userBankDetailId
                        }
                    });
                    userBankDetail = { ...updatedUserBankDetail };
                }
                else {
                    const [newUserBankDetail] = await this.commonModelUserBankDetail.bulkCreate(transaction, [
                        {
                            userId,
                            accountType: restPayload.accountType,
                            accountHolderName: restPayload.accountHolderName,
                            accountNumber: restPayload.accountNumber,
                            bankName: restPayload.bankName ?? null,
                            ifscCode: restPayload.ifscCode ?? null
                        }
                    ], userId);
                    userBankDetail = { ...newUserBankDetail };
                }
                return [userBankDetail];
            });
            return response.successResponse({
                message: `Account details updated successfully`,
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            let { filter, range, sort } = await (0, helpers_1.listAPIPayload)(req.body);
            filter =
                filter && Object.keys(filter).length
                    ? filter.userId
                        ? filter
                        : {
                            ...filter,
                            userId
                        }
                    : { userId };
            const [data, total] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                return await Promise.all([
                    this.commonModelUserBankDetail.list(transaction, {
                        filter,
                        range,
                        sort
                    }),
                    this.commonModelUserBankDetail.list(transaction, {
                        filter,
                        isCountOnly: true
                    })
                ]);
            });
            return response.successResponse({
                message: `User bank details`,
                metadata: {
                    total,
                    page: range?.page ?? common_1.DEFAULT_PAGE,
                    pageSize: range?.pageSize ?? common_1.DEFAULT_PAGE_SIZE
                },
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const { userBankDetailIds } = req.body;
            if (!userBankDetailIds?.length) {
                throw new exceptions_1.BadRequestException(`Please select user bank detail(s) to be deleted`);
            }
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const existingUserBankDetails = await this.commonModelUserBankDetail.list(transaction, {
                    filter: {
                        userBankDetailId: userBankDetailIds
                    }
                });
                if (!existingUserBankDetails.length) {
                    const userBankDetailIdsSet = new Set(existingUserBankDetails.map((obj) => obj.userBankDetailId));
                    throw new exceptions_1.BadRequestException(`Selected user(s) not found: ${userBankDetailIds.filter((userBankDetailId) => !userBankDetailIdsSet.has(userBankDetailId))}`);
                }
                await this.commonModelUserBankDetail.softDeleteByIds(transaction, userBankDetailIds, userId);
            });
            return response.successResponse({
                message: `User bank detail(s) deleted successfully`
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new UserBankDetailController();
