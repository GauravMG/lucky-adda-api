import {PrismaClient} from "@prisma/client"
import {
	NotificationServices,
	NotificationTypes
} from "../types/notification-services"
import {logMessage} from "../utils/Logger"

const prisma = new PrismaClient({
	log:
		process.env.NODE_ENV === "development"
			? ["query", "info", "warn", "error"]
			: []
})

async function seedNotificationService() {
	try {
		/* start seeding sms tiara service */
		const fast2smsSMSNotificationServiceExists =
			await prisma.notificationService.findFirst({
				where: {
					service: NotificationServices.Fast2SMS,
					serviceType: NotificationTypes.SMS
				}
			})

		if (!fast2smsSMSNotificationServiceExists) {
			const notificationService: any = {
				service: NotificationServices.Fast2SMS,
				serviceType: NotificationTypes.SMS,
				host: "https://www.fast2sms.com/dev/bulkV2",
				configuration: {
					from: "",
					to: "",
					message: "Hey User",
					privateKey:
						"0J9sBDw3HmfiPUzYIA1CZFKONpg2VXa8t5kGEdrqSue6nQyTMo6LQFgmfoH13ev9RIKScEVCnayj7s2Z"
				},
				status: true
			}

			await prisma.notificationService.create({
				data: {
					...notificationService
				}
			})
		}
		/* end seeding sms tiara service */

		logMessage("access", "Notification service seeding completed!")
	} catch (error) {
		if (error instanceof Error) {
			logMessage("error", `${error.message}`)
		} else {
			logMessage("error", `An unknown error occurred`)
		}
	}
}

export default seedNotificationService
