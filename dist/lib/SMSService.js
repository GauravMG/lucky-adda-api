"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = sendSMS;
const axios_1 = __importDefault(require("axios"));
const exceptions_1 = require("../lib/exceptions");
const notification_services_1 = require("../types/notification-services");
const Logger_1 = require("../utils/Logger");
const NotificationService_1 = require("./NotificationService");
async function sendSmsWithFast2SMS(configuration) {
    try {
        if (!configuration?.host || !configuration?.payload?.length) {
            throw new exceptions_1.BadRequestException("Cannot send SMS.");
        }
        for (let { mobile, message } of configuration.payload) {
            const response = await axios_1.default.get(configuration.host, {
                params: {
                    authorization: configuration.privateKey,
                    message,
                    language: "english",
                    route: "q",
                    numbers: mobile
                },
                headers: {
                    "cache-control": "no-cache"
                }
            });
            (0, Logger_1.logMessage)("access", JSON.stringify(response.data));
        }
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        throw error;
    }
}
async function sendSMS(payload) {
    try {
        const notificationData = await (0, NotificationService_1.getActiveProvider)(notification_services_1.NotificationTypes.SMS);
        if (!notificationData) {
            throw new exceptions_1.BadRequestException("Cannot send SMS.");
        }
        const configuration = {
            privateKey: notificationData.configuration?.privateKey,
            host: notificationData.host,
            from: notificationData.configuration?.from,
            payload
        };
        switch (notificationData.serviceType) {
            case notification_services_1.NotificationTypes.SMS:
                await sendSmsWithFast2SMS(configuration);
                break;
            default:
                throw new exceptions_1.BadRequestException("Cannot send SMS.");
        }
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
    }
}
