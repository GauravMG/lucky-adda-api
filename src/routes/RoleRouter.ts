import express, {Router} from "express"

import RoleController from "../controllers/RoleController"

// routes
export class RoleRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/list", RoleController.list)
			.post("/update", RoleController.update)
	}
}
