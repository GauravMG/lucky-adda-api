import {NextFunction, Request, Response} from "express"

import {listAPIPayload} from "../helpers"
import {ApiResponse} from "../lib/APIResponse"
import {PrismaClientTransaction, prisma} from "../lib/PrismaLib"
import {BadRequestException} from "../lib/exceptions"
import CommonModel from "../models/CommonModel"
import {DEFAULT_PAGE, DEFAULT_PAGE_SIZE, Headers} from "../types/common"

class PPPImageController {
	private commonModelPPPImage

	private idColumnPPPImage: string = "imageId"

	constructor() {
		this.commonModelPPPImage = new CommonModel(
			"PPPImage",
			this.idColumnPPPImage,
			[]
		)

		this.create = this.create.bind(this)
		this.list = this.list.bind(this)
		this.update = this.update.bind(this)
		this.delete = this.delete.bind(this)
	}

	public async createImage(payload, userId: number) {
		const [images] = await prisma.$transaction(
			async (transaction: PrismaClientTransaction) => {
				// create image
				const image = await this.commonModelPPPImage.bulkCreate(
					transaction,
					payload,
					userId
				)
				if (!image.length) {
					throw new BadRequestException(`Failed to create ppp image(s).`)
				}

				return [image]
			}
		)

		return images
	}

	public async create(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)
			const {userId, roleId}: Headers = req.headers

			const payload = Array.isArray(req.body) ? req.body : [req.body]

			const image = await this.createImage(payload, userId)

			return response.successResponse({
				message: `PPP Image(s) created successfully`,
				data: image
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
						this.commonModelPPPImage.list(transaction, {
							filter,
							range,
							sort
						}),

						this.commonModelPPPImage.list(transaction, {
							filter,
							isCountOnly: true
						})
					])
				}
			)

			return response.successResponse({
				message: `PPP Images data`,
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

			const {imageId, ...restPayload} = req.body

			const [images] = await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					// check if role exists
					const [existingPPPImage] = await this.commonModelPPPImage.list(
						transaction,
						{
							filter: {
								imageId
							}
						}
					)
					if (!existingPPPImage) {
						throw new BadRequestException("PPPImage doesn't exist")
					}

					// update role
					await this.commonModelPPPImage.updateById(
						transaction,
						restPayload,
						imageId,
						userId
					)

					// get updated details
					const [image] = await this.commonModelPPPImage.list(transaction, {
						filter: {
							imageId
						}
					})

					return [image]
				}
			)

			return response.successResponse({
				message: `Details updated successfully`,
				data: images
			})
		} catch (error) {
			next(error)
		}
	}

	public async delete(req: Request, res: Response, next: NextFunction) {
		try {
			const response = new ApiResponse(res)

			const {userId, roleId}: Headers = req.headers

			const {imageIds} = req.body

			if (!imageIds?.length) {
				throw new BadRequestException(`Please select image(s) to be deleted`)
			}

			await prisma.$transaction(
				async (transaction: PrismaClientTransaction) => {
					const existingGames = await this.commonModelPPPImage.list(
						transaction,
						{
							filter: {
								imageId: imageIds
							}
						}
					)
					if (!existingGames.length) {
						const imageIdsSet: Set<number> = new Set(
							existingGames.map((obj) => obj.imageId)
						)
						throw new BadRequestException(
							`Selected images(s) not found: ${imageIds.filter((imageId) => !imageIdsSet.has(imageId))}`
						)
					}

					await this.commonModelPPPImage.softDeleteByIds(
						transaction,
						imageIds,
						userId
					)
				}
			)

			return response.successResponse({
				message: `Image(s) deleted successfully`
			})
		} catch (error) {
			next(error)
		}
	}
}

export default new PPPImageController()
