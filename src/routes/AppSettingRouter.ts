import express, {Router} from "express"

import AppSettingController from "../controllers/AppSettingController"

// routes
export class AppSettingRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/list", AppSettingController.list)
			.post("/update", AppSettingController.update)
	}
}
