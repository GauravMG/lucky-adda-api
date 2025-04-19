"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const PrismaLib_1 = require("./lib/PrismaLib");
const APIMiddlewares_1 = require("./middlewares/APIMiddlewares");
const ErrorHandler_1 = require("./middlewares/ErrorHandler");
const MainRouter_1 = __importDefault(require("./routes/MainRouter"));
const cronService_1 = __importDefault(require("./services/cronService"));
const Jwt_1 = require("./utils/Jwt");
const Logger_1 = require("./utils/Logger");
// import {sendPushNotification} from "./lib/sendPush"
const FCMService_1 = require("./lib/FCMService");
const PORT = process.env.PORT;
const BASE_URL_API = process.env.BASE_URL_API;
const app = (0, express_1.default)();
// Access-Control-Allow-Origin
app.use(APIMiddlewares_1.accessControl);
// Middleware
app.use((0, cors_1.default)()); // Cross-Origin Resource Sharing
app.use((0, compression_1.default)()); // Gzip Compression
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: "50mb", extended: true }));
app.use(express_1.default.static(path_1.default.join(process.cwd(), "public")));
app.use(APIMiddlewares_1.optionsMiddleware);
// use helmet for Security headers
app.use(helmet_1.default.contentSecurityPolicy());
app.use(helmet_1.default.crossOriginEmbedderPolicy());
app.use(helmet_1.default.crossOriginOpenerPolicy());
app.use(helmet_1.default.crossOriginResourcePolicy());
app.use(helmet_1.default.dnsPrefetchControl());
app.use(helmet_1.default.frameguard());
app.use(helmet_1.default.hidePoweredBy());
app.use(helmet_1.default.hsts());
app.use(helmet_1.default.ieNoOpen());
app.use(helmet_1.default.noSniff());
app.use(helmet_1.default.originAgentCluster());
app.use(helmet_1.default.permittedCrossDomainPolicies());
app.use(helmet_1.default.referrerPolicy());
app.use(helmet_1.default.xssFilter());
// Logging middleware for access logs
app.use((0, morgan_1.default)("combined", { stream: Logger_1.accessLogStream }));
app.use((0, morgan_1.default)("dev")); // Log to console in development
// Routes
app.get("/", async (req, res, next) => {
    res.status(200).send("This is lucky-adda-api repo running...");
});
app.get("/send-test-push", async (req, res, next) => {
    try {
        const fcmToken = req.query.fcmToken;
        // const response = await sendPushNotification(
        // 	fcmToken ??"evHfa8UvTPShSjQbzURgVM:APA91bGIxEX9zs1AFRj9ub3EBPoY-lvhvLMSEl1I_LTZvOyttbzO0h6MAPbKw5bCwo7YeQM2AcIUGviZblGU9oEN681P0s1Syxo_r2F3VBMT6A7RsV5YklE",
        // 	"Result Out",
        // 	"Result Out Now",
        // 	{}
        // )
        const response = await (0, FCMService_1.sendPushNotification)({
            token: fcmToken,
            title: `Result Out`,
            body: `Result Out Now`,
            data: {
            // referenceId: loadId
            }
        });
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
app.use(Jwt_1.validateJWTToken);
app.use(MainRouter_1.default);
// Route not found middleware
app.use("*", APIMiddlewares_1.middleware404);
// Error handling middleware to log errors to error logs
app.use(ErrorHandler_1.errorHandler);
// Initialize cron jobs
(0, cronService_1.default)();
app.listen(PORT, async () => {
    (0, Logger_1.logMessage)("access", `Server running on ${BASE_URL_API} on port ${PORT}`);
    (0, PrismaLib_1.runSeeders)();
});
