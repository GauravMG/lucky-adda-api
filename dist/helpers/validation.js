"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;
function validateEmail(email) {
    const emailRegex = new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/);
    const isValidEmail = emailRegex.test(email);
    return isValidEmail;
}
function validatePassword(password) {
    const rules = {
        minLength: {
            rule: password.length >= 8,
            message: "Must be at least 8 characters!"
        },
        hasNumber: {
            rule: /[0-9]/.test(password),
            message: "Must contain at least 1 number!"
        },
        hasUpperCase: {
            rule: /[A-Z]/.test(password),
            message: "Must contain at least 1 in Capital Case!"
        },
        hasLowerCase: {
            rule: /[a-z]/.test(password),
            message: "Must contain at least 1 in Small Case!"
        },
        hasSpecialChar: {
            rule: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            message: "Must contain at least 1 in Special Case!"
        },
        hasNoSpaces: {
            rule: /^[^\s]+$/.test(password),
            message: "Password cannot contain Space!"
        }
    };
    // Generate the response object
    const response = {
        valid: true, // Overall validity
        rules: {}
    };
    // Check each rule and update the response
    for (const [key, value] of Object.entries(rules)) {
        response.rules[key] = {
            passed: value.rule,
            message: value.message
        };
        // If any rule fails, set overall validity to false
        if (!value.rule) {
            response.valid = false;
        }
    }
    return response;
}
