import express, {Router} from "express"

import ReportController from "../controllers/ReportController"

// routes
export class ReportRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/games-stats", ReportController.gamesStats)
			.post("/bets-by-numbers", ReportController.betsByNumbers)
			.post("/bets-by-users", ReportController.betsByUsers)
	}
}
