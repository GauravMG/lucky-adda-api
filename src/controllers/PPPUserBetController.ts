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
import {BetStatus} from "@prisma/client"

class PPPUserBetController {
	private commonModelPPPUserBet
	private commonModelPPPWallet
	private commonModelPPPSession
	private commonModelPPPImage
	private commonModelLoginHistory
	private commonModelUser

	private idColumnPPPUserBet: string = "userBetId"
	private idColumnPPPWallet: string = "pppWalletId"
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
		this.pppGameLot = this.pppGameLot.bind(this)
		this.listPPPResults = this.listPPPResults.bind(this)
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

	public async listPPPResults(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {userId, roleId}: Headers = req.headers
			const {sessionId} = req.body

			// Using function pppgamelot
			const dataResult = await this.pppGameLot(sessionId)

			let [[session], userBet, pppWallet] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await Promise.all([
						this.commonModelPPPSession.list(transaction, {
							filter: {sessionId}
						}),
						this.commonModelPPPUserBet.list(transaction, {
							filter: {
								imageId: dataResult.imageId,
								sessionId
							}
						}),
						this.commonModelPPPWallet.list(transaction, {
							filter: {sessionId}
						})
					])
				}
			)

			// Fetch the image data (await the promise) - fetch it only once
			const [image] = await this.commonModelPPPImage.list(prisma, {
				filter: {
					imageId: dataResult.imageId
				}
			})

			// Start a single transaction for all updates
			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// Prepare batch update data for user bets and wallets
					const userBetUpdates: any = []
					const walletUpdates: any = []

					for (let i = 0; i < userBet.length; i++) {
						let winningAmnt: any = profit.winningAmount(
							Number(userBet[i].betAmount)
						)

						// Update userBet status and winningAmount
						userBetUpdates.push(
							this.commonModelPPPUserBet.updateById(
								transaction,
								{
									winningAmount: winningAmnt.toString(),
									betStatus: BetStatus.won
								},
								userBet[i].userBetId,
								userId
							)
						)

						// Prepare wallet updates (deferred processing)
						for (let j = 0; j < pppWallet.length; j++) {
							walletUpdates.push(
								this.commonModelPPPWallet.updateById(
									transaction,
									{
										amount: (
											Number(pppWallet[j].amount) + Number(winningAmnt)
										).toString(),
										transactionType: "credit",
										approvalStatus: "approved",
										userBetIds: JSON.stringify([userBet[i].userBetId]),
										remarks: `${userBet[i].userBetId} won in session: ${session.startTime}-${session.endTime}`,
										sessionId,
										imageUrl: image?.imageUrl || "",
										status: true
									},
									pppWallet[j].pppWalletId,
									userId
								)
							)
						}
					}

					// Execute all batch updates for user bets and wallets at once
					await Promise.all([...userBetUpdates, ...walletUpdates])
				}
			)

			return response.successResponse({
				message: "Result of game(PPP)",
				data: dataResult
			})
		} catch (error) {
			next(error)
		}
	}

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

	public async pppGameLot(sessionId: number) {
		try {
			// fetch all images to get their ids
			const userCountAndImageId = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await this.commonModelPPPUserBet.rawQuery(
						transaction,
						`
							SELECT
								img."imageId",
								ARRAY_AGG(DISTINCT pppub."userId") AS "userIds",
							    COUNT(DISTINCT pppub."userBetId")::INTEGER AS "userCount"
							FROM 
							    "PPPUserBet" pppub
							JOIN 
							    "PPPImage" img ON img."imageId" = pppub."imageId"
							WHERE 
							    pppub."deletedAt" IS NULL
								AND pppub."sessionId" = ${sessionId}
							GROUP BY 
							    img."imageId"
							ORDER BY 
							    "userCount" ASC;
							`
					)
				}
			)
			// return result
			return userCountAndImageId[0]
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
