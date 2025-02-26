import {NextFunction, Request, Response} from "express"

import {listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, Headers} from "../types/common"

class UserBankDetailController {
	private commonModelUserBankDetail

	private idColumnUserBankDetail: string = "userBankDetailId"

	constructor() {
		this.commonModelUserBankDetail = new CommonModel(
			"UserBankDetail",
			this.idColumnUserBankDetail,
			[]
		)

		this.save = this.save.bind(this)
		this.list = this.list.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async save(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {userBankDetailId, ...restPayload} = req.body

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// check if exists
					let [existingUserBankDetail] =
						await this.commonModelUserBankDetail.list(transaction, {
							filter: {
								userBankDetailId
							}
						})
					if (!existingUserBankDetail) {
						const [newUserBankDetail] =
							await this.commonModelUserBankDetail.bulkCreate(
								transaction,
								[
									{
										userId,
										accountType: restPayload.accountType,
										accountHolderName: restPayload.accountHolderName,
										accountNumber: restPayload.accountNumber,
										bankName: restPayload.bankName ?? null,
										ifscCode: restPayload.ifscCode ?? null
									}
								],
								userId
							)

						existingUserBankDetail = {...newUserBankDetail}
					} else {
						await this.commonModelUserBankDetail.updateById(
							transaction,
							restPayload,
							userBankDetailId,
							userId
						)

						// get updated details
						const [userBankDetail] = await this.commonModelUserBankDetail.list(
							transaction,
							{
								filter: {
									userBankDetailId
								}
							}
						)

						existingUserBankDetail = {...userBankDetail}
					}

					return [existingUserBankDetail]
				}
			)

			return response.successResponse({
				message: `Account details updated successfully`,
				data
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
					? filter.userId
						? filter
						: {
								...filter,
								userId
							}
					: {userId}

			const [data, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await Promise.all([
						this.commonModelUserBankDetail.list(transaction, {
							filter,
							range,
							sort
						}),

						this.commonModelUserBankDetail.list(transaction, {
							filter,
							isCountOnly: true
						})
					])
				}
			)

			return response.successResponse({
				message: `User bank details`,
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

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {userBankDetailIds} = req.body

			if (!userBankDetailIds?.length) {
				throw new BadRequestException(
					`Please select user bank detail(s) to be deleted`
				)
			}

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const existingUserBankDetails =
						await this.commonModelUserBankDetail.list(transaction, {
							filter: {
								userBankDetailId: userBankDetailIds
							}
						})
					if (!existingUserBankDetails.length) {
						const userBankDetailIdsSet: Set<number> = new Set(
							existingUserBankDetails.map((obj) => obj.userBankDetailId)
						)
						throw new BadRequestException(
							`Selected user(s) not found: ${userBankDetailIds.filter((userBankDetailId) => !userBankDetailIdsSet.has(userBankDetailId))}`
						)
					}

					await this.commonModelUserBankDetail.softDeleteByIds(
						transaction,
						userBankDetailIds,
						userId
					)
				}
			)

			return response.successResponse({
				message: `User bank detail(s) deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new UserBankDetailController()
