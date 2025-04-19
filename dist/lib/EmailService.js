"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const ejs_1 = __importDefault(require("ejs"));
const node_mailjet_1 = __importDefault(require("node-mailjet"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const path_1 = __importDefault(require("path"));
const exceptions_1 = require("../lib/exceptions");
const notification_services_1 = require("../types/notification-services");
const Logger_1 = require("../utils/Logger");
const NotificationService_1 = require("./NotificationService");
async function sendEmailByNodemailer(configuration) {
    try {
        if (!configuration.template) {
            configuration.template = "default.ejs";
        }
        // node mailer config
        const config = {
            host: configuration.host,
            port: parseInt(configuration.port),
            auth: {
                user: configuration?.publicKey,
                pass: configuration?.privateKey
            }
        };
        const transport = nodemailer_1.default.createTransport(config);
        const emailArr = [];
        const ccEmailArr = [];
        const bccEmailArr = [];
        if (Array.isArray(configuration.emails)) {
            configuration.emails.forEach((email) => {
                emailArr.push({
                    Email: email
                });
            });
        }
        if (Array.isArray(configuration?.cc)) {
            configuration.cc.forEach((email) => {
                ccEmailArr.push(email);
            });
        }
        if (Array.isArray(configuration.bcc)) {
            configuration.bcc?.forEach((email) => {
                bccEmailArr.push(email);
            });
        }
        return new Promise((resolve, reject) => {
            ejs_1.default.renderFile(path_1.default.join(process.cwd(), `views/email/en/${configuration.template}`), configuration.payload ?? {}, (err, result) => {
                emailArr.forEach((_email) => {
                    if (err) {
                        (0, Logger_1.logMessage)("error", err?.message.toString());
                        return reject(err);
                    }
                    else {
                        const message = {
                            from: configuration.from,
                            to: _email.Email,
                            cc: ccEmailArr,
                            bcc: bccEmailArr,
                            subject: configuration.subject,
                            html: result,
                            attachments: configuration.attachments
                        };
                        transport.sendMail(message, function (err1, info) {
                            if (err1) {
                                (0, Logger_1.logMessage)("error", err1?.message.toString());
                                return reject(err1);
                            }
                            else {
                                return resolve(info);
                            }
                        });
                    }
                });
            });
        });
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        throw error;
    }
}
async function sendEmailByMailjet(configuration) {
    try {
        return new Promise(async (resolve, reject) => {
            if (!configuration.template) {
                configuration.template = "default.ejs";
            }
            const mailjet = node_mailjet_1.default.apiConnect(configuration.publicKey, configuration.privateKey);
            const emailArr = [];
            if (Array.isArray(configuration.emails)) {
                configuration.emails.forEach((email) => {
                    emailArr.push({
                        Email: email
                    });
                });
            }
            // for Cc mails
            const ccEmailArr = [];
            if (Array.isArray(configuration?.cc)) {
                configuration.cc.forEach((email) => {
                    ccEmailArr.push({
                        Email: email
                    });
                });
            }
            // for Bcc mails
            const bccEmailArr = [];
            if (Array.isArray(configuration?.bcc)) {
                configuration.bcc.forEach((email) => {
                    bccEmailArr.push({
                        Email: email
                    });
                });
            }
            ejs_1.default.renderFile(path_1.default.join(process.cwd(), `views/email/en/${configuration.template}`), configuration.payload ?? {}, (err, result) => {
                if (err) {
                    return reject(err);
                }
                mailjet
                    .post("send", { version: "v3.1" })
                    .request({
                    Messages: [
                        {
                            From: {
                                Email: configuration.from
                            },
                            To: emailArr,
                            Subject: configuration.subject,
                            TextPart: configuration.body,
                            HTMLPart: result
                        }
                    ]
                })
                    .then((result) => {
                    return resolve(result.body);
                })
                    .catch((err) => {
                    return reject(err.response.data);
                });
            });
        });
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        throw error;
    }
}
async function sendEmail(template, subject, emails, payload) {
    try {
        const notificationData = await (0, NotificationService_1.getActiveProvider)(notification_services_1.NotificationTypes.Email);
        if (!notificationData) {
            throw new exceptions_1.BadRequestException("Cannot send mail.");
        }
        const configuration = {
            publicKey: notificationData.configuration?.publicKey,
            privateKey: notificationData.configuration?.privateKey,
            host: notificationData.configuration?.host,
            port: notificationData.configuration?.port,
            emails,
            template: template.endsWith(".ejs") ? template : `${template}.ejs`,
            from: notificationData.configuration?.from,
            subject,
            payload
        };
        switch (notificationData.service) {
            case notification_services_1.NotificationServices.Google:
                sendEmailByNodemailer(configuration);
                break;
            case notification_services_1.NotificationServices.Mailjet:
                sendEmailByMailjet(configuration);
                break;
            default:
                throw new exceptions_1.BadRequestException("Cannot send mail.");
        }
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        // throw error
    }
}
