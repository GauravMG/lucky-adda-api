import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import {NextFunction, Request, Response} from "express"
import * as profit from "../helpers/profit"

dayjs.extend(utc)
dayjs.extend(timezone)

import {generateRandomNumber, listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
// import {sendPushNotification} from "../lib/sendPush"
import {sendPushNotification} from "../lib/FCMService"
import CommonModel from "../models/CommonModel"
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, Headers} from "../types/common"
import {logMessage} from "../utils/Logger"

class PPPUserBetController {
	private commonModelPPPUserBet
	private commonModelPPPWallet
	private commonModelPPPSession
	private commonModelPPPImage
	private commonModelLoginHistory
	private commonModelUser

	private idColumnPPPUserBet: string = "userBetId"
	private idColumnPPPWallet: string = "walletId"
	private idColumnPPPSession: string = "sessionId"
	private idColumnPPPImage: string = "imageId"
	private idColumnLoginHistory: string = "loginHistoryId"
	private idColumnUser: string = "userId"

	constructor() {
		this.commonModelPPPUserBet = new CommonModel(
			"PPPUserBet",
			this.idColumnPPPUserBet,
			[]
		)
		this.commonModelPPPSession = new CommonModel(
			"PPPSession",
			this.idColumnPPPSession,
			[]
		)
		this.commonModelPPPWallet = new CommonModel(
			"PPPWallet",
			this.idColumnPPPWallet,
			[]
		)
		this.commonModelPPPImage = new CommonModel(
			"PPPImage",
			this.idColumnPPPImage,
			[]
		)
		this.commonModelLoginHistory = new CommonModel(
			"LoginHistory",
			this.idColumnLoginHistory,
			[]
		)
		this.commonModelUser = new CommonModel("User", this.idColumnUser, [])

		this.placeBet = this.placeBet.bind(this)
		this.listUserBet = this.listUserBet.bind(this)
		// this.finalizeGameResult = this.finalizeGameResult.bind(this)
	}

	// Bet payload for single
	public async userBetPayload(
		userId: number,
		imageIds: number[],
		sessionId: number,
		betAmount: string
	) {
		try {
			return imageIds.map((imageId) => ({
				userId,
				imageId,
				sessionId,
				betAmount,
				winningAmount: "0.0"
			}))
		} catch (error) {
			throw error
		}
	}

	// public async listGameResults(
	// 	req: Request,
	// 	res: Response,
	// 	next: NextFunction
	// ) {
	// 	try {
	// 		const response = new ApiResponse(res)

	// 		const {filter, range, sort} = await listAPIPayload(req.body)
	// 		const customFilters: any[] = []

	// 		const [data, total] = await prisma.$transaction(
	// 			async (transaction: PrismaClientTransaction) => {
	// 				let [session, total] = await Promise.all([
	// 					this.commonModelPPPSession.list(transaction, {
	// 						filter,
	// 						customFilters,
	// 						range,
	// 						sort
	// 					}),

	// 					this.commonModelPPPSession.list(transaction, {
	// 						filter,
	// 						customFilters,
	// 						isCountOnly: true
	// 					})
	// 				])

	// 				const sessionIds: number[] = session.map(({sessionId}) => sessionId)

	// 				const pppGameResults = await this.commonModelPPPGameResult.list(
	// 					transaction,
	// 					{
	// 						filter: {sessionId: sessionIds},
	// 						range: {all: true}
	// 					}
	// 				)

	// 				session = session.map((session) => {
	// 					const thisGameResults = pppGameResults.filter(
	// 						(sessionResult) => sessionResult.sessionId === session.sessionId
	// 					)

	// 					return {
	// 						...session,
	// 						gameResults: thisGameResults ?? [],
	// 						gameResultFinal: thisGameResults?.at(-1) ?? null
	// 					}
	// 				})

	// 				return [session, total]
	// 			}
	// 		)

	// 		return response.successResponse({
	// 			message: "Data",
	// 			metadata: {
	// 				total,
	// 				page: range?.page ?? DEFAULT_PAGE,
	// 				pageSize: range?.pageSize ?? DEFAULT_PAGE_SIZE
	// 			},
	// 			data
	// 		})
	// 	} catch (error) {
	// 		next(error)
	// 	}
	// }

	public async placeBet(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers
			const {sessionId, imageIds, betAmount} = req.body

			// Validate input fields
			if (!sessionId || !imageIds || !betAmount) {
				throw new BadRequestException("Missing required fields.")
			}

			// Prepare payload for user bet
			const payloadForUserBet: any = await this.userBetPayload(
				userId,
				imageIds,
				sessionId,
				betAmount
			)

			// Check if payload is valid
			if (!payloadForUserBet.length) {
				throw new BadRequestException("User bet payload unable to create.")
			}

			const [session, images, data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const session = await this.commonModelPPPSession.list(transaction, {
						filter: {sessionId}
					})

					const images = await this.commonModelPPPImage.list(transaction, {
						filter: {imageId: imageIds}
					})

					if (!session.length || !images.length) {
						throw new BadRequestException("Session or Image data not found.")
					}

					// Insert the user bet data in the transaction
					const data = await this.commonModelPPPUserBet.bulkCreate(
						transaction,
						payloadForUserBet,
						userId
					)

					// Calculate the total bet amount
					const totalAmount = payloadForUserBet.reduce(
						(total, el) => total + Number(el.betAmount),
						0
					)

					await this.commonModelPPPWallet.bulkCreate(
						transaction,
						[
							{
								userId,
								transactionType: "debit",
								amount: totalAmount,
								approvalStatus: "approved",
								remarks: `For session time ${session[0].startTime} - ${session[0].endTime} with imageId - ${imageIds} bet is placed`,
								sessionId,
								userBetIds: data.map(({userBetId}) => userBetId).join(",")
							}
						],
						userId
					)

					return [session, images, data]
				}
			)

