"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const notification_services_1 = require("../types/notification-services");
const Logger_1 = require("../utils/Logger");
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : []
});
async function seedNotificationService() {
    try {
        /* start seeding sms tiara service */
        const fast2smsSMSNotificationServiceExists = await prisma.notificationService.findFirst({
            where: {
                service: notification_services_1.NotificationServices.Fast2SMS,
                serviceType: notification_services_1.NotificationTypes.SMS
            }
        });
        if (!fast2smsSMSNotificationServiceExists) {
            const notificationService = {
                service: notification_services_1.NotificationServices.Fast2SMS,
                serviceType: notification_services_1.NotificationTypes.SMS,
                host: "https://www.fast2sms.com/dev/bulkV2",
                configuration: {
                    from: "",
                    to: "",
                    message: "Hey User",
                    privateKey: "0J9sBDw3HmfiPUzYIA1CZFKONpg2VXa8t5kGEdrqSue6nQyTMo6LQFgmfoH13ev9RIKScEVCnayj7s2Z"
                },
                status: true
            };
            await prisma.notificationService.create({
                data: {
                    ...notificationService
                }
            });
        }
        /* end seeding sms tiara service */
        (0, Logger_1.logMessage)("access", "Notification service seeding completed!");
    }
    catch (error) {
        if (error instanceof Error) {
            (0, Logger_1.logMessage)("error", `${error.message}`);
        }
        else {
            (0, Logger_1.logMessage)("error", `An unknown error occurred`);
        }
    }
}
exports.default = seedNotificationService;
