import express, {Router} from "express"

import UserBankDetailController from "../controllers/UserBankDetailController"

// routes
export class UserBankDetailRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/save", UserBankDetailController.save)
			.post("/list", UserBankDetailController.list)
			.post("/delete", UserBankDetailController.delete)
	}
}
