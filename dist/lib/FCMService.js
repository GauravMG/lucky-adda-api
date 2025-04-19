"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessToken = getAccessToken;
exports.sendPushNotification = sendPushNotification;
const axios_1 = __importDefault(require("axios"));
const google_auth_library_1 = require("google-auth-library");
const path_1 = __importDefault(require("path"));
const Logger_1 = require("../utils/Logger");
// Initialize Firebase Admin SDK
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];
const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID;
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;
const MAX_TOKENS_PER_REQUEST = 500;
async function getAccessToken() {
    try {
        const auth = new google_auth_library_1.GoogleAuth({
            keyFilename: path_1.default.join(process.cwd(), "config/lucky-adda-66b1e-6b87fdbb316c.json"),
            scopes: ["https://www.googleapis.com/auth/firebase.messaging"]
        });
        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        console.log(`accessToken`, accessToken);
        if (!accessToken.token) {
            throw new Error("Failed to retrieve access token.");
        }
        return accessToken.token;
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        throw error;
    }
}
// Function to send push notification
async function sendPushNotification({ token, title, body, data }) {
    try {
        const accessToken = await getAccessToken();
        console.log(`accessToken`, accessToken);
        const stringifiedData = {};
        if (data) {
            Object.keys(data).forEach((key) => {
                stringifiedData[key] = String(data[key]); // Convert values to string
            });
        }
        console.log(`stringifiedData`, stringifiedData);
        console.log(`token`, token);
        console.log(`title`, title);
        console.log(`body`, body);
        console.log(`FCM_URL`, FCM_URL);
        const message = {
            message: {
                token,
                notification: {
                    title,
                    body
                },
                data: {
                    title,
                    body,
                    ...stringifiedData
                }
            }
        };
        console.log(`message`, JSON.stringify(message));
        const response = await axios_1.default.post(FCM_URL, message, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });
        console.log(`response`, response);
        (0, Logger_1.logMessage)("access", `Push Notification Sent: ${JSON.stringify(response.data)}`);
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", JSON.stringify(error?.response?.data));
    }
}
