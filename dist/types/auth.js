"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationType = exports.LogInWith = exports.Role = exports.VerificationFor = void 0;
var VerificationFor;
(function (VerificationFor) {
    VerificationFor["AUTH"] = "authentication";
    VerificationFor["UPDATE"] = "updateDetails";
})(VerificationFor || (exports.VerificationFor = VerificationFor = {}));
var Role;
(function (Role) {
    Role[Role["SUPER_ADMIN"] = 1] = "SUPER_ADMIN";
    Role[Role["USER"] = 2] = "USER";
})(Role || (exports.Role = Role = {}));
var LogInWith;
(function (LogInWith) {
    LogInWith["GOOGLE"] = "google";
    LogInWith["FACEBOOK"] = "facebook";
    LogInWith["TWITTER"] = "twitter";
    LogInWith["LINKEDIN"] = "linkedin";
    LogInWith["EMAIL"] = "email";
    LogInWith["MOBILE"] = "mobile";
})(LogInWith || (exports.LogInWith = LogInWith = {}));
var VerificationType;
(function (VerificationType) {
    VerificationType["Login_OTP"] = "login_otp";
})(VerificationType || (exports.VerificationType = VerificationType = {}));
