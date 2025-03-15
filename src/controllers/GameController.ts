import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import {NextFunction, Request, Response} from "express"

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

class GameController {
	private commonModelGame
	private commonModelGameResult
	private commonModelUserBet
	private commonModelWallet
	private commonModelLoginHistory

	private idColumnGame: string = "gameId"
	private idColumnGameResult: string = "resultId"
	private idColumnUserBet: string = "betId"
	private idColumnWallet: string = "walletId"
	private idColumnLoginHistory: string = "loginHistoryId"

	constructor() {
		this.commonModelGame = new CommonModel("Game", this.idColumnGame, [
			"name",
			"city"
		])
		this.commonModelGameResult = new CommonModel(
			"GameResult",
			this.idColumnGameResult,
			[]
		)
		this.commonModelUserBet = new CommonModel(
			"UserBet",
			this.idColumnUserBet,
			[]
		)
		this.commonModelWallet = new CommonModel("Wallet", this.idColumnWallet, [])
		this.commonModelLoginHistory = new CommonModel(
			"LoginHistory",
			this.idColumnLoginHistory,
			[]
		)

		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)

		this.listGameResults = this.listGameResults.bind(this)
		this.listGameResultsChart = this.listGameResultsChart.bind(this)

		this.saveUserBet = this.saveUserBet.bind(this)
		this.listUserBet = this.listUserBet.bind(this)

		this.handleGameResult = this.handleGameResult.bind(this)
		this.finalizeGameResult = this.finalizeGameResult.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const payload = Array.isArray(req.body) ? req.body : [req.body]

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const games = await this.commonModelGame.bulkCreate(
						transaction,
						payload,
						userId
					)

