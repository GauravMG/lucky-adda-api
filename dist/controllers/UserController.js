"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const helpers_1 = require("../helpers");
const APIResponse_1 = require("../lib/APIResponse");
const PrismaLib_1 = require("../lib/PrismaLib");
const exceptions_1 = require("../lib/exceptions");
const CommonModel_1 = __importDefault(require("../models/CommonModel"));
const common_1 = require("../types/common");
class UserController {
    commonModelUser;
    idColumnUser = "userId";
    constructor() {
        this.commonModelUser = new CommonModel_1.default("User", this.idColumnUser, [
            "roleId",
            "fullName",
            "mobile"
        ]);
        this.list = this.list.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }
    async list(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { roleId } = req.headers;
            const { filter, range, sort } = await (0, helpers_1.listAPIPayload)(req.body);
            const [data, total] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                return await Promise.all([
                    this.commonModelUser.list(transaction, {
                        filter,
                        range,
                        sort
                    }),
                    this.commonModelUser.list(transaction, {
                        filter,
                        isCountOnly: true
                    })
                ]);
            });
            return response.successResponse({
                message: `Users data`,
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
    async update(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, ...restPayload } = req.body;
            const [user] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                // check if user exists
                const [existingUser] = await this.commonModelUser.list(transaction, {
                    filter: {
                        userId
                    }
                });
                if (!existingUser) {
                    throw new exceptions_1.BadRequestException("User doesn't exist");
                }
                // hash password
                if ((restPayload?.password ?? "").trim() !== "") {
                    if ((restPayload?.password ?? "").trim() !== "" &&
                        (restPayload?.currentPassword ?? "").trim() === "" &&
                        (existingUser.password ?? "").trim() !== "") {
                        throw new exceptions_1.BadRequestException("Please enter current password");
                    }
                    if ((restPayload?.currentPassword ?? "").trim() !== "" &&
                        (existingUser.password ?? "").trim() !== "") {
                        const isValidCurrentPassword = await bcrypt_1.default.compare(restPayload.currentPassword, existingUser.password);
                        if (!isValidCurrentPassword) {
                            throw new exceptions_1.BadRequestException("Invalid current password");
                        }
                    }
                    const encryptedPassword = await bcrypt_1.default.hash(restPayload.password, parseInt(process.env.SALT_ROUNDS));
                    restPayload.password = encryptedPassword;
                    delete restPayload.currentPassword;
                }
                // update user
                await this.commonModelUser.updateById(transaction, restPayload, userId, userId);
                // get updated details
                const [user] = await this.commonModelUser.list(transaction, {
                    filter: {
                        userId
                    }
                });
                return [user];
            });
            return response.successResponse({
                message: `Details updated successfully`,
                data: user
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
            const { userIds } = req.body;
            if (!userIds?.length) {
                throw new exceptions_1.BadRequestException(`Please select user(s) to be deleted`);
            }
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const existingUsers = await this.commonModelUser.list(transaction, {
                    filter: {
                        userId: userIds
                    }
                });
                if (!existingUsers.length) {
                    const userIdsSet = new Set(existingUsers.map((obj) => obj.userId));
                    throw new exceptions_1.BadRequestException(`Selected user(s) not found: ${userIds.filter((userId) => !userIdsSet.has(userId))}`);
                }
                await this.commonModelUser.softDeleteByIds(transaction, userIds, userId);
            });
            return response.successResponse({
                message: `User(s) deleted successfully`
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new UserController();
