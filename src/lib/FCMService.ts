import axios from "axios"
import {GoogleAuth} from "google-auth-library"

import {logMessage} from "../utils/Logger"

// Initialize Firebase Admin SDK
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"]
const FCM_PROJECT_ID = process.env.FCM_PROJECT_ID
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`
const MAX_TOKENS_PER_REQUEST = 500

type PushNotificationPayload = {
	token: string
	notification: {
		title: string
		body: string
	}
	data?: any
}

export async function getAccessToken(): Promise<string> {
	try {
		const auth = new GoogleAuth({
			scopes: SCOPES
		})

		const client = await auth.getClient()
		const accessToken = await client.getAccessToken()

		if (!accessToken.token) {
			throw new Error("Failed to retrieve access token.")
		}

		return accessToken.token
	} catch (error: any) {
		logMessage("error", error?.message.toString())
		throw error
	}
}

// Function to send push notification
export async function sendPushNotification({
	token,
	title,
	body,
	data
}): Promise<void> {
	try {
		const accessToken = await getAccessToken()

		const stringifiedData: Record<string, string> = {}
		if (data) {
			Object.keys(data).forEach((key) => {
				stringifiedData[key] = String(data[key]) // Convert values to string
			})
		}

		const message: {message: PushNotificationPayload} = {
			message: {
				token,
				notification: {
					title,
					body
				},
				data: stringifiedData
			}
		}

		const response = await axios.post(FCM_URL, message, {
			headers: {
				"Authorization": `Bearer ${accessToken}`,
				"Content-Type": "application/json"
			}
		})

		logMessage(
			"access",
			`Push Notification Sent: ${JSON.stringify(response.data)}`
		)
	} catch (error: any) {
		logMessage("error", JSON.stringify(error?.response?.data))
	}
}