					return [games]
				}
			)

			return response.successResponse({
				message: `Games created successfully`,
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {roleId}: Headers = req.headers

			const {filter, range, sort} = await listAPIPayload(req.body)
			const customFilters: any[] = []

			const previousDate = dayjs()
				.tz("Asia/Kolkata")
				.subtract(1, "days")
				.format("YYYY-MM-DD")
			const currentDate = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD")
			const currentTime = dayjs().tz("Asia/Kolkata").format("HH:mm")
			const currentTimePlus1Hour = dayjs()
				.tz("Asia/Kolkata")
				.add(60, "minutes")
				.format("HH:mm:ss")
			const currentTimeSub1Hour = dayjs()
				.tz("Asia/Kolkata")
				.subtract(60, "minutes")
				.format("HH:mm:ss")

			let gameStatus: string = ""
			let gameRange: any = null

			if (filter?.gameStatus && Array.isArray(filter.gameStatus)) {
				if (filter.gameStatus.includes("live")) {
					gameStatus = "live"
					gameRange = {
						all: true
					}
				} else if (filter.gameStatus.includes("upcoming")) {
					gameStatus = "upcoming"
					gameRange = {
						all: true
					}
				} else if (filter.gameStatus.includes("past")) {
					customFilters.push({endTime: {lt: currentTime}})
				}

				delete filter.gameStatus
			}

			const [data, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					let [games, total] = await Promise.all([
						this.commonModelGame.list(transaction, {
							filter,
							customFilters,
							range: gameRange ?? range,
							sort
						}),

						this.commonModelGame.list(transaction, {
							filter,
							customFilters,
							isCountOnly: true
						})
					])

					let filteredGames: any = games
					if (gameStatus !== "") {
						if (gameStatus === "live") {
							filteredGames = games.filter(({startTime, endTime}) => {
								if (startTime <= endTime) {
									return startTime <= currentTime && endTime >= currentTime
								} else {
									return startTime <= currentTime || endTime >= currentTime
								}
							})
						} else if (gameStatus === "upcoming") {
							filteredGames = games.filter(({startTime, resultTime}) => {
								if (startTime <= resultTime) {
									return startTime > currentTime
								} else if (
									startTime > resultTime &&
									currentTime <= "23:59:59"
								) {
									return startTime > currentTime
								} else if (startTime > resultTime && currentTime > "23:59:59") {
									return resultTime < currentTime
								}
							})
						}

						if (!range?.all && range?.pageSize) {
							filteredGames = filteredGames.slice(
								(range.page - 1) * range.pageSize,
								range.pageSize
							)
						}

						if (gameStatus === "live") {
							for (let i = 0; i < filteredGames.length; i++) {
								let userBetTimeCondition: any = {}
								if (filteredGames[i].startTime <= filteredGames[i].endTime) {
									userBetTimeCondition = {
										createdAt: {
											gte: dayjs(
												`${currentDate} ${filteredGames[i].startTime}:00`
											)
												.tz("Asia/Kolkata")
												.toDate(),
											lte: dayjs(
												`${currentDate} ${filteredGames[i].endTime}:00`
											)
												.tz("Asia/Kolkata")
												.toDate()
										}
									}
								} else if (filteredGames[i].startTime <= currentTime) {
									userBetTimeCondition = {
										createdAt: {
											gte: dayjs(
												`${currentDate} ${filteredGames[i].startTime}:00`
											)
												.tz("Asia/Kolkata")
												.toDate()
										}
									}
								} else if (filteredGames[i].endTime >= currentTime) {
									userBetTimeCondition = {
										createdAt: {
											gte: dayjs(
												`${previousDate} ${filteredGames[i].startTime}:00`
											)
												.tz("Asia/Kolkata")
												.toDate(),
											lte: dayjs(
												`${currentDate} ${filteredGames[i].endTime}:00`
											)
												.tz("Asia/Kolkata")
												.toDate()
										}
									}
								}

								let userBetsCount = await this.commonModelUserBet.list(
									transaction,
									{
										filter: {
											gameId: filteredGames[i].gameId,
											...userBetTimeCondition
										}
									}
								)
								userBetsCount = Array.from(
									new Map(
										userBetsCount.map((item) => [item.userId, item])
									).values()
								)

								// filteredGames[i].livePlayers = userBetsCount.length
								filteredGames[i].livePlayers = generateRandomNumber()
							}
						}
					}

					return [filteredGames, total]
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

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {gameId, ...restPayload} = req.body

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// check if game exists
					const [existingGame] = await this.commonModelGame.list(transaction, {
						filter: {
							gameId
						}
					})
					if (!existingGame) {
						throw new BadRequestException("Game doesn't exist")
					}

					// update game
					await this.commonModelGame.updateById(
						transaction,
						restPayload,
						gameId,
						userId
					)

					// get updated details
					const [game] = await this.commonModelGame.list(transaction, {
						filter: {
							gameId
						}
					})

					return [game]
				}
			)

			return response.successResponse({
				message: `Details updated successfully`,
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {gameIds} = req.body

			if (!gameIds?.length) {
				throw new BadRequestException(`Please select game(s) to be deleted`)
			}

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const existingGames = await this.commonModelGame.list(transaction, {
						filter: {
							gameId: gameIds
						}
					})
					if (!existingGames.length) {
						const gameIdsSet: Set<number> = new Set(
							existingGames.map((obj) => obj.gameId)
						)
						throw new BadRequestException(
							`Selected games(s) not found: ${gameIds.filter((gameId) => !gameIdsSet.has(gameId))}`
						)
					}

					await this.commonModelGame.softDeleteByIds(
						transaction,
						gameIds,
						userId
					)
				}
			)

			return response.successResponse({
				message: `Game(s) deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}

	public async listGameResults(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const response = new ApiResponse(res)

			const {filter, range, sort} = await listAPIPayload(req.body)
			const customFilters: any[] = []

			const currentTime = dayjs().tz("Asia/Kolkata").format("HH:mm:ss")
			const currentTimePlus1Hour = dayjs()
				.tz("Asia/Kolkata")
				.add(60, "minutes")
				.format("HH:mm:ss")
			const currentTimeSub1Hour = dayjs()
				.tz("Asia/Kolkata")
				.subtract(60, "minutes")
				.format("HH:mm:ss")
			const startOfDay = dayjs().utc().startOf("day").toISOString()
			const endOfDay = dayjs().utc().endOf("day").toISOString()

			// Handle resultStatus filtering
			if (filter?.resultStatus && Array.isArray(filter.resultStatus)) {
				if (filter.resultStatus.includes("live")) {
					customFilters.push({
						AND: [
							{endTime: {lte: currentTime}},
							{resultTime: {gte: currentTimeSub1Hour}}
						]
					}) // resultTime has passed
				}
				if (filter.resultStatus.includes("upcoming")) {
					customFilters.push({endTime: {gt: currentTime}}) // resultTime in the future
				}
				if (filter.resultStatus.includes("past")) {
					customFilters.push({resultTime: {lt: currentTimeSub1Hour}}) // resultTime has passed
				}

				delete filter.resultStatus
			}

			const [data, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					let [games, total] = await Promise.all([
						this.commonModelGame.list(transaction, {
							filter,
							customFilters,
							range,
							sort
						}),

						this.commonModelGame.list(transaction, {
							filter,
							customFilters,
							isCountOnly: true
						})
					])

					const gameIds: number[] = games.map(({gameId}) => gameId)

					const gameResults = await this.commonModelGameResult.list(
						transaction,
						{
							filter: {gameId: gameIds},
							customFilters: [
								{
									resultTime: {
										gte: startOfDay,
										lte: endOfDay
									}
								}
							],
							range: {all: true}
						}
					)

					games = games.map((game) => {
						const thisGameResults = gameResults.filter(
							(gameResult) => gameResult.gameId === game.gameId
						)

						return {
							...game,
							gameResults: thisGameResults ?? [],
							gameResultFinal: thisGameResults?.at(-1) ?? null
						}
					})

					// if (
					// 	filter?.resultStatus?.length === 1 &&
					// 	filter?.resultStatus?.includes("past")
					// ) {
					// 	games = games.filter(({gameResultFinal}) => gameResultFinal)
					// }

					return [games, total]
				}
			)

			return response.successResponse({
				message: "Data",
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

	public async listGameResultsChart(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const response = new ApiResponse(res)

			const {filter, range, sort} = await listAPIPayload(req.body)
			const customFiltersGameResults: any[] = []

			if ((filter?.resultMonth ?? "").trim() !== "") {
				const startOfMonth = dayjs(filter.resultMonth)
					.startOf("month")
					.toISOString()
				const endOfMonth = dayjs(filter.resultMonth)
					.endOf("month")
					.toISOString()

				customFiltersGameResults.push({
					createdAt: {
						gte: startOfMonth,
						lte: endOfMonth
					}
				})

				delete filter.resultMonth
			}

			const [data, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					let [games, total] = await Promise.all([
						this.commonModelGame.list(transaction, {
							filter,
							range,
							sort
						}),

						this.commonModelGame.list(transaction, {
							filter,
							isCountOnly: true
						})
					])

					const gameIds: number[] = games.map(({gameId}) => gameId)

					const gameResults = await this.commonModelGameResult.list(
						transaction,
						{
							filter: {gameId: gameIds},
							customFilters: customFiltersGameResults,
							range: {all: true}
						}
					)

					games = games.map((game) => ({
						...game,
						gameResults:
							gameResults.filter(
								(gameResult) => gameResult.gameId === game.gameId
							) ?? []
					}))

					return [games, total]
				}
			)

			return response.successResponse({
				message: "Data",
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

	public async saveUserBet(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {gameId, bets} = req.body

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const [[game], data] = await Promise.all([
						this.commonModelGame.list(transaction, {
							filter: {gameId}
						}),

						this.commonModelUserBet.bulkCreate(
							transaction,
							bets.map((el) => ({
								userId,
								gameId,
								betNumber: el.pair,
								betAmount: el.amount,
								pairType: el.pairType
							})),
							userId
						)
					])

					let totalAmount: number = 0
					bets.map((el) => (totalAmount += Number(el.amount)))

					await this.commonModelWallet.bulkCreate(
						transaction,
						[
							{
								userId,
								transactionType: "debit",
								amount: totalAmount,
								approvalStatus: "approved",
								remarks: `${(game.name ?? "").trim() !== "" ? `For Bet ${game.name.toUpperCase()}` : "Used for placing bet"}`,
								gameId,
								userBetIds: data.map(({betId}) => betId).join(",")
							}
						],
						userId
					)

					return [data]
				}
			)

			return response.successResponse({
				message: `Bet placed successfully`,
				data
			})
		} catch (error) {
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
						this.commonModelUserBet.list(transaction, {
							filter,
							range,
							sort
						}),

						this.commonModelUserBet.list(transaction, {
							filter,
							isCountOnly: true
						})
					])

					const gameIds: number = data.map((el) => el.gameId)
					const games = await this.commonModelGame.list(transaction, {
						filter: {
							gameId: gameIds
						},
						range: {all: true}
					})

					data = data.map((el) => ({
						...el,
						game: games.find((game) => game.gameId === el.gameId)
					}))

					return [data, total]
				}
			)

			// Group bets by gameId and createdAt (date-wise)
			const groupedBets = data.reduce(
				(acc, bet) => {
					const gameId = bet.gameId
					const game = bet.game
					const createdAt = dayjs(bet.createdAt).format("YYYY-MM-DD") // Group by date
					const pairType = bet.pairType || "others" // Default to "others" if undefined

					const key = `${gameId}-${createdAt}-${pairType}`

					if (!acc[key]) {
						acc[key] = {
							gameId,
							game,
							createdAt,
							pairType,
							bets: []
						}
					}

					acc[key].bets.push(bet)
					return acc
				},
				{} as Record<
					string,
					{gameId: string; createdAt: string; pairType: string; bets: any[]}
				>
			)

			// Convert grouped object to an array
			const groupedBetsArray = Object.values(groupedBets)

			return response.successResponse({
				message: `Data`,
				metadata: {
					total,
					page: range?.page ?? DEFAULT_PAGE,
					pageSize: range?.pageSize ?? DEFAULT_PAGE_SIZE
				},
				data: groupedBetsArray
			})
		} catch (error) {
			next(error)
		}
	}

	public async handleGameResult(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {gameId, resultNumber} = req.body

			const userPushNotificationPayload: {
				token: string
				title: string
				body: string
				data: any
			}[] = []

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const [[game], [existingGameResult], userBets] = await Promise.all([
						this.commonModelGame.list(transaction, {
							filter: {
								gameId
							}
						}),

						this.commonModelGameResult.list(transaction, {
							filter: {
								gameId,
								resultType: "open"
							},
							range: {
								page: 1,
								pageSize: 1
							},
							sort: [
								{
									orderBy: "resultId",
									orderDir: "desc"
								}
							]
						}),

						this.commonModelUserBet.list(transaction, {
							filter: {
								gameId,
								betStatus: "pending"
							},
							range: {all: true}
						})
					])

					if (
						existingGameResult &&
						existingGameResult.resultNumber.toString() ===
							resultNumber.toString()
					) {
						return
					}

					if (
						existingGameResult &&
						existingGameResult.resultNumber !== resultNumber.toString()
					) {
						await this.commonModelGameResult.updateById(
							transaction,
							{resultType: "close"},
							existingGameResult.resultId
						)
					}

					const [gameResult] = await this.commonModelGameResult.bulkCreate(
						transaction,
						[
							{
								gameId,
								resultNumber,
								resultType: "open"
							}
						],
						userId
					)

					const userIds: number[] = userBets.map((userBet) =>
						Number(userBet.userId)
					)

					const allPayloadUserLoginHistories =
						await this.commonModelLoginHistory.list(transaction, {
							filter: {
								userId: userIds,
								deviceType: ["android", "ios"]
							},
							range: {all: true}
						})

					allPayloadUserLoginHistories
						.filter(
							(allPayloadUserLoginHistory) =>
								(allPayloadUserLoginHistory.fcmToken ?? "").trim() !== ""
						)
						.map(
							(allPayloadUserLoginHistory) =>
								allPayloadUserLoginHistory.fcmToken
						)
						.map((fcmToken) =>
							userPushNotificationPayload.push({
								token: fcmToken,
								title: `Result Out${(game?.name ?? "").trim() !== "" ? ` for ${game.name}` : ""}`,
								body: `Result Out${(game?.name ?? "").trim() !== "" ? ` for ${game.name}` : ""}`,
								data: {}
							})
						)

					return
				}
			)

			userPushNotificationPayload.map((userPushNotification) =>
				sendPushNotification({
					token: userPushNotification.token,
					title: userPushNotification.title,
					body: userPushNotification.body,
					data: userPushNotification.data
				})
			)

			return response.successResponse({
				message: `Game results processed successfully`
			})
		} catch (error) {
			next(error)
		}
	}

	public async finalizeGameResult() {
		try {
			const nowMinus15Minutes = dayjs()
				.tz("Asia/Kolkata")
				.subtract(15, "minutes")
				.toISOString()

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const gameResults = await this.commonModelGameResult.list(
						transaction,
						{
							filter: {
								resultType: "open",
								resultTime: {
									lte: nowMinus15Minutes
								}
							}
						}
					)

					for (let i = 0; i < gameResults?.length; i++) {
						await this.commonModelGameResult.updateById(
							transaction,
							{resultType: "final"},
							gameResults[i].resultId
						)

						// Get all bets for this game created today
						const userBets = await this.commonModelUserBet.list(transaction, {
							filter: {
								gameId: gameResults[i].gameId,
								betStatus: "pending"
							},
							range: {all: true}
						})

						const walletCredits: any[] = []
						const walletUserId: number[] = []
						const resultNumber: string = gameResults[i].resultNumber.toString()

						const updatedBets = await Promise.all(
							userBets.map(async (bet) => {
								let betStatus: string = "lost"
								let winningAmount = 0.0

								if (bet.betNumber.toString() === resultNumber) {
									// Case 1: Exact match
									betStatus = "won"
									winningAmount = bet.betAmount * 90
								} else if (
									bet.betNumber.startsWith("A") &&
									bet.betNumber[1] === resultNumber[0]
								) {
									// Case 2: Matches 1st digit after removing "A"
									betStatus = "won"
									winningAmount = bet.betAmount * 9
								} else if (
									bet.betNumber.startsWith("B") &&
									bet.betNumber[1] === resultNumber[1]
								) {
									// Case 3: Matches 2nd digit after removing "B"
									betStatus = "won"
									winningAmount = bet.betAmount * 9
								}

								if (!walletUserId.includes(bet.userId)) {
									walletCredits.push({
										userId: bet.userId,
										resultId: gameResults[i].resultId,
										transactionType: "credit",
										amount: Number(winningAmount),
										remarks: "Horray! You Win",
										approvalStatus: "approved",
										gameId: bet.gameId
									})
									walletUserId.push(bet.userId)
								} else {
									const walletIndex = walletUserId.indexOf(bet.userId)
									walletCredits[walletIndex].amount += Number(winningAmount)
								}

								return this.commonModelUserBet.updateById(
									transaction,
									{betStatus, winningAmount},
									bet.betId
								)
							})
						)

						await this.commonModelWallet.bulkCreate(
							transaction,
							walletCredits,
							gameResults[i].createdById
						)
					}
				}
			)
		} catch (error: any) {
			logMessage("error", error.toString())
		}
	}
}

export default new GameController()
