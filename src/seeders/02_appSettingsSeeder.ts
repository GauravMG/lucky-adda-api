import {PrismaClient} from "@prisma/client"
import {logMessage} from "../utils/Logger"

const prisma = new PrismaClient({
	log:
		process.env.NODE_ENV === "development"
			? ["query", "info", "warn", "error"]
			: []
})

async function seedAppSettings() {
	try {
		const appSettings = [
			{
				appSettingId: 1,
				isAppShutdown: false,
				appShutDownMessage: "This app is currently unavailable"
			}
		]

		for (const appSetting of appSettings) {
			await prisma.appSetting.upsert({
				where: {appSettingId: appSetting.appSettingId},
				update: {
					isAppShutdown: appSetting.isAppShutdown,
					appShutDownMessage: appSetting.appShutDownMessage
				},
				create: {
					appSettingId: appSetting.appSettingId,
					isAppShutdown: appSetting.isAppShutdown,
					appShutDownMessage: appSetting.appShutDownMessage
				}
			})
		}
		logMessage("access", "App settings seeding completed!")
	} catch (error) {
		if (error instanceof Error) {
			logMessage("error", `${error.message}`)
		} else {
			logMessage("error", `An unknown error occurred`)
		}
	}
}

export default seedAppSettings
