import express, {Router} from "express"

import PPPSessionController from "../controllers/PPPSessionController"

// routes
export class PPPSessionRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", PPPSessionController.create)
			.post("/list", PPPSessionController.list)
			.post("/update", PPPSessionController.update)
			.post("/delete", PPPSessionController.delete)
	}
}
