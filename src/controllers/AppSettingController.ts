import {NextFunction, Request, Response} from "express"

import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import {Headers} from "../types/common"

class AppSettingController {
	private commonModelAppSetting

	private idColumnAppSetting: string = "appSettingId"

	constructor() {
		this.commonModelAppSetting = new CommonModel(
			"AppSetting",
			this.idColumnAppSetting,
			[]
		)

		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const [appSetting] = await this.commonModelAppSetting.list(
						transaction,
						{
							range: {
								page: 1,
								pageSize: 1
							}
						}
					)

					return [appSetting]
				}
			)

			return response.successResponse({
				message: `App settings`,
				data
			})
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {appSettingId, ...restPayload} = req.body

			const [data] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// check if exists
					const [existingAppSetting] = await this.commonModelAppSetting.list(
						transaction,
						{
							filter: {
								appSettingId
							}
						}
					)
					if (!existingAppSetting) {
						throw new BadRequestException(
							"App setting doesn't exist. Please contact admin"
						)
					}

					// update transaction
					await this.commonModelAppSetting.updateById(
						transaction,
						restPayload,
						appSettingId,
						userId
					)

					// get updated details
					const [appSetting] = await this.commonModelAppSetting.list(
						transaction,
						{
							filter: {
								appSettingId
							}
						}
					)

					return [appSetting]
				}
			)

			return response.successResponse({
				message: `App settings updated successfully`,
				data
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new AppSettingController()
