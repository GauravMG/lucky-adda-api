"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringCaseSkipping = stringCaseSkipping;
exports.escapeJSONString = escapeJSONString;
const is_json_1 = __importDefault(require("is-json"));
// single quote double qoute case
async function stringCaseSkipping(dataString) {
    //  return dataString
    if (dataString.includes("'")) {
        const stringArr = dataString.split("'");
        const stringFormat = stringArr.map((el) => el.indexOf("'") ? el.replace(/'/g, "''") : el);
        return stringFormat.join("''");
    }
    else if (dataString.includes('"')) {
        const stringArr = dataString.split('"');
        const stringFormat = stringArr.map((el) => el.indexOf('"') ? el.replace(/"/g, '"') : el);
        return stringFormat.join('"');
    }
    return dataString;
}
async function escapeJSONString(inputData) {
    // inputData = JSON.parse(inputData)
    // start treating json
    if (inputData) {
        if (typeof inputData === "object" && Array.isArray(inputData)) {
            const newData = [];
            for (let el of inputData) {
                newData.push(await escapeJSONString(el));
            }
            inputData = newData;
        }
        else if (typeof inputData === "object" && !Array.isArray(inputData)) {
            const objectKeys = Object.keys(inputData);
            for (let objectKey of objectKeys) {
                inputData[objectKey] = await escapeJSONString(inputData[objectKey]);
            }
        }
        else if (typeof inputData === "string" && (0, is_json_1.default)(inputData)) {
            const newObject = JSON.parse(inputData);
            const objectKeys = Object.keys(newObject);
            for (let objectKey of objectKeys) {
                newObject[objectKey] = await escapeJSONString(newObject[objectKey]);
            }
            inputData = JSON.stringify(newObject);
        }
        else if (typeof inputData === "string" && !(0, is_json_1.default)(inputData)) {
            inputData = await stringCaseSkipping(inputData);
        }
        else {
            return inputData;
        }
    }
    // end treating json
    // return JSON.stringify(inputData)
    return inputData;
}
