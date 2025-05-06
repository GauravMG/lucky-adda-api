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
		this.convertWinning = this.convertWinning.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const payload = Array.isArray(req.body) ? req.body : [req.body]

			const [wallet] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					let wallet = await this.commonModelWallet.bulkCreate(
						transaction,
						payload.map(({isAddDepositBonus, ...el}) => ({
							...el,
							approvalStatus:
								(el.approvalStatus ?? "").trim() !== ""
									? el.approvalStatus
									: el.transactionType === "credit"
										? "approved"
										: "pending",
							remarks:
								(el.remarks ?? "").trim() !== ""
									? el.remarks
									: el.transactionType === "credit"
										? "Deposit"
										: "Withdrawn from Wallet"
						})),
						userId
					)

					const newPayload: any[] = []
					for (let i = 0; i < payload.length; i++) {
						if (
							payload[i].transactionType === "credit" &&
							((payload[i].remarks ?? "").trim() === "" ||
								payload[i].isAddDepositBonus) &&
							Number(payload[i].amount) >= 2000 &&
							!payload[i].isBonus
						) {
							newPayload.push({
								...(({isAddDepositBonus, ...rest}) => rest)(payload[i]),
								amount:
									payload[i].amount *
									(parseInt((process.env.AMOUNT_DEPOSIT as string) ?? "1") /
										100),
								remarks: "Deposit Bonus",
								approvalStatus: "approved",
								isBonus: true
							})
						}
						if (
							payload[i].transactionType === "credit" &&
							!payload[i].isBonus
						) {
							const [userCredited] = await this.commonModelUser.list(
								transaction,
								{
									filter: {
										userId: payload[i].userId
									}
								}
							)

							if ((userCredited.referredByCode ?? "").trim() !== "") {
								const [referredByUser] = await this.commonModelUser.list(
									transaction,
									{
										filter: {
											referralCode: userCredited.referredByCode
										}
									}
								)
								if (referredByUser) {
									newPayload.push({
										...(({isAddDepositBonus, ...rest}) => rest)(payload[i]),
										userId: referredByUser.userId,
										transactionType: "credit",
										amount:
											payload[i].amount *
											(parseInt(
												(process.env.AMOUNT_REFERRAL as string) ?? "2"
											) /
												100),
										approvalStatus: "approved",
										remarks: "Referral Bonus",
										isBonus: true
									})
								}
							}
						}
					}

					if (newPayload.length) {
						const walletBonus = await this.commonModelWallet.bulkCreate(
							transaction,
							newPayload,
							userId
						)
						wallet = [...wallet, ...walletBonus]
					}

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
			// filter =
			// 	filter && Object.keys(filter).length
			// 		? !filter.userId
			// 			? {
			// 					...filter,
			// 					userId
			// 				}
			// 			: filter
			// 		: {userId}

			const stats: any = {
				totalbalance: 0,
				totalBonus: 0,
				totalDeposit: 0,
				totalWinning: 0,
				totalWinningConverted: 0,
				totalWinningBalance: 0
			}

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

					let totalDeposit: number = 0
					let totalBonus: number = 0
					let totalWinning: number = 0
					let totalWinningConverted: number = 0
					let totalWinningBalance: number = 0
					let totalDebit: number = 0
					let totalWithdraw: number = 0
					let totalBalance: number = 0

					wallets.map((wallet) => {
						if (
							!wallet.isBonus &&
							wallet.transactionType === "credit" &&
							wallet.approvalStatus === "approved" &&
							(wallet.gameId ?? "").toString().trim() === ""
						) {
							totalDeposit += Number(wallet.amount)
						}

						if (
							wallet.isBonus &&
							wallet.transactionType === "credit" &&
							wallet.approvalStatus === "approved"
						) {
							totalBonus += Number(wallet.amount)
						}

						if (
							!wallet.isBonus &&
							wallet.transactionType === "credit" &&
							wallet.approvalStatus === "approved" &&
							(wallet.gameId ?? "").toString().trim() !== ""
						) {
							totalWinning += Number(wallet.amount)
						}

						if (
							wallet.isConverted &&
							wallet.transactionType === "debit" &&
							wallet.approvalStatus === "approved"
						) {
							totalWinningConverted += Number(wallet.amount)
						}

						if (
							!wallet.isConverted &&
							wallet.transactionType === "debit" &&
							["approved", "pending", "rejected"].indexOf(
								wallet.approvalStatus
							) >= 0
						) {
							totalDebit += Number(wallet.amount)
						}

						if (
							!wallet.isConverted &&
							wallet.transactionType === "debit" &&
							["approved", "pending", "rejected"].indexOf(
								wallet.approvalStatus
							) >= 0 &&
							(wallet.gameId ?? "").toString().trim() === ""
						) {
							totalWithdraw += Number(wallet.amount)
						}

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

					totalWinningBalance =
						totalWinning - totalWinningConverted - totalWithdraw

					totalBalance = totalBalance + totalDeposit + totalBonus + totalWinning
					totalBalance = totalBalance - totalWinningConverted - totalDebit

					stats.totalbalance = totalBalance
					stats.totalBonus = totalBonus
					stats.totalDeposit = totalDeposit
					stats.totalWinning = totalWinning
					stats.totalWinningConverted = totalWinningConverted
					stats.totalWinningBalance = totalWinningBalance

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
				stats,
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

					if (restPayload?.approvalStatus === "approved") {
						let totalWinning: number = 0
						let totalWinningConverted: number = 0
						let totalWinningBalance: number = 0

						const wallets = await this.commonModelWallet.list(transaction, {
							filter: {
								userId: existingTransaction.userId
							},
							range: {
								all: true
							},
							sort: [
								{
									orderBy: "walletId",
									orderDir: "desc"
								}
							]
						})

						wallets.map((wallet) => {
							if (
								!wallet.isBonus &&
								wallet.transactionType === "credit" &&
								wallet.approvalStatus === "approved" &&
								(wallet.gameId ?? "").toString().trim() !== ""
							) {
								totalWinning += Number(wallet.amount)
							}

							if (
								wallet.isConverted &&
								wallet.transactionType === "debit" &&
								wallet.approvalStatus === "approved"
							) {
								totalWinningConverted += Number(wallet.amount)
							}
						})

						totalWinningBalance = totalWinning - totalWinningConverted

						if (
							Number(totalWinningBalance) < Number(existingTransaction.amount)
						) {
							throw new BadRequestException(
								"Cannot approve withdraw request as winning balance is low."
							)
						}
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
						filter: {
							gameId: {not: null}
						},
						range: {all: true}
						// sort
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
							wallet.approvalStatus === "approved"
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

	public async convertWinning(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {amount} = req.body

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const [overallWinnings, conversionDebits] = await Promise.all([
						this.commonModelWallet.list(transaction, {
							filter: {
								userId,
								transactionType: "credit",
								approvalStatus: "approved",
								gameId: {not: null}
							},
							range: {all: true}
						}),

						this.commonModelWallet.list(transaction, {
							filter: {
								userId,
								transactionType: "debit",
								approvalStatus: "approved",
								isConverted: true,
								isBonus: false
							},
							range: {all: true}
						})
					])

					let totalWinnings: number = 0
					let totalConversions: number = 0

					overallWinnings.map(
						(overallWinning) => (totalWinnings += Number(overallWinning.amount))
					)
					conversionDebits.map(
						(conversionDebit) =>
							(totalConversions += Number(conversionDebit.amount))
					)

					const balanceWinnings: number = totalWinnings - totalConversions
					if (balanceWinnings < amount) {
						throw new BadRequestException(
							`Not enough winning amount balance to convert. Winning amount balance = ₹ ${balanceWinnings}`
						)
					}

					const [conversionDebit] = await this.commonModelWallet.bulkCreate(
						transaction,
						[
							{
								userId,
								transactionType: "debit",
								amount,
								approvalStatus: "approved",
								remarks: "Winnings converted to deposit",
								isConverted: true
							}
						],
						userId
					)

					const [conversionCredit] = await this.commonModelWallet.bulkCreate(
						transaction,
						[
							{
								userId,
								transactionType: "credit",
								amount,
								approvalStatus: "approved",
								remarks: "Deposit for converted winnings",
								isConverted: true,
								referenceWalletId: conversionDebit.walletId
							}
						],
						userId
					)

					const [conversionBonus] = await this.commonModelWallet.bulkCreate(
						transaction,
						[
							{
								userId,
								transactionType: "credit",
								amount:
									(amount *
										parseInt(
											(process.env.AMOUNT_CONVERSION as string) ?? "2"
										)) /
									100,
								approvalStatus: "approved",
								remarks: "Cashback bonus for converting winnings",
								isConverted: true,
								isBonus: true,
								referenceWalletId: conversionCredit.walletId
							}
						],
						userId
					)

					return []
				}
			)

			return response.successResponse({
				message: `Winning amount converted to deposit successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new WalletController()
