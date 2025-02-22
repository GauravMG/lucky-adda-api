import {NextFunction, Request, Response} from "express"

import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"

class UserController {
	private commonModelUser

	private idColumnUser: string = "userId"

	constructor() {
		this.commonModelUser = new CommonModel("User", this.idColumnUser, [
			"roleId",
			"fullName",
			"mobile"
		])

		this.update = this.update.bind(this)
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
}

export default new UserController()
