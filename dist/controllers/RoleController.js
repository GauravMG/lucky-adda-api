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
class RoleController {
    commonModelRole;
    idColumnRole = "roleId";
    constructor() {
        this.commonModelRole = new CommonModel_1.default("Role", this.idColumnRole, ["name"]);
        this.list = this.list.bind(this);
        this.update = this.update.bind(this);
    }
    async list(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { roleId } = req.headers;
            const { filter, range, sort } = await (0, helpers_1.listAPIPayload)(req.body);
            const [roles, total] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                return await Promise.all([
                    this.commonModelRole.list(transaction, {
                        filter,
                        range,
                        sort
                    }),
                    this.commonModelRole.list(transaction, {
                        filter,
                        isCountOnly: true
                    })
                ]);
            });
            return response.successResponse({
                message: `Roles data`,
                metadata: {
                    total,
                    page: range?.page ?? common_1.DEFAULT_PAGE,
                    pageSize: range?.pageSize ?? common_1.DEFAULT_PAGE_SIZE
                },
                data: roles
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId: roleIdHeaders } = req.headers;
            const { roleId, ...restPayload } = req.body;
            const [role] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                // check if role exists
                const [existingRole] = await this.commonModelRole.list(transaction, {
                    filter: {
                        roleId
                    }
                });
                if (!existingRole) {
                    throw new exceptions_1.BadRequestException("Role doesn't exist");
                }
                // update role
                await this.commonModelRole.updateById(transaction, restPayload, roleId, userId);
                // get updated details
                const [role] = await this.commonModelRole.list(transaction, {
                    filter: {
                        roleId
                    }
                });
                return [role];
            });
            return response.successResponse({
                message: `Details updated successfully`,
                data: role
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new RoleController();
