"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = void 0;
const firebaseAdmin_1 = __importDefault(require("./firebaseAdmin"));
const sendPushNotification = async (fcmToken, title, body, data) => {
    try {
        const stringifiedData = {};
        if (data) {
            Object.keys(data).forEach((key) => {
                stringifiedData[key] = String(data[key]); // Convert values to string
            });
        }
        const message = {
            token: fcmToken,
            notification: { title, body },
            data: {
                type: "alert",
                message: title,
                data: stringifiedData
            }
            // android: {
            // 	notification: {sound: "default", channelId: "default-channel-id", priority: "high"}
            // },
            // apns: {payload: {aps: {sound: "default"}}}
        };
        const response = await firebaseAdmin_1.default.messaging().send(message);
        console.log("Push notification sent:", response);
        return response;
    }
    catch (error) {
        console.error("Error sending notification:", error);
    }
};
exports.sendPushNotification = sendPushNotification;
