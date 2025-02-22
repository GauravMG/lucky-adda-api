import express, {Router} from "express"

import NotificationController from "../controllers/NotificationController"

// routes
export class NotificationRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", NotificationController.create)
			.post("/list", NotificationController.list)
			.post("/update", NotificationController.update)
			.post("/delete", NotificationController.delete)
	}
}
