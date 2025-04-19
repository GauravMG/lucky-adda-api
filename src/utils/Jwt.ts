import {NextFunction, Request, Response} from "express"
import jwt from "jsonwebtoken"

import publicRoutes from "../../schemas/publicRoutes.json"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {
	BadRequestException,
	UnauthorizedException,
	UpdateAvailable
} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import {UrlSchema} from "../types/common"

// Secret keys (should be stored securely, e.g., in environment variables)
const ACCESS_TOKEN_SECRET: string = process.env.JWT_SECRET_KEY as string

// Function to create a JWT token
export const createJWTToken = (
	payload: object,
	expiresIn: string = process.env.JWT_TOKEN_EXPIRATION as string
): string => {
	return jwt.sign(payload, ACCESS_TOKEN_SECRET, {expiresIn})
}

// Middleware to validate the JWT token
export const validateJWTToken = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const reqUrl: string = req.url
		const reqMethod: string = req.method

		const publicApi: UrlSchema | undefined = publicRoutes.find(
			(el) => el.apiPath === reqUrl && el.method === reqMethod
		)
		if (publicApi) {
			return next()
		}

		let token: string = req.headers.authorization as string
		if (!token) {
			throw new UnauthorizedException("Missing authorization header")
		}

		token = token.replace("Bearer ", "").trim()

		const decoded = await jwt.verify(
			token,
			process.env.JWT_SECRET_KEY as string
		)
		if (!decoded) {
			throw new UnauthorizedException("Invalid token")
		}
		const userId =
			typeof decoded === "string"
				? (JSON.parse(decoded)?.userId ?? null)
				: (decoded?.userId ?? null)
		if (!userId) {
			throw new UnauthorizedException("User does not exist")
		}

		const commonModelAppSetting = new CommonModel(
			"AppSetting",
			"appSettingId",
			[]
		)
		const commonModelUser = new CommonModel("User", "userId", [])
		const commonModelLoginHistory = new CommonModel(
			"LoginHistory",
			"loginHistoryId",
			[]
		)
		const commonModelAppVersion = new CommonModel(
			"AppVersion",
			"appVersionId",
			[]
		)

		console.log(
			`req.headers.devicetype as string`,
			req.headers.devicetype as string
		)
		const [[appSetting], [user], [loginHistory], [appVersion]] =
			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await Promise.all([
						commonModelAppSetting.list(transaction, {
							range: {
								page: 1,
								pageSize: 1
							}
						}),

						commonModelUser.list(transaction, {
							filter: {
								userId
							}
						}),

						commonModelLoginHistory.list(transaction, {
							filter: {
								userId
							}
						}),

						commonModelAppVersion.list(transaction, {
							filter: {
								deviceType: (req.headers.devicetype as string) ?? "android"
							},
							range: {
								page: 1,
								pageSize: 1
							},
							sort: [
								{
									orderBy: "appVersionId",
									orderDir: "desc"
								}
							]
						})
					])
				}
			)
		if (!user) {
			throw new UnauthorizedException("User does not exist")
		}
		if (Number(user.roleId) !== 1 && appSetting.isAppShutdown) {
			throw new BadRequestException(
				appSetting.appShutDownMessage,
				"app_shutdown"
			)
		}
		if (!loginHistory) {
			throw new UnauthorizedException("Please login again")
		}
		if (!user.status) {
			throw new UnauthorizedException(
				"Your account is in-active. Please contact admin."
			)
		}

		console.log(
			`req.headers.versionnumber as string`,
			req.headers.versionnumber as string
		)
		console.log(`appVersion.versionNumber`, appVersion.versionNumber)
		console.log(`loginHistory.versionNumber`, loginHistory.versionNumber)
		const appVersionNumber: string =
			(req.headers.versionnumber as string) ?? "1.0.0"

		if (appVersionNumber !== loginHistory.versionNumber) {
			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					await commonModelLoginHistory.updateById(
						transaction,
						{
							versionNumber: appVersionNumber
						},
						loginHistory.loginHistoryId,
						user.userId
					)
				}
			)
		}

		console.log(
			`parseInt(appVersion.versionNumber.replace(/\./g, ""))`,
			parseInt(appVersion.versionNumber.replace(/\./g, ""))
		)
		console.log(
			`parseInt(appVersionNumber.replace(/\./g, ""))`,
			parseInt(appVersionNumber.replace(/\./g, ""))
		)
		if (
			parseInt(appVersion.versionNumber.replace(/\./g, "")) >
			parseInt(appVersionNumber.replace(/\./g, ""))
		) {
			throw new UpdateAvailable("App update available")
		}

		req.headers.userId = user.userId
		req.headers.roleId = user.roleId
		req.headers.userFullName = JSON.stringify({
			fullName: user.fullName
		})

		next()
	} catch (error) {
		next(error)
	}
}
