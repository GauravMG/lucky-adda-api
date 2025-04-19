"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const helpers_1 = require("../helpers");
const APIResponse_1 = require("../lib/APIResponse");
const PrismaLib_1 = require("../lib/PrismaLib");
const exceptions_1 = require("../lib/exceptions");
const CommonModel_1 = __importDefault(require("../models/CommonModel"));
const auth_1 = require("../types/auth");
const Jwt_1 = require("../utils/Jwt");
class AuthController {
    commonModelUser;
    commonModelRole;
    commonModelVerification;
    commonModelLoginHistory;
    idColumnUser = "userId";
    idColumnRole = "roleId";
    idColumnVerification = "verificationId";
    idColumnLoginHistory = "loginHistoryId";
    constructor() {
        this.commonModelUser = new CommonModel_1.default("User", this.idColumnUser, [
            "roleId",
            "fullName",
            "mobile"
        ]);
        this.commonModelRole = new CommonModel_1.default("Role", this.idColumnRole, ["name"]);
        this.commonModelVerification = new CommonModel_1.default("Verification", this.idColumnVerification, []);
        this.commonModelLoginHistory = new CommonModel_1.default("LoginHistory", this.idColumnLoginHistory, []);
        this.sendOTP = this.sendOTP.bind(this);
        this.signInWithOTP = this.signInWithOTP.bind(this);
        this.getMe = this.getMe.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.logout = this.logout.bind(this);
    }
    async validateUserAccount({ verificationType, otp, password, ...restPayload }) {
        try {
            const [user] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                let [user] = await this.commonModelUser.list(transaction, {
                    ...restPayload
                });
                if (!user) {
                    throw new exceptions_1.UnauthorizedException("User doesn't exist");
                }
                const { userId, roleId } = user;
                const [role] = await this.commonModelRole.list(transaction, {
                    filter: {
                        roleId
                    }
                });
                user = {
                    ...user,
                    role
                };
                if ((password ?? "").toString().trim() !== "") {
                    // check if account active or not
                    if ((user.password ?? "").trim() !== "") {
                        // throw new UnauthorizedException(
                        // 	"Account not yet verified. Please check your registered email id for verification email sent to you at the time of creation of your account."
                        // )
                        // check if password matches
                        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
                        if (!isValidPassword) {
                            throw new exceptions_1.UnauthorizedException("Incorrect password");
                        }
                    }
                }
                if ((otp ?? "").toString().trim() !== "") {
                    const [otpResult] = await this.commonModelVerification.list(transaction, {
                        filter: {
                            userId,
                            verificationType
                        },
                        range: {
                            page: 1,
                            pageSize: 1
                        }
                    });
                    if (!otpResult) {
                        throw new exceptions_1.UnauthorizedException("Please generate OTP again");
                    }
                    if (otpResult.hash !== otp.toString()) {
                        throw new exceptions_1.UnauthorizedException("Invalid OTP entered");
                    }
                    await this.commonModelVerification.softDeleteByFilter(transaction, { userId, verificationType }, userId);
                }
                // check personal info flag
                user.isPersonalInfoCompleted = false;
                if ((user.fullName ?? "").trim() !== "") {
                    user.isPersonalInfoCompleted = true;
                }
                // check if account active or not
                if (!user.status && user.isPersonalInfoCompleted) {
                    throw new exceptions_1.UnauthorizedException("Your account is in-active. Please contact admin.");
                }
                return [user];
            });
            return user;
        }
        catch (error) {
            throw error;
        }
    }
    async sendOTP(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { mobile, verificationType, isResend, isForgotPassword } = req.body;
            const otp = (0, helpers_1.generateOTP)(6);
            const [user] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                let isPersonalInfoCompleted = true;
                // check if mobile exists
                let [existingUser] = await this.commonModelUser.list(transaction, {
                    filter: {
                        mobile
                    }
                });
                if (!existingUser) {
                    existingUser = await this.commonModelUser.bulkCreate(transaction, [
                        {
                            roleId: auth_1.Role.USER,
                            mobile
                        }
                    ]);
                    existingUser = existingUser[0];
                    isPersonalInfoCompleted = false;
                }
                const { userId } = existingUser;
                if ((existingUser.referralCode ?? "").trim() === "") {
                    const referralCode = (0, helpers_1.generateReferralCode)(userId);
                    await this.commonModelUser.updateById(transaction, { referralCode }, userId, userId);
                    existingUser.referralCode = referralCode;
                }
                // mark previous hash as used
                await this.commonModelVerification.softDeleteByFilter(transaction, { userId, verificationType }, userId);
                await this.commonModelVerification.bulkCreate(transaction, [
                    {
                        userId,
                        hash: otp.toString(),
                        verificationType
                    }
                ], userId);
                return [{ ...existingUser, isPersonalInfoCompleted }];
            });
            if (!user.status) {
                throw new exceptions_1.UnauthorizedException("Your account is in-active. Please contact admin.");
            }
            // send sms
            let smsText = "";
            let message = "";
            if (!user.isPersonalInfoCompleted || isForgotPassword) {
                switch (verificationType) {
                    case auth_1.VerificationType.Login_OTP:
                        smsText =
                            (0, helpers_1.readFileContent)(path_1.default.join(process.cwd(), `views/sms/en/${(0, helpers_1.snakeToKebab)(isForgotPassword ? "forgot_password_otp" : verificationType)}.txt`), { otp }) ?? "";
                        message = `A SMS has been ${isResend ? "re" : ""}sent on your mobile number.`;
                        break;
                    default:
                        smsText =
                            (0, helpers_1.readFileContent)(path_1.default.join(process.cwd(), `views/sms/en/default-otp.txt`), { otp }) ?? "";
                        message = `A SMS has been ${isResend ? "re" : ""}sent on your mobile number.`;
                        break;
                }
                // sendSMS([{mobile, message: smsText}])
            }
            return response.successResponse({
                message,
                data: {
                    mobile,
                    roleId: user.roleId,
                    isPersonalInfoCompleted: user.isPersonalInfoCompleted,
                    isForgotPassword,
                    otp
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async signInWithOTP(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { verificationType, mobile, otp, password, deviceType, deviceId, fcmToken } = req.body;
            console.log(`fcmToken`, fcmToken);
            console.log(`fcmToken`, JSON.stringify(fcmToken));
            const user = await this.validateUserAccount({
                filter: { mobile },
                verificationType: verificationType ?? auth_1.VerificationType.Login_OTP,
                otp,
                password
            });
            const { userId } = user;
            // generate jwt token
            const jwtToken = (0, Jwt_1.createJWTToken)({
                userId
            });
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                // create login history
                await this.commonModelLoginHistory.bulkCreate(transaction, [
                    {
                        userId,
                        jwtToken,
                        deviceType,
                        deviceId,
                        fcmToken
                    }
                ], userId);
            });
            return response.successResponse({
                message: `Logged in successfully`,
                jwtToken,
                data: user
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getMe(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId } = req.headers;
            const user = await this.validateUserAccount({ filter: { userId } });
            return response.successResponse({
                message: `My details`,
                data: user
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            let accessToken = req.headers.authorization;
            if (!accessToken) {
                throw new exceptions_1.BadRequestException("Missing authorization header.", "invalid_token");
            }
            accessToken = accessToken.replace("Bearer ", "").trim();
            let decodedToken = jsonwebtoken_1.default.decode(accessToken);
            if (!decodedToken) {
                throw new exceptions_1.BadRequestException("Invalid token.", "invalid_token");
            }
            const user = await this.validateUserAccount({
                filter: { userId: decodedToken.userId }
            });
            // @ts-ignore
            delete decodedToken.iat;
            // @ts-ignore
            delete decodedToken.exp;
            // @ts-ignore
            delete decodedToken.nbf;
            // @ts-ignore
            delete decodedToken.jti;
            // generate new token
            const jwtToken = (0, Jwt_1.createJWTToken)(decodedToken);
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                // update login history
                await this.commonModelLoginHistory.updateByFilters(transaction, {
                    jwtToken
                }, {
                    jwtToken: accessToken,
                    userId: user.userId
                }, user.userId);
            });
            return response.successResponse({
                message: `Logged in successfully`,
                jwtToken,
                data: user
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            let jwtToken = req.headers.authorization;
            if (!jwtToken) {
                throw new exceptions_1.BadRequestException("Missing authorization header.", "invalid_token");
            }
            jwtToken = jwtToken.replace("Bearer ", "").trim();
            const { userId } = req.headers;
            const user = await this.validateUserAccount({ filter: { userId } });
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                // update login history
                await this.commonModelLoginHistory.softDeleteByFilter(transaction, {
                    jwtToken
                }, user.userId);
            });
            return response.successResponse({
                message: `Logged out successfully`
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new AuthController();
