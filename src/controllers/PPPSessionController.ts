import {NextFunction, Request, Response} from "express"

import {listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, Headers} from "../types/common"

class PPPSessionController {
	private commonModelPPPSession

	private idColumnPPPSession: string = "sessionId"

	constructor() {
		this.commonModelPPPSession = new CommonModel(
			"PPPSession",
			this.idColumnPPPSession,
			[]
		)

		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async createSession(payload, userId: number) {
		const [sessions] = await prisma.$transaction(
			async (transaction: PrismaClientTransaction) => {
				// create session
				const session = await this.commonModelPPPSession.bulkCreate(
					transaction,
					payload,
					userId
				)
				if (!session.length) {
					throw new BadRequestException(`Failed to create ppp session(s).`)
				}

				return [session]
			}
		)

		return sessions
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {userId, roleId}: Headers = req.headers

			const payload = Array.isArray(req.body) ? req.body : [req.body]

			const session = await this.createSession(payload, userId)

			return response.successResponse({
				message: `PPP Session(s) created successfully`,
				data: session
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

			const [roles, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await Promise.all([
						this.commonModelPPPSession.list(transaction, {
							filter,
							range,
							sort
						}),

						this.commonModelPPPSession.list(transaction, {
							filter,
							isCountOnly: true
						})
					])
				}
			)

			return response.successResponse({
				message: `PPP Sessions data`,
				metadata: {
					total,
					page: range?.page ?? DEFAULT_PAGE,
					pageSize: range?.pageSize ?? DEFAULT_PAGE_SIZE
				},
				data: roles
			})
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId: roleIdHeaders}: Headers = req.headers

			const {sessionId, ...restPayload} = req.body

			const [sessions] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// check if role exists
					const [existingPPPSession] = await this.commonModelPPPSession.list(
						transaction,
						{
							filter: {
								sessionId
							}
						}
					)
					if (!existingPPPSession) {
						throw new BadRequestException("PPPSession doesn't exist")
					}

					// update role
					await this.commonModelPPPSession.updateById(
						transaction,
						restPayload,
						sessionId,
						userId
					)

					// get updated details
					const [session] = await this.commonModelPPPSession.list(transaction, {
						filter: {
							sessionId
						}
					})

					return [session]
				}
			)

			return response.successResponse({
				message: `Details updated successfully`,
				data: sessions
			})
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {sessionIds} = req.body

			if (!sessionIds?.length) {
				throw new BadRequestException(`Please select session(s) to be deleted`)
			}

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const existingGames = await this.commonModelPPPSession.list(
						transaction,
						{
							filter: {
								sessionId: sessionIds
							}
						}
					)
					if (!existingGames.length) {
						const sessionIdsSet: Set<number> = new Set(
							existingGames.map((obj) => obj.sessionId)
						)
						throw new BadRequestException(
							`Selected sessions(s) not found: ${sessionIds.filter((sessionId) => !sessionIdsSet.has(sessionId))}`
						)
					}

					await this.commonModelPPPSession.softDeleteByIds(
						transaction,
						sessionIds,
						userId
					)
				}
			)

			return response.successResponse({
				message: `Session(s) deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new PPPSessionController()
