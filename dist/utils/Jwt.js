"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJWTToken = exports.createJWTToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const publicRoutes_json_1 = __importDefault(require("../../schemas/publicRoutes.json"));
const PrismaLib_1 = require("../lib/PrismaLib");
const exceptions_1 = require("../lib/exceptions");
const CommonModel_1 = __importDefault(require("../models/CommonModel"));
// Secret keys (should be stored securely, e.g., in environment variables)
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET_KEY;
// Function to create a JWT token
const createJWTToken = (payload, expiresIn = process.env.JWT_TOKEN_EXPIRATION) => {
    return jsonwebtoken_1.default.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn });
};
exports.createJWTToken = createJWTToken;
// Middleware to validate the JWT token
const validateJWTToken = async (req, res, next) => {
    try {
        const reqUrl = req.url;
        const reqMethod = req.method;
        const publicApi = publicRoutes_json_1.default.find((el) => el.apiPath === reqUrl && el.method === reqMethod);
        if (publicApi) {
            return next();
        }
        let token = req.headers.authorization;
        if (!token) {
            throw new exceptions_1.UnauthorizedException("Missing authorization header");
        }
        token = token.replace("Bearer ", "").trim();
        const decoded = await jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) {
            throw new exceptions_1.UnauthorizedException("Invalid token");
        }
        const userId = typeof decoded === "string"
            ? (JSON.parse(decoded)?.userId ?? null)
            : (decoded?.userId ?? null);
        if (!userId) {
            throw new exceptions_1.UnauthorizedException("User does not exist");
        }
        const commonModelAppSetting = new CommonModel_1.default("AppSetting", "appSettingId", []);
        const commonModelUser = new CommonModel_1.default("User", "userId", []);
        const commonModelLoginHistory = new CommonModel_1.default("LoginHistory", "loginHistoryId", []);
        const commonModelAppVersion = new CommonModel_1.default("AppVersion", "appVersionId", []);
        const [[appSetting], [user], [loginHistory], [appVersion]] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
            return await Promise.all([
                commonModelAppSetting.list(transaction, {
                    range: {
                        page: 1,
                        pageSize: 1
                    }
                }),
                commonModelUser.list(transaction, {
                    filter: {
                        userId
                    }
                }),
                commonModelLoginHistory.list(transaction, {
                    filter: {
                        userId
                    }
                }),
                commonModelAppVersion.list(transaction, {
                    filter: {
                        deviceType: req.headers.devicetype ?? "android"
                    },
                    range: {
                        page: 1,
                        pageSize: 1
                    },
                    sort: [
                        {
                            orderBy: "appVersionId",
                            orderDir: "desc"
                        }
                    ]
                })
            ]);
        });
        if (!user) {
            throw new exceptions_1.UnauthorizedException("User does not exist");
        }
        if (Number(user.roleId) !== 1 && appSetting.isAppShutdown) {
            throw new exceptions_1.BadRequestException(appSetting.appShutDownMessage, "app_shutdown");
        }
        if (!loginHistory) {
            throw new exceptions_1.UnauthorizedException("Please login again");
        }
        if (!user.status) {
            throw new exceptions_1.UnauthorizedException("Your account is in-active. Please contact admin.");
        }
        const appVersionNumber = req.headers.versionnumber ?? "1.0.0";
        if (appVersionNumber !== loginHistory.versionNumber) {
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                await commonModelLoginHistory.updateById(transaction, {
                    versionNumber: appVersionNumber
                }, loginHistory.loginHistoryId, user.userId);
            });
        }
        if (parseInt(appVersion.versionNumber.replace(/./g, "")) >
            parseInt(appVersionNumber.replace(/./g, ""))) {
            throw new exceptions_1.UpdateAvailable("App update available");
        }
        req.headers.userId = user.userId;
        req.headers.roleId = user.roleId;
        req.headers.userFullName = JSON.stringify({
            fullName: user.fullName
        });
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.validateJWTToken = validateJWTToken;
