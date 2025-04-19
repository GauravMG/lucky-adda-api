"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = generateOTP;
function generateOTP(length = 6) {
    const min = Math.pow(10, length - 1); // Smallest number with the desired length
    const max = Math.pow(10, length) - 1; // Largest number with the desired length
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
}
