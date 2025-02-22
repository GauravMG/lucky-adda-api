import axios from "axios"

import {BadRequestException} from "../lib/exceptions"
import {
	ActiveNotificationService,
	Configuration,
	NotificationTypes,
	SendSMSPayload
} from "../types/notification-services"
import {logMessage} from "../utils/Logger"
import {getActiveProvider} from "./NotificationService"

async function sendSmsWithTiara(configuration: Configuration) {
	try {
		if (!configuration?.host || !configuration?.payload?.length) {
			throw new BadRequestException("Cannot send SMS.")
		}

		for (let {mobile, message} of configuration.payload) {
			const response = await axios.post(
				configuration.host,
				{
					from: configuration.from,
					to: mobile,
					message: message
				},
				{
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${configuration.privateKey}`
					}
				}
			)

			logMessage("access", JSON.stringify(response.data))
		}
	} catch (error: any) {
		logMessage("error", error?.message.toString())
		throw error
	}
}

export async function sendSMS(payload: SendSMSPayload[]) {
	try {
		const notificationData: ActiveNotificationService | null =
			await getActiveProvider(NotificationTypes.SMS)
		if (!notificationData) {
			throw new BadRequestException("Cannot send SMS.")
		}

		const configuration: Configuration = {
			privateKey: notificationData.configuration?.privateKey,
			host: notificationData.configuration?.host,
			from: notificationData.configuration?.from,
			payload
		}

		switch (notificationData.serviceType) {
			case NotificationTypes.SMS:
				await sendSmsWithTiara(configuration)
				break
			default:
				throw new BadRequestException("Cannot send SMS.")
		}
	} catch (error: any) {
		logMessage("error", error?.message.toString())
	}
}
