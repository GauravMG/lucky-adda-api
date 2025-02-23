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

	private idColumnWallet: string = "walletId"
	private idColumnUser: string = "userId"

	constructor() {
		this.commonModelWallet = new CommonModel("Wallet", this.idColumnWallet, [])
		this.commonModelUser = new CommonModel("User", this.idColumnUser, [
			"roleId",
			"fullName",
			"mobile"
		])

		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const payload = Array.isArray(req.body) ? req.body : [req.body]

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
										? "Added to Wallet"
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
					const userIds: number[] = wallets.map(({userId}) => userId)
					const users = await this.commonModelUser.list(transaction, {
						filter: {
							userId: userIds
						}
					})
					const userToUserIdMap = new Map(
						users.map((user) => [user.userId, user])
					)

					const walletModel = new WalletModel()
					// const userWallets = await walletModel.getWalletBalanceByUserIds(
					// 	transaction,
					// 	{
					// 		filter: {userIds}
					// 	}
					// )
					// const userWalletToUserIdMap: any = new Map(
					// 	userWallets.map((userWallet) => [userWallet.userId, userWallet])
					// )

					wallets = wallets.map((wallet) => {
						// const userWallet = userWalletToUserIdMap.find(
						// 	(userUserMapping) => userUserMapping.userId === wallet.userId
						// )
						const user = userToUserIdMap.get(wallet.userId)

						return {
							...wallet,
							user
							// currentBalance:
							// 	userWalletToUserIdMap.get(wallet.userId)?.totalBalance ?? 0
						}
					})

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
}

export default new WalletController()
