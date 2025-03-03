import express, {Router} from "express"

import WalletController from "../controllers/WalletController"

// routes
export class WalletRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", WalletController.create)
			.post("/list", WalletController.list)
			.post("/update", WalletController.update)

			.post("/top-winner", WalletController.topWinner)
	}
}
