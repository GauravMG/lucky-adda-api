import {PrismaClientTransaction} from "../lib/PrismaLib"
import {ListParams} from "../types/common"
import CommonModel from "./CommonModel"

export default class ReportModel {
	gameStats = async (
		transaction: PrismaClientTransaction,
		{filter}: ListParams
	) => {
		try {
			const whereArr: string[] = [`g."deletedAt" IS NULL`]

			if (filter) {
				if (filter.gameId) {
					whereArr.push(`g."gameId" = ${filter.gameId}`)
				}
			}

			const commonModel = new CommonModel("", "", [])

			let data: any = await commonModel.rawQuery(
				transaction,
				`
					SELECT
						g."gameId",
						g."logo",
						g."name" AS "gameName",
						COALESCE(SUM(ub."betAmount"), 0) AS "totalBetAmount",
						COALESCE(SUM(ub."winningAmount"), 0) AS "totalWinningAmount",
						COALESCE(SUM(ub."betAmount") - SUM(ub."winningAmount"), 0) AS "totalProfit",
						gr."resultNumber",
						(
							SELECT ub2."betNumber"
							FROM "UserBet" ub2
							WHERE ub2."gameId" = g."gameId"
								AND ub2."deletedAt" IS NULL
								AND DATE(ub2."createdAt") = CURRENT_DATE
							GROUP BY ub2."betNumber"
							ORDER BY SUM(ub2."betAmount") DESC
							LIMIT 1
						) AS "maxBetNumber"
					FROM "Game" g
					LEFT JOIN "UserBet" ub
						ON ub."gameId" = g."gameId"
							AND ub."deletedAt" IS NULL
							AND DATE(ub."createdAt") = CURRENT_DATE
					LEFT JOIN "GameResult" gr
						ON gr."gameId" = g."gameId"
							AND gr."deletedAt" IS NULL
							AND gr."resultType" = 'final'
							AND DATE(gr."resultTime") = CURRENT_DATE
					WHERE ${whereArr.join(" AND ")}
					GROUP BY g."gameId", g."logo", g."name", gr."resultNumber"
					ORDER BY g."gameId" ASC
				`
			)

			return data
		} catch (error) {
			throw error
		}
	}

	betsByNumbers = async (
		transaction: PrismaClientTransaction,
		{filter}: ListParams
	) => {
		try {
			const whereArr: string[] = [
				`ub."deletedAt" IS NULL`,
				`DATE(ub."createdAt") = CURRENT_DATE`
			]

			if (filter) {
				if (filter.gameId) {
					whereArr.push(`ub."gameId" = ${filter.gameId}`)
				}
			}

			const commonModel = new CommonModel("", "", [])

			let data: any = await commonModel.rawQuery(
				transaction,
				`
					SELECT
						ub."betNumber" AS "number",
						COUNT(*) AS "totalBetsPlaced",
						SUM(ub."betAmount") AS "totalBetAmount"
					FROM "UserBet" AS ub
					WHERE ${whereArr.join(" AND ")}
					GROUP BY ub."betNumber"
					ORDER BY ub."betNumber"
				`
			)

			return data
		} catch (error) {
			throw error
		}
	}

	betsByUsers = async (
		transaction: PrismaClientTransaction,
		{filter}: ListParams
	) => {
		try {
			const whereArr: string[] = [
				`ub."deletedAt" IS NULL`,
				`DATE(ub."createdAt") = CURRENT_DATE`
			]

			if (filter) {
				if (filter.gameId) {
					whereArr.push(`ub."gameId" = ${filter.gameId}`)
				}
				if (filter.betNumber) {
					whereArr.push(`ub."betNumber" = ${filter.betNumber}`)
				}
			}

			const commonModel = new CommonModel("", "", [])

			let data: any = await commonModel.rawQuery(
				transaction,
				`
					SELECT
						u."fullName" AS "userFullName",
						u."mobile" AS "userMobile",
						ub."betNumber",
						STRING_AGG(ub."betAmount"::text, ',') as "betAmount"
					FROM "UserBet" AS ub
					JOIN "User" AS u ON ub."userId" = u."userId"
					WHERE ${whereArr.join(" AND ")}
					GROUP BY u."fullName", u."mobile", ub."betNumber"
				`
			)

			return data
		} catch (error) {
			throw error
		}
	}
}
