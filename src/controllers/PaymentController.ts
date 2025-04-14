import {NextFunction, Request, Response} from "express"

import {listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import WalletModel from "../models/WalletModel"
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, Headers} from "../types/common"

class PaymentController {
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

		this.webhook = this.webhook.bind(this)
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
