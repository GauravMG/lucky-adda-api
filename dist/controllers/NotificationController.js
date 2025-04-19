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
class NotificationController {
    commonModelUserNotification;
    idColumnNotification = "userNotificationId";
    constructor() {
        this.commonModelUserNotification = new CommonModel_1.default("UserNotification", this.idColumnNotification, ["title"]);
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
    }
    async createNotification(payload, userId) {
        const [notifications] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
            // create users
            const notifications = await this.commonModelUserNotification.bulkCreate(transaction, payload, userId);
            if (!notifications.length) {
                throw new exceptions_1.BadRequestException(`Failed to create notification(s).`);
            }
            return [notifications];
        });
        return notifications;
    }
    async create(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const payload = Array.isArray(req.body) ? req.body : [req.body];
            const userNotifications = await this.createNotification(payload, userId);
            return response.successResponse({
                message: `Notification alert(s) created successfully`,
                data: userNotifications
            });
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId } = req.headers;
            const { filter, range, sort } = await (0, helpers_1.listAPIPayload)(req.body);
            // user id check so user could only check their data
            filter["userId"] = userId;
            const [userNotifications, total] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                return await Promise.all([
                    this.commonModelUserNotification.list(transaction, {
                        filter,
                        range,
                        sort
                    }),
                    this.commonModelUserNotification.list(transaction, {
                        filter,
                        isCountOnly: true
                    })
                ]);
            });
            return response.successResponse({
                message: `Notification list`,
                metadata: {
                    total,
                    page: range?.page ?? common_1.DEFAULT_PAGE,
                    pageSize: range?.pageSize ?? common_1.DEFAULT_PAGE_SIZE
                },
                data: userNotifications
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
            const { userNotificationId, ...restPayload } = req.body;
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                // check if notification exists
                const [existingNotification] = await this.commonModelUserNotification.list(transaction, {
                    filter: {
                        userNotificationId
                    }
                });
                if (!existingNotification) {
                    throw new exceptions_1.BadRequestException("Notification doesn't exist");
                }
                // update notifications
                await this.commonModelUserNotification.updateById(transaction, restPayload, userNotificationId, userId);
            });
            return response.successResponse({
                message: `User notification updated successfully`
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId } = req.headers;
            const { userNotificationIds } = req.body;
            if (!userNotificationIds?.length) {
                throw new exceptions_1.BadRequestException(`Please select notification(s) to be deleted`);
            }
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                // check if notifications exists
                const existingNotifications = await this.commonModelUserNotification.list(transaction, {
                    filter: {
                        userNotificationId: userNotificationIds
                    }
                });
                if (userNotificationIds?.length !== existingNotifications?.length) {
                    const userNotificationIdsSet = new Set(existingNotifications.map((obj) => obj.userNotificationId));
                    throw new exceptions_1.BadRequestException(`Selected notification(s) not found: ${userNotificationIds.filter((userNotificationId) => !userNotificationIdsSet.has(userNotificationId))}`);
                }
                await this.commonModelUserNotification.softDeleteByIds(transaction, userNotificationIds, userId);
            });
            return response.successResponse({
                message: `Notification(s) deleted successfully`
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new NotificationController();
