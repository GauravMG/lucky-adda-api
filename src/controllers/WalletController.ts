import {NextFunction, Request, Response} from "express"

import {listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import WalletModel from "../models/WalletModel"
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, Headers} from "../types/common"

class WalletController {
	private commonModelWallet
	private commonModelUser
	private commonModelGame
	private commonModelUserBet

	private idColumnWallet: string = "walletId"
	private idColumnUser: string = "userId"
	private idColumnGame: string = "gameId"
	private idColumnUserBet: string = "betId"

	constructor() {
		this.commonModelWallet = new CommonModel("Wallet", this.idColumnWallet, [])
		this.commonModelUser = new CommonModel("User", this.idColumnUser, [
			"roleId",
			"fullName",
			"mobile"
		])
		this.commonModelGame = new CommonModel("Game", this.idColumnGame, [])
		this.commonModelUserBet = new CommonModel(
			"UserBet",
			this.idColumnUserBet,
			[]
		)

		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)

		this.topWinner = this.topWinner.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			let payload = Array.isArray(req.body) ? req.body : [req.body]
			for (let i = 0; i < payload.length; i++) {
				if (
					payload[i].transactionType === "credit" &&
					(payload[i].remarks ?? "").trim() === "" &&
					Number(payload[i].amount) >= 2000
				) {
					payload.splice(i + 1, 0, {
						...payload[i],
						amount: payload[i].amount / 100,
						remarks: "Deposit Bonus",
						approvalStatus: "approved"
					})
				}
			}

			const [wallet] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const wallet = await this.commonModelWallet.bulkCreate(
						transaction,
						payload.map((el) => ({
							...el,
							approvalStatus:
								el.transactionType === "credit" ? "approved" : "pending",
							remarks:
								(el.remarks ?? "").trim() !== ""
									? el.remarks
									: el.transactionType === "credit"
										? "Deposit"
										: "Withdrawn from Wallet"
						})),
						userId
					)

