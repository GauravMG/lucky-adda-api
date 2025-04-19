"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const Logger_1 = require("../utils/Logger");
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : []
});
async function seedRoles() {
    try {
        const roles = [
            {
                roleId: 1,
                name: "Super admin",
                permissionJSON: null
            },
            {
                roleId: 2,
                name: "User",
                permissionJSON: null
            }
        ];
        for (const role of roles) {
            await prisma.role.upsert({
                where: { roleId: role.roleId },
                update: {
                    name: role.name,
                    permissionJSON: role.permissionJSON
                },
                create: {
                    roleId: role.roleId,
                    name: role.name,
                    permissionJSON: role.permissionJSON
                }
            });
        }
        (0, Logger_1.logMessage)("access", "Roles seeding completed!");
    }
    catch (error) {
        if (error instanceof Error) {
            (0, Logger_1.logMessage)("error", `${error.message}`);
        }
        else {
            (0, Logger_1.logMessage)("error", `An unknown error occurred`);
        }
    }
}
exports.default = seedRoles;
