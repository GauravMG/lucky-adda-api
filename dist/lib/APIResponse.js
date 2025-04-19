"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    res;
    constructor(response) {
        this.res = response;
    }
    async successResponse(data) {
        const statusCode = data.statusCode ?? 200;
        return this.res.status(statusCode).json({
            success: true,
            status: statusCode,
            ...data
        });
    }
    async errorResponse(data) {
        const statusCode = data.statusCode ?? 422;
        if (!data.errorCode) {
            switch (statusCode) {
                case 400:
                    data.errorCode = "unexpected_error";
                    break;
                case 401:
                    data.errorCode = "unauthorized";
                    break;
                case 403:
                    data.errorCode = "not_enough_permissions";
                    break;
                case 404:
                    data.errorCode = "not_found";
                    break;
                default:
                    data.errorCode = "internal_server_error";
                    break;
            }
        }
        return this.res.status(statusCode).json({
            success: false,
            status: statusCode,
            message: data?.message,
            code: data.errorCode,
            data: data.data
        });
    }
}
exports.ApiResponse = ApiResponse;
