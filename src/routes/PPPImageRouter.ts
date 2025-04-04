import express, {Router} from "express"

import PPPImageController from "../controllers/PPPImageController"

// routes
export class PPPImageRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", PPPImageController.create)
			.post("/list", PPPImageController.list)
			.post("/update", PPPImageController.update)
			.post("/delete", PPPImageController.delete)
	}
}
