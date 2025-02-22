import {Manipulator, Timestamp} from "./common"

export enum VerificationFor {
	AUTH = "authentication",
	UPDATE = "updateDetails"
}

export enum Role {
	SUPER_ADMIN = 1,
	USER = 2
}

export enum LogInWith {
	GOOGLE = "google",
	FACEBOOK = "facebook",
	TWITTER = "twitter",
	LINKEDIN = "linkedin",
	EMAIL = "email",
	MOBILE = "mobile"
}

export enum VerificationType {
	Login_OTP = "login_otp"
}

export type CredentialTableData = {
	credentialId: number
	userId: number
	userName: string
	password: string
	logInWith: string
	status: boolean
} & Manipulator &
	Timestamp

export type VerificationTableData = {
	verificationId: number
	verificationType: VerificationType
	value: string
	otp: string
	isVerified: boolean
	verificationFor: VerificationFor
	status: boolean
} & Manipulator &
	Timestamp

export type VerificationDetails = {
	verificationId: number
	verificationType: VerificationType
	value: string
	otp: string
	isVerified: boolean
	verificationFor: VerificationFor
	status: boolean
}

export type CredentialDetails = {
	credentialId: number
	userId: number
	userName: string
	password: string
	logInWith: LogInWith
	status: boolean
}

export type CreateCredentialPayload = {
	userId: number
	userName: string
	password?: string
	googleId?: string
	logInWith: LogInWith
}

export type SignInPayload = {
	userName: string
	password: string
}

export type VerifyOtpPayload = {
	userName?: string
	hash?: string
	otp: number
}

export type ResetPasswordPayload = {
	otp: number
	password: string
	hash: string
}

export type SendOtpPayload = {
	userName: string
}

export type DecryptData = {
	userId: number
	email: string
}

export type UserData = {
	userId: number
	clientId?: number
}[]

export type Hash = {
	hash: string
	isResend?: boolean
}

export type CreateCredentialSchema = {
	userId?: number
	userName: string
	password?: string
	logInWith: LogInWith
}

export type GetMe = {
	userName: string
	password: string
	logInWith: LogInWith
}
