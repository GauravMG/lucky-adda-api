"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveProvider = getActiveProvider;
const PrismaLib_1 = require("../lib/PrismaLib");
const exceptions_1 = require("../lib/exceptions");
const CommonModel_1 = __importDefault(require("../models/CommonModel"));
const Logger_1 = require("../utils/Logger");
// get active provider with config
async function getActiveProvider(serviceType) {
    try {
        const commonModelNotificationService = new CommonModel_1.default("NotificationService", "notificationServiceId", []);
        const [detailData] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
            const activeNotificationService = await commonModelNotificationService.list(transaction, {
                filter: {
                    status: true,
                    serviceType: serviceType
                }
            });
            if (!activeNotificationService?.length) {
                throw new exceptions_1.BadRequestException(`Cannot send ${serviceType}`);
            }
            const detailData = {
                service: activeNotificationService[0]?.service,
                serviceType: activeNotificationService[0]?.serviceType,
                configuration: activeNotificationService[0]?.configuration,
                host: activeNotificationService[0]?.host,
                port: activeNotificationService[0]?.port,
                encryption: activeNotificationService[0]?.encryption
            };
            return [detailData];
        });
        return detailData;
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        throw error;
    }
}
