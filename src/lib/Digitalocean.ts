import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3"
import * as mime from "mime-types"
import * as fs from "fs/promises"

const DIGITAL_OCEAN_ENDPOINT: string = process.env
	.DIGITAL_OCEAN_ENDPOINT as string
const DIGITAL_OCEAN_ACCESS_KEY: string = process.env
	.DIGITAL_OCEAN_ACCESS_KEY as string
const DIGITAL_OCEAN_SECRET_KEY: string = process.env
	.DIGITAL_OCEAN_SECRET_KEY as string
const DIGITAL_OCEAN_SPACE_NAME: string = process.env
	.DIGITAL_OCEAN_SPACE_NAME as string
const DIGITAL_OCEAN_REGION: string = process.env.DIGITAL_OCEAN_REGION as string

// S3 client configuration
const s3Client = new S3Client({
	endpoint: DIGITAL_OCEAN_ENDPOINT,
	region: DIGITAL_OCEAN_REGION,
	credentials: {
		accessKeyId: DIGITAL_OCEAN_ACCESS_KEY,
		secretAccessKey: DIGITAL_OCEAN_SECRET_KEY
	}
})

/**
 * Sanitizes the filename by removing spaces, special characters, and adding a unique identifier.
 * @param originalFilename - The original filename with extension.
 * @returns - A sanitized and unique filename.
 */
function sanitizeFilename(originalFilename: string): string {
	// Extract the file extension
	const extension = originalFilename.split(".").pop() || ""
	const baseName = originalFilename
		.replace(/\.[^/.]+$/, "") // Remove the extension
		.replace(/[^a-zA-Z0-9]/g, "_") // Replace spaces and special characters with underscores
		.toLowerCase() // Convert to lowercase

	// Return the sanitized and unique filename
	return `${baseName}_${Date.now()}.${extension}`
}

/**
 * Uploads a single file to DigitalOcean Spaces and returns the file's public URL.
 * @param filePath - The local file path to upload.
 * @param key - The desired key (file path) in the space.
 * @returns - The public URL of the uploaded file.
 */
export async function uploadSingleFile(filePath: string): Promise<string> {
	try {
		// Read the file into a buffer
		const fileContent = await fs.readFile(filePath)

		// Extract the original filename
		const originalFilename: string = filePath.split("/").pop() || "file"

		// Sanitize the filename
		const sanitizedFilename: string = sanitizeFilename(originalFilename)

		// Get the content type (MIME type) based on the file extension
		const contentType: string =
			mime.lookup(filePath) || "application/octet-stream"

		// Prepare the S3 upload command
		const command = new PutObjectCommand({
			Bucket: DIGITAL_OCEAN_SPACE_NAME,
			Key: sanitizedFilename,
			Body: fileContent,
			ACL: "public-read",
			ContentType: contentType
		})

		// Upload the file to DigitalOcean Spaces
		await s3Client.send(command)

		// Delete the temporary file after successful upload
		await fs.unlink(filePath)

		// Return the file URL
		return `${DIGITAL_OCEAN_ENDPOINT.replace("https://", `https://${DIGITAL_OCEAN_SPACE_NAME}.`)}/${sanitizedFilename}`
	} catch (error) {
		console.error("Error uploading file:", error)
		throw new Error("File upload failed")
	}
}

/**
 * Uploads multiple files to DigitalOcean Spaces and returns their public URLs.
 * @param files - Array of objects containing `filePath` and `key`.
 * @returns - An array of public URLs of the uploaded files.
 */
export const uploadMultipleFiles = async (
	files: {filePath: string}[]
): Promise<string[]> => {
	try {
		const uploadPromises = files.map(({filePath}) => uploadSingleFile(filePath))
		const urls = await Promise.all(uploadPromises)
		return urls
	} catch (error) {
		console.error("Error uploading multiple files:", error)
		throw new Error("Failed to upload multiple files.")
	}
}
