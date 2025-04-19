"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.runSeeders = runSeeders;
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Logger_1 = require("../utils/Logger");
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : []
});
async function runSeeders() {
    try {
        // Access command-line arguments
        const args = process.argv.slice(2);
        // Parse the arguments
        const options = args.reduce((acc, arg) => {
            const [key, value] = arg.split("=");
            acc[key.replace("--", "")] = value;
            return acc;
        }, {});
        const seederFiles = fs_1.default.readdirSync(path_1.default.join(process.cwd(), `${options["build-dir"]}/seeders`));
        for (const file of seederFiles) {
            const seederModule = await Promise.resolve(`${path_1.default.join(process.cwd(), `${options["build-dir"]}/seeders`, file)}`).then(s => __importStar(require(s)));
            const seeder = seederModule.default;
            (0, Logger_1.logMessage)("access", `Seeding ${file}...`);
            await seeder(exports.prisma);
        }
        (0, Logger_1.logMessage)("access", "All seeders executed successfully!");
        await exports.prisma.$disconnect();
    }
    catch (error) {
        (0, Logger_1.logMessage)("error", `Seeding failed: ${error.message}`);
        await exports.prisma.$disconnect();
    }
}
