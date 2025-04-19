"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTypes = exports.NotificationServices = void 0;
var NotificationServices;
(function (NotificationServices) {
    NotificationServices["Mailjet"] = "mailjet";
    NotificationServices["Google"] = "google";
    NotificationServices["Fast2SMS"] = "fast2sms";
})(NotificationServices || (exports.NotificationServices = NotificationServices = {}));
var NotificationTypes;
(function (NotificationTypes) {
    NotificationTypes["Email"] = "email";
    NotificationTypes["SMS"] = "sms";
})(NotificationTypes || (exports.NotificationTypes = NotificationTypes = {}));
