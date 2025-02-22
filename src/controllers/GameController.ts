import {NextFunction, Request, Response} from "express"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

import {listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import CommonModel from "../models/CommonModel"
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, Headers} from "../types/common"

class GameController {
	private commonModelGame
	private commonModelGameResult
	private commonModelUserBet
	private commonModelWallet

	private idColumnGame: string = "gameId"
	private idColumnGameResult: string = "resultId"
	private idColumnUserBet: string = "betId"
	private idColumnWallet: string = "walletId"

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

		this.list = this.list.bind(this)
		this.listGameResults = this.listGameResults.bind(this)
		this.saveUserBet = this.saveUserBet.bind(this)
		this.listUserBet = this.listUserBet.bind(this)
		this.handleGameResult = this.handleGameResult.bind(this)
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {roleId}: Headers = req.headers

			const {filter, range, sort} = await listAPIPayload(req.body)
			const customFilters: any[] = []

			const currentTime = dayjs().format("HH:mm:ss")

			if (filter?.gameStatus && Array.isArray(filter.gameStatus)) {
				if (filter.gameStatus.includes("live")) {
					customFilters.push({
						AND: [
							{startTime: {lte: currentTime}},
							{endTime: {gte: currentTime}}
						]
					})
				}
				if (filter.gameStatus.includes("upcoming")) {
					customFilters.push({startTime: {gt: currentTime}})
				}
				if (filter.gameStatus.includes("past")) {
					customFilters.push({endTime: {lt: currentTime}})
				}

				delete filter.gameStatus
			}

			const [data, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					let [data, total] = await Promise.all([
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

	public async listGameResults(
		req: Request,
		res: Response,
		next: NextFunction
	) {
		try {
			const response = new ApiResponse(res)

			const {filter, range, sort} = await listAPIPayload(req.body)
			const customFilters: any[] = []

			const currentTime = dayjs().format("HH:mm:ss")
			const startOfDay = dayjs().utc().startOf("day").toISOString()
			const endOfDay = dayjs().utc().endOf("day").toISOString()

			// Handle resultStatus filtering
			if (filter?.resultStatus && Array.isArray(filter.resultStatus)) {
				if (filter.resultStatus.includes("live")) {
					customFilters.push({resultTime: {lte: currentTime}}) // resultTime has passed
				}
				if (filter.resultStatus.includes("upcoming")) {
					customFilters.push({resultTime: {gt: currentTime}}) // resultTime in the future
				}
				if (filter.resultStatus.includes("past")) {
					customFilters.push({resultTime: {lt: currentTime}}) // resultTime has passed
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

	public async saveUserBet(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {gameId, bets} = req.body

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const data = await this.commonModelUserBet.bulkCreate(
						transaction,
						bets.map((el) => ({
							userId,
							gameId,
							betNumber: el.pair,
							betAmount: el.amount
						})),
						userId
					)

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
								remarks: "Used for placing bet"
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
					? {
							...filter,
							userId
						}
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

					const key = `${gameId}-${createdAt}`
					if (!acc[key]) {
						acc[key] = {
							gameId,
							game,
							createdAt,
							bets: []
						}
					}

					acc[key].bets.push(bet)
					return acc
				},
				{} as Record<string, {gameId: string; createdAt: string; bets: any[]}>
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
			const today = dayjs().utc().startOf("day").toDate()

			const [updatedBets] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// Get the latest game result for today
					await this.commonModelGameResult.bulkCreate(
						transaction,
						[
							{
								gameId,
								resultNumber,
								resultType: "final"
							}
						],
						userId
					)

					// Get all bets for this game created today
					const userBets = await this.commonModelUserBet.list(transaction, {
						filter: {
							gameId,
							createdAt: {
								gte: today
							}
						},
						range: {all: true}
					})

					const updatedBets = await Promise.all(
						userBets.map(async (bet) => {
							let betStatus: string = "lost"
							let winningAmount = 0.0

							if (bet.betNumber.toString() === resultNumber.toString()) {
								// Case 1: Exact match
								betStatus = "won"
								winningAmount = bet.betAmount * 100
							} else if (
								bet.betNumber.startsWith("A") &&
								bet.betNumber[1] === resultNumber[0]
							) {
								// Case 2: Matches 1st digit after removing "A"
								betStatus = "won"
								winningAmount = bet.betAmount * 10
							} else if (
								bet.betNumber.startsWith("B") &&
								bet.betNumber[1] === resultNumber[1]
							) {
								// Case 3: Matches 2nd digit after removing "B"
								betStatus = "won"
								winningAmount = bet.betAmount * 10
							}

							return this.commonModelUserBet.updateById(
								transaction,
								{betStatus, winningAmount},
								bet.betId
							)
						})
					)

					return [updatedBets]
				}
			)

			return response.successResponse({
				message: `Game results processed successfully`,
				data: updatedBets
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new GameController()
