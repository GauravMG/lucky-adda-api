"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const Logger_1 = require("../utils/Logger");
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : []
});
async function seedAppSettings() {
    try {
        const appSettings = [
            {
                appSettingId: 1,
                isAppShutdown: false,
                appShutDownMessage: "This app is currently unavailable"
            }
        ];
        for (const appSetting of appSettings) {
            await prisma.appSetting.upsert({
                where: { appSettingId: appSetting.appSettingId },
                update: {
                    isAppShutdown: appSetting.isAppShutdown,
                    appShutDownMessage: appSetting.appShutDownMessage
                },
                create: {
                    appSettingId: appSetting.appSettingId,
                    isAppShutdown: appSetting.isAppShutdown,
                    appShutDownMessage: appSetting.appShutDownMessage
                }
            });
        }
        (0, Logger_1.logMessage)("access", "App settings seeding completed!");
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
exports.default = seedAppSettings;
