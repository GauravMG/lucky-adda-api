"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptionByCrypto = encryptionByCrypto;
exports.decryptBycrypto = decryptBycrypto;
const crypto_1 = __importDefault(require("crypto"));
// get data from configuration
const encryptCred = {
    secret_key: process.env.CRYPTO_SECRET_KEY,
    secret_iv: process.env.CRYPTO_SECRET_IV,
    encryption_method: process.env.CRYPTO_ENCRYPTION_METHOD
};
// Generate secret hash with crypto to use for encryption
const key = crypto_1.default.createHash("sha256")
    .update(encryptCred.secret_key)
    .digest("hex")
    .substring(0, 32);
const encryptionIV = crypto_1.default.createHash("sha256")
    .update(encryptCred.secret_iv)
    .digest("hex")
    .substring(0, 16);
// encrypt by crypto aes 256
async function encryptionByCrypto(data) {
    data = typeof data === "object" ? JSON.stringify(data) : data;
    if (!encryptCred.secret_key ||
        !encryptCred.secret_iv ||
        !encryptCred.encryption_method) {
        throw new Error("secretKey, secretIV, and encryption Method are required.");
    }
    // Encrypt data
    const cipher = crypto_1.default.createCipheriv(encryptCred.encryption_method, key, encryptionIV);
    return Buffer.from(cipher.update(data, "utf8", "hex") + cipher.final("hex")).toString("base64");
}
// decrypt by crypto aes 256
async function decryptBycrypto(encryptedData) {
    const buff = Buffer.from(encryptedData, "base64");
    const decipher = crypto_1.default.createDecipheriv(encryptCred.encryption_method, key, encryptionIV);
    return JSON.parse(decipher.update(buff.toString("utf8"), "hex", "utf8") +
        decipher.final("utf8"));
}
