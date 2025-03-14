import admin from "firebase-admin"
import fs from "fs"
import path from "path"

// Ensure the service account JSON file is loaded correctly
const serviceAccountPath = path.join(
	process.cwd(),
	"config/lucky-adda-66b1e-6b87fdbb316c.json"
)
if (!fs.existsSync(serviceAccountPath)) {
	throw new Error("Firebase service account JSON file not found.")
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))

// Initialize Firebase Admin SDK
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
})

export default admin
