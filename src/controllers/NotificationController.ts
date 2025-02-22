import {NextFunction, Request, Response} from "express"

import {listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, Headers} from "../types/common"

class NotificationController {
	private commonModelUserNotification

	private idColumnNotification: string = "userNotificationId"

	constructor() {
		this.commonModelUserNotification = new CommonModel(
			"UserNotification",
			this.idColumnNotification,
			["title"]
		)

		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async createNotification(payload, userId: number) {
		const [notifications] = await prisma.$transaction(
			async (transaction: PrismaClientTransaction) => {
				// create users
				const notifications = await this.commonModelUserNotification.bulkCreate(
					transaction,
					payload,
					userId
				)
				if (!notifications.length) {
					throw new BadRequestException(`Failed to create notification(s).`)
				}

				return [notifications]
			}
		)

		return notifications
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {userId, roleId}: Headers = req.headers

			const payload = Array.isArray(req.body) ? req.body : [req.body]

			const userNotifications = await this.createNotification(payload, userId)

			return response.successResponse({
				message: `Notification alert(s) created successfully`,
				data: userNotifications
			})
		} catch (error) {
			next(error)
		}
	}

	public async list(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {userId}: Headers = req.headers
			const {filter, range, sort} = await listAPIPayload(req.body)

			// user id check so user could only check their data
			filter["userId"] = userId

			const [userNotifications, total] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					return await Promise.all([
						this.commonModelUserNotification.list(transaction, {
							filter,
							range,
							sort
						}),

						this.commonModelUserNotification.list(transaction, {
							filter,
							isCountOnly: true
						})
					])
				}
			)

			return response.successResponse({
				message: `Notification list`,
				metadata: {
					total,
					page: range?.page ?? DEFAULT_PAGE,
					pageSize: range?.pageSize ?? DEFAULT_PAGE_SIZE
				},
				data: userNotifications
			})
		} catch (error) {
			next(error)
		}
	}

	public async update(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId}: Headers = req.headers
			const {userNotificationId, ...restPayload} = req.body

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// check if notification exists
					const [existingNotification] =
						await this.commonModelUserNotification.list(transaction, {
							filter: {
								userNotificationId
							}
						})

					if (!existingNotification) {
						throw new BadRequestException("Notification doesn't exist")
					}

					// update notifications
					await this.commonModelUserNotification.updateById(
						transaction,
						restPayload,
						userNotificationId,
						userId
					)
				}
			)

			return response.successResponse({
				message: `User notification updated successfully`
			})
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId}: Headers = req.headers
			const {userNotificationIds} = req.body

			if (!userNotificationIds?.length) {
				throw new BadRequestException(
					`Please select notification(s) to be deleted`
				)
			}

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// check if notifications exists
					const existingNotifications =
						await this.commonModelUserNotification.list(transaction, {
							filter: {
								userNotificationId: userNotificationIds
							}
						})

					if (userNotificationIds?.length !== existingNotifications?.length) {
						const userNotificationIdsSet: Set<number> = new Set(
							existingNotifications.map((obj) => obj.userNotificationId)
						)
						throw new BadRequestException(
							`Selected notification(s) not found: ${userNotificationIds.filter((userNotificationId) => !userNotificationIdsSet.has(userNotificationId))}`
						)
					}

					await this.commonModelUserNotification.softDeleteByIds(
						transaction,
						userNotificationIds,
						userId
					)
				}
			)

			return response.successResponse({
				message: `Notification(s) deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new NotificationController()
