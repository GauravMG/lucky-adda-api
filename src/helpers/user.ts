export function splitFullName(fullName: string) {
	// Trim spaces and split into name parts
	const nameParts: string[] = fullName.trim().split(/\s+/) // Use regex to handle multiple spaces

	// If there's only one part, it's the first name; no last name
	const firstName: string = nameParts[0] || ""
	const lastName: string =
		nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

	return {firstName, lastName}
}

export function generateReferralCode(userId) {
	return `${generateReferralCode(6)}-${userId}`
}
