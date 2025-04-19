"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middleware404 = exports.optionsMiddleware = exports.accessControl = void 0;
// access control middleware
const accessControl = (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, versionnumber, devicetype");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    next();
};
exports.accessControl = accessControl;
// optional middle ware
const optionsMiddleware = (req, res, next) => {
    if (req.method !== "OPTIONS") {
        next();
        return;
    }
    res.statusCode = 200;
    res.end("OK");
};
exports.optionsMiddleware = optionsMiddleware;
// 404 middleware
const middleware404 = (req, res, next) => {
    next({
        message: `No router for Requested URL ${req.originalUrl}`,
        statusCode: 404,
        errorCode: `not_found`
    });
};
exports.middleware404 = middleware404;
