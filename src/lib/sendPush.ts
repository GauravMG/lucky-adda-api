import admin from "./firebaseAdmin"

export const sendPushNotification = async (
	fcmToken: string,
	title: string,
	body: string,
	data: any
) => {
	try {
		const stringifiedData: Record<string, string> = {}
		if (data) {
			Object.keys(data).forEach((key) => {
				stringifiedData[key] = String(data[key]) // Convert values to string
			})
		}

		const message: any = {
			token: fcmToken,
			notification: {title, body},
			data: {
				type: "alert",
				message: title,
				data: stringifiedData
			}
			// android: {
			// 	notification: {sound: "default", channelId: "default-channel-id", priority: "high"}
			// },
			// apns: {payload: {aps: {sound: "default"}}}
		}

		const response = await admin.messaging().send(message)
		console.log("Push notification sent:", response)

		return response
	} catch (error) {
		console.error("Error sending notification:", error)
	}
}
