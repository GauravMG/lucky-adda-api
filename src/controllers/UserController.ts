import {NextFunction, Request, Response} from "express"

import {listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, Headers} from "../types/common"

class UserController {
	private commonModelUser

	private idColumnUser: string = "userId"

	constructor() {
		this.commonModelUser = new CommonModel("User", this.idColumnUser, [
			"roleId",
			"fullName",
			"mobile"
		])

		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {roleId}: Headers = req.headers

			const {filter, range, sort} = await listAPIPayload(req.body)

			const [data, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await Promise.all([
						this.commonModelUser.list(transaction, {
							filter,
							range,
							sort
						}),

						this.commonModelUser.list(transaction, {
							filter,
							isCountOnly: true
						})
					])
				}
			)

			return response.successResponse({
				message: `Users data`,
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

			const {userId, ...restPayload} = req.body

			const [user] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// check if user exists
					const [existingUser] = await this.commonModelUser.list(transaction, {
						filter: {
							userId
						}
					})
					if (!existingUser) {
						throw new BadRequestException("User doesn't exist")
					}

					// update user
					await this.commonModelUser.updateById(
						transaction,
						restPayload,
						userId,
						userId
					)

					// get updated details
					const [user] = await this.commonModelUser.list(transaction, {
						filter: {
							userId
						}
					})

					return [user]
				}
			)

			return response.successResponse({
				message: `Details updated successfully`,
				data: user
			})
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {userIds} = req.body

			if (!userIds?.length) {
				throw new BadRequestException(`Please select user(s) to be deleted`)
			}

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const existingUsers = await this.commonModelUser.list(transaction, {
						filter: {
							userId: userIds
						}
					})
					if (!existingUsers.length) {
						const userIdsSet: Set<number> = new Set(
							existingUsers.map((obj) => obj.userId)
						)
						throw new BadRequestException(
							`Selected user(s) not found: ${userIds.filter((userId) => !userIdsSet.has(userId))}`
						)
					}

					await this.commonModelUser.softDeleteByIds(
						transaction,
						userIds,
						userId
					)
				}
			)

			return response.successResponse({
				message: `User(s) deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new UserController()
