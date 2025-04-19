"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = void 0;
exports.getTimeDifference = getTimeDifference;
exports.getTimeDifferenceBetween2Datestring = getTimeDifferenceBetween2Datestring;
exports.modifyDateTime = modifyDateTime;
const Logger_1 = require("../utils/Logger");
function getTimeDifference(dateTimeString) {
    try {
        // Parse the datetime string into a valid Date object
        const specificTime = new Date(dateTimeString.replace(" ", "T")); // Add 'T' to make it ISO 8601 compliant
        const now = new Date();
        // Calculate the difference in milliseconds
        const differenceInMs = now - specificTime;
        // Convert to units
        const seconds = Math.floor(differenceInMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        return { seconds, minutes, hours, days };
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        throw error;
    }
}
function getTimeDifferenceBetween2Datestring(dateTimeString1, dateTimeString2) {
    try {
        // Parse the datetime string into a valid Date object
        const dateTime1 = new Date(dateTimeString1.replace(" ", "T")); // Add 'T' to make it ISO 8601 compliant
        const dateTime2 = new Date(dateTimeString2.replace(" ", "T")); // Add 'T' to make it ISO 8601 compliant
        // Calculate the difference in milliseconds
        const differenceInMs = dateTime1 - dateTime2;
        // Convert to units
        const seconds = Math.floor(differenceInMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        return { seconds, minutes, hours, days };
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        throw error;
    }
}
// Format the estimated arrival in Y-m-d H:i:s
const formatDate = (date) => {
    try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        throw error;
    }
};
exports.formatDate = formatDate;
function modifyDateTime(dateTimeString, minutesToModify) {
    try {
        const date = new Date(dateTimeString); // Ensure ISO format
        // Add or subtract minutes
        date.setMinutes(date.getMinutes() + minutesToModify);
        // Format the output correctly
        const formattedDate = date
            .toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        })
            .replace(",", ""); // Remove comma
        return formattedDate;
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", error?.message.toString());
        throw error;
    }
}
