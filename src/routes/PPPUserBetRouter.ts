import express, {Router} from "express"

import PPPUserBetController from "../controllers/PPPUserBetController"

// routes
export class PPPUserBetRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/place", PPPUserBetController.placeBet)
			.post("/list", PPPUserBetController.listUserBet)
			.post("/result", PPPUserBetController.listPPPResults)
	}
}
