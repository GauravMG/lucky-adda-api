import {PrismaClientTransaction} from "../lib/PrismaLib"
import {ListParams} from "../types/common"
import CommonModel from "./CommonModel"

export default class WalletModel {
	getWalletBalanceByUserIds = async (
		transaction: PrismaClientTransaction,
		{
			filter = {
				isFetchAll: false
			},
			range,
			sort = [{orderBy: "totalCredit", orderDir: "desc"}]
		}: ListParams
	) => {
		try {
			if (!filter.isFetchAll && !filter.userIds?.length) {
				return []
			}

			const commonModelWallet = new CommonModel("Wallet", "walletId", [])
			let wallets: any = await commonModelWallet.rawQuery(
				transaction,
				`
				SELECT *
				FROM (
					SELECT
						w."userId",
						(
							SELECT
								SUM(w1."amount") AS "totalCredit"
							FROM "Wallet" AS w1
							WHERE w1."deletedAt" IS NULL
								AND w1."transactionType" = 'credit'
								AND w1."approvalStatus" = 'approved'
								AND w1."userId" = w."userId"
						) AS "totalCredit",
						(
							SELECT
								SUM(w1."amount") AS "totalDebit"
							FROM "Wallet" AS w1
							WHERE w1."deletedAt" IS NULL
								AND w1."transactionType" = 'debit'
								AND w1."approvalStatus" = 'approved'
								AND w1."userId" = w."userId"
						) AS "totalDebit"
					FROM "Wallet" AS w
					WHERE w."deletedAt" IS NULL
						${filter.userIds?.length ? `AND w."userId" IN (${filter.userIds.join(", ")})` : ""}
					GROUP BY w."userId"
				) AS "temp"
				ORDER BY ${sort.map(({orderBy, orderDir}) => `"${orderBy}" ${orderDir}`).join(", ")}
				${range?.page && !range?.all ? `LIMIT ${range.pageSize} OFFSET ${range.page - 1}` : ""}
			`
			)

			wallets = wallets.map((wallet) => ({
				...wallet,
				totalBalance: Number(wallet.totalCredit) - Number(wallet.totalDebit)
			}))

			return wallets
		} catch (error) {
			throw error
		}
	}
}
