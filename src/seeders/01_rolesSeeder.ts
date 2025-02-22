import {PrismaClient} from "@prisma/client"
import {logMessage} from "../utils/Logger"

const prisma = new PrismaClient({
	log:
		process.env.NODE_ENV === "development"
			? ["query", "info", "warn", "error"]
			: []
})

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
		]

		for (const role of roles) {
			await prisma.role.upsert({
				where: {roleId: role.roleId},
				update: {
					name: role.name,
					permissionJSON: role.permissionJSON
				},
				create: {
					roleId: role.roleId,
					name: role.name,
					permissionJSON: role.permissionJSON
				}
			})
		}
		logMessage("access", "Roles seeding completed!")
	} catch (error) {
		if (error instanceof Error) {
			logMessage("error", `${error.message}`)
		} else {
			logMessage("error", `An unknown error occurred`)
		}
	}
}

export default seedRoles
