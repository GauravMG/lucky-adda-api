"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitFullName = splitFullName;
exports.generateReferralCode = generateReferralCode;
function splitFullName(fullName) {
    // Trim spaces and split into name parts
    const nameParts = fullName.trim().split(/\s+/); // Use regex to handle multiple spaces
    // If there's only one part, it's the first name; no last name
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
    return { firstName, lastName };
}
function generateReferralCode(userId, length = 6) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    // Generate a random alphanumeric part
    for (let i = 0; i < length; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Convert userId to a Base36 string for uniqueness
    const userPart = Number(userId).toString(36).toUpperCase();
    // Combine both parts
    return `${randomPart}${userPart}`;
}
