"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransaction = void 0;
const axios_1 = __importDefault(require("axios"));
const exceptions_1 = require("../lib/exceptions");
const BASE_PATH = "https://payfromupi.com/api";
const PAY_FROM_UPI_APP_LOGIN_KEY = process.env
    .PAY_FROM_UPI_APP_LOGIN_KEY;
// Create an Axios instance with default config
const axiosObj = axios_1.default.create({
    baseURL: BASE_PATH,
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAY_FROM_UPI_APP_LOGIN_KEY}`
    }
});
const replaceKeywords = (message) => message.replace("Gateway Response: ", "");
const createTransaction = async (payload) => {
    try {
        const response = await axiosObj.post("/transactions/create", payload);
        const data = response.data;
        if (!data.success) {
            throw new exceptions_1.BadRequestException(replaceKeywords(data.message));
        }
        return data;
    }
    catch (error) {
        throw error;
    }
};
exports.createTransaction = createTransaction;