			return response.successResponse({
				message: "Bet placed successfully",
				data
			})
		} catch (error) {
			console.error("Error placing bet:", error)
			next(error)
		}
	}

	public async listUserBet(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			let {filter, range, sort} = await listAPIPayload(req.body)
			filter =
				filter && Object.keys(filter).length
					? !filter.userId
						? {
								...filter,
								userId
							}
						: filter
					: {userId}

			const [data, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					let [data, total] = await Promise.all([
						this.commonModelPPPUserBet.list(transaction, {
							filter,
							range,
							sort
						}),

						this.commonModelPPPUserBet.list(transaction, {
							filter,
							isCountOnly: true
						})
					])

					return [data, total]
				}
			)

			return response.successResponse({
				message: `Data`,
				metadata: {
					total,
					page: range?.page ?? DEFAULT_PAGE,
					pageSize: range?.pageSize ?? DEFAULT_PAGE_SIZE
				},
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async pppGameLot() {
		try {
			// fetch all images to get their ids
			const imageIds: number[] = []
			// const [images, session] = await prisma.$transaction(
			// 	async (transaction: PrismaClientTransaction) => {
			// 		return await Promise.all([
			// 			this.commonModelPPPImage.list(transaction, {}),
			// 			this.commonModelPPPSession.list(transaction, {})
			// 		])
			// 	}
			// )

			// list all user bet with sessionId

			// Count bets per image

			// convert and sort

			// return result

			// using total bet amount and use profit (betProfit)

			// add the amount and winning image and update betStatus in userBet

			// use this as cron as this is time based game
		} catch (error) {
			throw error
		}
	}

	// public async finalizeGameResult() {
	// 	try {
	// 		const nowMinus15Minutes = dayjs()
	// 			.tz("Asia/Kolkata")
	// 			.subtract(15, "minutes")
	// 			.toISOString()

	// 		await prisma.$transaction(
	// 			async (transaction: PrismaClientTransaction) => {
	// 				const gameResults = await this.commonModelPPPGameResult.list(
	// 					transaction,
	// 					{
	// 						filter: {
	// 							resultType: "open",
	// 							resultTime: {
	// 								lte: nowMinus15Minutes
	// 							}
	// 						}
	// 					}
	// 				)

	// 				for (let i = 0; i < gameResults?.length; i++) {
	// 					await this.commonModelPPPGameResult.updateById(
	// 						transaction,
	// 						{resultType: "final"},
	// 						gameResults[i].resultId
	// 					)

	// 					// Get all bets for this game created today
	// 					const userBets = await this.commonModelPPPUserBet.list(
	// 						transaction,
	// 						{
	// 							filter: {
	// 								sessionId: gameResults[i].sessionId,
	// 								betStatus: "pending"
	// 							},
	// 							range: {all: true}
	// 						}
	// 					)

	// 					const walletCredits: any[] = []
	// 					const walletUserId: number[] = []
	// 					// const resultNumber: string = gameResults[i].resultNumber.toString()

	// 					const updatedBets = await Promise.all(
	// 						userBets.map(async (bet) => {
	// 							let betStatus: string = "lost"
	// 							let winningAmount = 0.0

	// 							winningAmount = profit.winningAmount(bet.betAmount)

	// 							if (!walletUserId.includes(bet.userId)) {
	// 								walletCredits.push({
	// 									userId: bet.userId,
	// 									resultId: gameResults[i].resultId,
	// 									transactionType: "credit",
	// 									amount: Number(winningAmount),
	// 									remarks: "Horray! You Win",
	// 									approvalStatus: "approved",
	// 									sessionId: bet.sessionId
	// 								})
	// 								walletUserId.push(bet.userId)
	// 							} else {
	// 								const walletIndex = walletUserId.indexOf(bet.userId)
	// 								walletCredits[walletIndex].amount += Number(winningAmount)
	// 							}

	// 							return this.commonModelPPPUserBet.updateById(
	// 								transaction,
	// 								{betStatus, winningAmount},
	// 								bet.userBetId
	// 							)
	// 						})
	// 					)

	// 					if (walletCredits?.length) {
	// 						await this.commonModelPPPWallet.bulkCreate(
	// 							transaction,
	// 							walletCredits,
	// 							gameResults[i].createdById
	// 						)
	// 					}
	// 				}
	// 			}
	// 		)
	// 	} catch (error: any) {
	// 		logMessage("error", error.toString())
	// 	}
	// }
}

export default new PPPUserBetController()
