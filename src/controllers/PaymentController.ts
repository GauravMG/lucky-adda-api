import {NextFunction, Request, Response} from "express"

import {CreateTransactionPayload} from "src/types/pay-from-upi"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import * as PayFromUpi from "../services/PayFromUpi"
import {Headers} from "../types/common"

class PaymentController {
	private commonModelPaymentTransaction
	private commonModelWallet
	private commonModelUser

	private idColumnPaymentTransaction: string = "paymentTransactionId"
	private idColumnWallet: string = "walletId"
	private idColumnUser: string = "userId"

	constructor() {
		this.commonModelPaymentTransaction = new CommonModel(
			"PaymentTransaction",
			this.idColumnPaymentTransaction,
			[]
		)
		this.commonModelWallet = new CommonModel("Wallet", this.idColumnWallet, [])
		this.commonModelUser = new CommonModel("User", this.idColumnUser, [
			"roleId",
			"fullName",
			"mobile"
		])

		this.create = this.create.bind(this)
		this.update = this.update.bind(this)
		this.webhook = this.webhook.bind(this)
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {amount} = req.body

			let transactionPayload: CreateTransactionPayload | any = {}

			const [user] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const [user] = await this.commonModelUser.list(transaction, {
						filter: {
							userId
						}
					})
					if (!user) {
						throw new BadRequestException("User doesn't exist")
					}

					transactionPayload = {
						type: "any",
						user_name: user.fullName,
						user_email: `${user.userId}_${user.mobile}@yopmail.com`,
						user_mobile: user.mobile,
						amount: parseInt(amount),
						redirect_url: process.env.PAYMENT_REDIRECT_URL as string
					}

					return [user]
				}
			)

			const result = await PayFromUpi.createTransaction(transactionPayload)

			let paymentTransactionId: number | null = null
			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const [paymentTransaction] =
						await this.commonModelPaymentTransaction.bulkCreate(
							transaction,
							[
								{
									userId,
									amount,
									paymentStatus: "pending",
									requestJSON: JSON.stringify(transactionPayload),
									transactionCreateResponseJSON: JSON.stringify(result)
								}
							],
							userId
						)

					paymentTransactionId = paymentTransaction.paymentTransactionId

					return []
				}
			)

			return response.successResponse({
				message: `Transaction created successfully.`,
				data: {
					paymentTransactionId,
					...(result?.data ?? result)
				}
			})
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId}: Headers = req.headers

			const {paymentTransactionId, paymentStatus, responseJSON} = req.body

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const [paymentTransaction] =
						await this.commonModelPaymentTransaction.list(transaction, {
							filter: {
								paymentTransactionId
							}
						})
					if (!paymentTransaction) {
						throw new BadRequestException("Transaction doesn't exist")
					}

					await this.commonModelPaymentTransaction.updateById(
						transaction,
						{
							paymentStatus,
							responseJSON:
								typeof responseJSON === "string"
									? responseJSON
									: JSON.stringify(responseJSON)
						},
						paymentTransactionId,
						userId
					)

					return []
				}
			)

			return response.successResponse({
				message: `Transaction created successfully.`
			})
		} catch (error) {
			next(error)
		}
	}

	public async webhook(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			console.log(`req.body`, req.body)
			console.log(`req.query`, req.query)
			console.log(`req.params`, req.params)

			return response.successResponse({
				message: `Payment response received successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new PaymentController()
