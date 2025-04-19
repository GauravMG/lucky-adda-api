"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Ensure the service account JSON file is loaded correctly
const serviceAccountPath = path_1.default.join(process.cwd(), "config/lucky-adda-66b1e-6b87fdbb316c.json");
if (!fs_1.default.existsSync(serviceAccountPath)) {
    throw new Error("Firebase service account JSON file not found.");
}
const serviceAccount = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, "utf8"));
// Initialize Firebase Admin SDK
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount)
});
exports.default = firebase_admin_1.default;
