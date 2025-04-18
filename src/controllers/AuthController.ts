import bcrypt from "bcrypt"
import {NextFunction, Request, Response} from "express"
import jwt from "jsonwebtoken"
import path from "path"

import {
	generateOTP,
	generateReferralCode,
	readFileContent,
	snakeToKebab
} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {sendSMS} from "../lib/SMSService"
import {BadRequestException, UnauthorizedException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import {Role, VerificationType} from "../types/auth"
import {Headers} from "../types/common"
import {createJWTToken} from "../utils/Jwt"

class AuthController {
	private commonModelUser
	private commonModelRole
	private commonModelVerification
	private commonModelLoginHistory

	private idColumnUser: string = "userId"
	private idColumnRole: string = "roleId"
	private idColumnVerification: string = "verificationId"
	private idColumnLoginHistory: string = "loginHistoryId"

	constructor() {
		this.commonModelUser = new CommonModel("User", this.idColumnUser, [
			"roleId",
			"fullName",
			"mobile"
		])
		this.commonModelRole = new CommonModel("Role", this.idColumnRole, ["name"])
		this.commonModelVerification = new CommonModel(
			"Verification",
			this.idColumnVerification,
			[]
		)
		this.commonModelLoginHistory = new CommonModel(
			"LoginHistory",
			this.idColumnLoginHistory,
			[]
		)

		this.sendOTP = this.sendOTP.bind(this)
		this.signInWithOTP = this.signInWithOTP.bind(this)
		this.getMe = this.getMe.bind(this)
		this.refreshToken = this.refreshToken.bind(this)
		this.logout = this.logout.bind(this)
	}

	private async validateUserAccount({
		verificationType,
		otp,
		password,
		...restPayload
	}: any) {
		try {
			const [user] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					let [user] = await this.commonModelUser.list(transaction, {
						...restPayload
					})
					if (!user) {
						throw new UnauthorizedException("User doesn't exist")
					}

					const {userId, roleId} = user

					const [role] = await this.commonModelRole.list(transaction, {
						filter: {
							roleId
						}
					})
					user = {
						...user,
						role
					}

					if ((password ?? "").toString().trim() !== "") {
						// check if account active or not
						if ((user.password ?? "").trim() !== "") {
							// throw new UnauthorizedException(
							// 	"Account not yet verified. Please check your registered email id for verification email sent to you at the time of creation of your account."
							// )

							// check if password matches
							const isValidPassword: boolean = await bcrypt.compare(
								password,
								user.password
							)
							if (!isValidPassword) {
								throw new UnauthorizedException("Incorrect password")
							}
						}
					}

					if ((otp ?? "").toString().trim() !== "") {
						const [otpResult] = await this.commonModelVerification.list(
							transaction,
							{
								filter: {
									userId,
									verificationType
								},
								range: {
									page: 1,
									pageSize: 1
								}
							}
						)

						if (!otpResult) {
							throw new UnauthorizedException("Please generate OTP again")
						}

						if (otpResult.hash !== otp.toString()) {
							throw new UnauthorizedException("Invalid OTP entered")
						}

						await this.commonModelVerification.softDeleteByFilter(
							transaction,
							{userId, verificationType},
							userId
						)
					}

					// check personal info flag
					user.isPersonalInfoCompleted = false
					if ((user.fullName ?? "").trim() !== "") {
						user.isPersonalInfoCompleted = true
					}

					// check if account active or not
					if (!user.status && user.isPersonalInfoCompleted) {
						throw new UnauthorizedException(
							"Your account is in-active. Please contact admin."
						)
					}

					return [user]
				}
			)

			return user
		} catch (error) {
			throw error
		}
	}

	public async sendOTP(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {mobile, verificationType, isResend, isForgotPassword} = req.body

			const otp: string = generateOTP(6)

			const [user] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					let isPersonalInfoCompleted: boolean = true

					// check if mobile exists
					let [existingUser] = await this.commonModelUser.list(transaction, {
						filter: {
							mobile
						}
					})
					if (!existingUser) {
						existingUser = await this.commonModelUser.bulkCreate(transaction, [
							{
								roleId: Role.USER,
								mobile
							}
						])
						existingUser = existingUser[0]
						isPersonalInfoCompleted = false
					}

					const {userId} = existingUser

					if ((existingUser.referralCode ?? "").trim() === "") {
						const referralCode: string = generateReferralCode(userId)
						await this.commonModelUser.updateById(
							transaction,
							{referralCode},
							userId,
							userId
						)
						existingUser.referralCode = referralCode
					}

					// mark previous hash as used
					await this.commonModelVerification.softDeleteByFilter(
						transaction,
						{userId, verificationType},
						userId
					)

					await this.commonModelVerification.bulkCreate(
						transaction,
						[
							{
								userId,
								hash: otp.toString(),
								verificationType
							}
						],
						userId
					)

					return [{...existingUser, isPersonalInfoCompleted}]
				}
			)

			if (!user.status) {
				throw new UnauthorizedException(
					"Your account is in-active. Please contact admin."
				)
			}

			// send sms
			let smsText: string = ""
			let message: string = ""
			if (!user.isPersonalInfoCompleted || isForgotPassword) {
				switch (verificationType) {
					case VerificationType.Login_OTP:
						smsText =
							readFileContent(
								path.join(
									process.cwd(),
									`views/sms/en/${snakeToKebab(isForgotPassword ? "forgot_password_otp" : verificationType)}.txt`
								),
								{otp}
							) ?? ""
						message = `A SMS has been ${isResend ? "re" : ""}sent on your mobile number.`

						break

					default:
						smsText =
							readFileContent(
								path.join(process.cwd(), `views/sms/en/default-otp.txt`),
								{otp}
							) ?? ""
						message = `A SMS has been ${isResend ? "re" : ""}sent on your mobile number.`

						break
				}
				// sendSMS([{mobile, message: smsText}])
			}

			return response.successResponse({
				message,
				data: {
					mobile,
					roleId: user.roleId,
					isPersonalInfoCompleted: user.isPersonalInfoCompleted,
					isForgotPassword,
					otp
				}
			})
		} catch (error) {
			next(error)
		}
	}

	public async signInWithOTP(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {
				verificationType,
				mobile,
				otp,
				password,
				deviceType,
				deviceId,
				fcmToken
			} = req.body
			console.log(`fcmToken`, fcmToken)
			console.log(`fcmToken`, JSON.stringify(fcmToken))

			const user = await this.validateUserAccount({
				filter: {mobile},
				verificationType: verificationType ?? VerificationType.Login_OTP,
				otp,
				password
			})
			const {userId} = user

			// generate jwt token
			const jwtToken: string = createJWTToken({
				userId
			})

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// create login history
					await this.commonModelLoginHistory.bulkCreate(
						transaction,
						[
							{
								userId,
								jwtToken,
								deviceType,
								deviceId,
								fcmToken
							}
						],
						userId
					)
				}
			)

			return response.successResponse({
				message: `Logged in successfully`,
				jwtToken,
				data: user
			})
		} catch (error) {
			next(error)
		}
	}

	public async getMe(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId}: Headers = req.headers

			const user = await this.validateUserAccount({filter: {userId}})

			return response.successResponse({
				message: `My details`,
				data: user
			})
		} catch (error) {
			next(error)
		}
	}

	public async refreshToken(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			let accessToken: string = req.headers.authorization as string
			if (!accessToken) {
				throw new BadRequestException(
					"Missing authorization header.",
					"invalid_token"
				)
			}

			accessToken = accessToken.replace("Bearer ", "").trim()

			let decodedToken: any = jwt.decode(accessToken)
			if (!decodedToken) {
				throw new BadRequestException("Invalid token.", "invalid_token")
			}

			const user = await this.validateUserAccount({
				filter: {userId: decodedToken.userId}
			})

			// @ts-ignore
			delete decodedToken.iat
			// @ts-ignore
			delete decodedToken.exp
			// @ts-ignore
			delete decodedToken.nbf
			// @ts-ignore
			delete decodedToken.jti

			// generate new token
			const jwtToken: string = createJWTToken(decodedToken)

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// update login history
					await this.commonModelLoginHistory.updateByFilters(
						transaction,
						{
							jwtToken
						},
						{
							jwtToken: accessToken,
							userId: user.userId
						},
						user.userId
					)
				}
			)

			return response.successResponse({
				message: `Logged in successfully`,
				jwtToken,
				data: user
			})
		} catch (error) {
			next(error)
		}
	}

	public async logout(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			let jwtToken: string = req.headers.authorization as string
			if (!jwtToken) {
				throw new BadRequestException(
					"Missing authorization header.",
					"invalid_token"
				)
			}

			jwtToken = jwtToken.replace("Bearer ", "").trim()

			const {userId}: Headers = req.headers

			const user = await this.validateUserAccount({filter: {userId}})

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// update login history
					await this.commonModelLoginHistory.softDeleteByFilter(
						transaction,
						{
							jwtToken
						},
						user.userId
					)
				}
			)

			return response.successResponse({
				message: `Logged out successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new AuthController()
