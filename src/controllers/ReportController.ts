import {NextFunction, Request, Response} from "express"

import {listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import ReportModel from "../models/ReportModel"
import {DEFAULT_PAGE} from "../types/common"

class ReportController {
	private reportModel

	constructor() {
		this.reportModel = new ReportModel()

		this.gamesStats = this.gamesStats.bind(this)
		this.betsByNumbers = this.betsByNumbers.bind(this)
		this.betsByUsers = this.betsByUsers.bind(this)
	}

	public async gamesStats(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {filter} = await listAPIPayload(req.body)

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await this.reportModel.gameStats(transaction, {
						filter
					})
				}
			)

			return response.successResponse({
				message: `Games stats`,
				metadata: {
					total: data.length,
					page: DEFAULT_PAGE,
					pageSize: data.length
				},
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async betsByNumbers(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {filter} = await listAPIPayload(req.body)

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await this.reportModel.betsByNumbers(transaction, {
						filter
					})
				}
			)

			return response.successResponse({
				message: `Bets by numbers`,
				metadata: {
					total: data.length,
					page: DEFAULT_PAGE,
					pageSize: data.length
				},
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async betsByUsers(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {filter} = await listAPIPayload(req.body)

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await this.reportModel.betsByUsers(transaction, {
						filter
					})
				}
			)

			return response.successResponse({
				message: `Bets by users`,
				metadata: {
					total: data.length,
					page: DEFAULT_PAGE,
					pageSize: data.length
				},
				data
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new ReportController()
