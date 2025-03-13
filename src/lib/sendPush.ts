import admin from "./firebaseAdmin"

export const sendPushNotification = async (
	fcmToken: string,
	title: string,
	body: string,
	data: any
) => {
	try {
		const message = {
			token: fcmToken,
			notification: {title, body},
			data: {
				type: "alert",
				message: title,
				...data
			},
			android: {
				notification: {sound: "default", channelId: "default-channel-id"}
			},
			apns: {payload: {aps: {sound: "default"}}}
		}

		const response = await admin.messaging().send(message)
		console.log("Push notification sent:", response)
	} catch (error) {
		console.error("Error sending notification:", error)
	}
}
