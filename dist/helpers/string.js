"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snakeToPascal = void 0;
exports.snakeToKebab = snakeToKebab;
exports.generateRandomNumber = generateRandomNumber;
/**
 * Function to convert a snake_case string to kebab-case
 * @param input - The snake_case string to convert
 * @returns The converted kebab-case string
 */
function snakeToKebab(input) {
    if (typeof input !== "string") {
        throw new TypeError("Input must be a string");
    }
    return input.replace(/_/g, "-");
}
const snakeToPascal = (snake) => {
    return snake
        .split("_") // Split the string into parts using underscores
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(" "); // Join all parts without underscores
};
exports.snakeToPascal = snakeToPascal;
function generateRandomNumber() {
    return Math.floor(Math.random() * (999 - 100 + 1)) + 100;
}