					return [wallet]
				}
			)

			return response.successResponse({
				message: `Wallet updated successfully`,
				data: wallet
			})
		} catch (error) {
			next(error)
		}
	}

	public async list(req: Request, res: Response, next: NextFunction) {
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

			const [wallets, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					let [wallets, total] = await Promise.all([
						this.commonModelWallet.list(transaction, {
							filter,
							range,
							sort
						}),

						this.commonModelWallet.list(transaction, {
							filter,
							isCountOnly: true
						})
					])

					// fetch mapping data
					const userIds: number[] = []
					const gameIds: number[] = []
					let userBetIds: number[] = []

					wallets.map((wallet) => {
						userIds.push(wallet.userId)

						if ((wallet.gameId ?? "").toString().trim() !== "") {
							gameIds.push(Number(wallet.gameId))
						}

						if ((wallet.userBetIds ?? "").trim() !== "") {
							let newUserBetIds = wallet.userBetIds
								.split(",")
								.map((el) => Number(el))
							userBetIds = userBetIds.concat(newUserBetIds)
						}
					})

					const [users, games, userBets] = await Promise.all([
						this.commonModelUser.list(transaction, {
							filter: {
								userId: userIds
							}
						}),

						gameIds.length
							? this.commonModelGame.list(transaction, {
									filter: {
										gameId: gameIds
									}
								})
							: [],

						userBetIds.length
							? this.commonModelUserBet.list(transaction, {
									filter: {
										betId: userBetIds
									}
								})
							: []
					])

					const userToUserIdMap = new Map(
						users.map((user) => [user.userId, user])
					)
					const gameToGameIdMap = new Map(
						games.map((game) => [game.gameId, game])
					)

					wallets = wallets.map((wallet) => {
						const user = userToUserIdMap.get(wallet.userId)

						let userBetIdSet: any = null

						if ((wallet.userBetIds ?? "").trim() !== "") {
							userBetIdSet = new Set(
								wallet.userBetIds.split(",").map((el) => Number(el))
							)
						}

						return {
							...wallet,
							user,
							game:
								(wallet.gameId ?? "").toString().trim() !== ""
									? gameToGameIdMap.get(wallet.gameId)
									: null,
							userBets: userBetIdSet
								? (userBets.filter((userBet) =>
										userBetIdSet.has(userBet.betId)
									) ?? [])
								: []
						}
					})

					function calculateWalletBalance(walletData) {
						// Sort transactions based on `walletId`
						walletData.sort((a, b) => a.walletId - b.walletId)

						let balance = 0 // Initialize balance

						// Iterate through the sorted transactions
						walletData.forEach((transaction) => {
							let amount = parseFloat(transaction.amount) // Convert amount to a number

							if (transaction.transactionType === "credit") {
								balance += amount // Add for credit transactions
							} else if (transaction.transactionType === "debit") {
								balance -= amount // Subtract for debit transactions
							}

							transaction.remainingBalance = balance // Assign calculated balance
						})

						walletData.sort((a, b) => b.walletId - a.walletId)

						return walletData
					}

					wallets = calculateWalletBalance(wallets)

					return [wallets, total]
				}
			)

			return response.successResponse({
				message: `Wallet transactions`,
				metadata: {
					total,
					page: range?.page ?? DEFAULT_PAGE,
					pageSize: range?.pageSize ?? DEFAULT_PAGE_SIZE
				},
				data: wallets
			})
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {walletId, ...restPayload} = req.body

			const [walletTransaction] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// check if transaction exists
					const [existingTransaction] = await this.commonModelWallet.list(
						transaction,
						{
							filter: {
								walletId
							}
						}
					)
					if (!existingTransaction) {
						throw new BadRequestException("Transaction doesn't exist")
					}

					// update transaction
					await this.commonModelWallet.updateById(
						transaction,
						restPayload,
						walletId,
						userId
					)

					if (restPayload?.approvalStatus === "rejected") {
						await this.commonModelWallet.bulkCreate(
							transaction,
							[
								{
									userId: existingTransaction.userId,
									transactionType: "credit",
									amount: existingTransaction.amount,
									approvalStatus: "approved",
									approvalRemarks: `Credit on rejected withdrawal request${(restPayload.approvalRemarks ?? "").trim() !== "" ? ` due to - ${restPayload.approvalRemarks}` : ""}`,
									referenceWalletId: walletId
								}
							],
							userId
						)
					}

					// get updated details
					const [walletTransaction] = await this.commonModelWallet.list(
						transaction,
						{
							filter: {
								walletId
							}
						}
					)

					return [walletTransaction]
				}
			)

			return response.successResponse({
				message: `Details updated successfully`,
				data: walletTransaction
			})
		} catch (error) {
			next(error)
		}
	}

	public async topWinner(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {filter, range, sort} = await listAPIPayload(req.body)

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const wallets = await this.commonModelWallet.list(transaction, {
						filter,
						range,
						sort
					})

					// fetch mapping data
					const userIds: number[] = wallets.map(({userId}) => userId)
					const users = await this.commonModelUser.list(transaction, {
						filter: {
							userId: userIds
						}
					})
					const userToUserIdMap = new Map(
						users.map((user) => [user.userId, user])
					)

					const combinedWallets: any[] = []
					const combinedWalletUserIds: number[] = []

					wallets?.map((wallet) => {
						if (combinedWalletUserIds.indexOf(wallet.userId) < 0) {
							combinedWalletUserIds.push(wallet.userId)
							combinedWallets.push({
								userId: wallet.userId,
								user: userToUserIdMap.get(wallet.userId) ?? null,
								totalWinnings: 0
							})
						}

						const userWalletIndex: number = combinedWalletUserIds.indexOf(
							wallet.userId
						)
						if (
							wallet.transactionType === "credit" &&
							wallet.approvalStatus === "approved" &&
							(wallet.gameId ?? "").toString().trim() !== ""
						) {
							combinedWallets[userWalletIndex].totalWinnings += Number(
								wallet.amount
							)
						}
					})

					return [
						combinedWallets
							.filter((userWallet) => userWallet.totalWinnings > 0)
							.sort((a, b) => b.totalWinnings - a.totalWinnings)
							.slice(0, range?.pageSize ?? 10)
					]
				}
			)

			return response.successResponse({
				message: `Top Winners`,
				metadata: {
					total: 10,
					page: 1,
					pageSize: range?.pageSize ?? 10
				},
				data
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new WalletController()
