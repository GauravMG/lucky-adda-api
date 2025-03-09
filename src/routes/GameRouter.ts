import express, {Router} from "express"

import GameController from "../controllers/GameController"

// routes
export class GameRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", GameController.create)
			.post("/list", GameController.list)
			.post("/update", GameController.update)
			.post("/delete", GameController.delete)

			.post("/list-result", GameController.listGameResults)
			.post("/list-result-chart", GameController.listGameResultsChart)

			.post("/save-user-bet", GameController.saveUserBet)
			.post("/list-user-bet", GameController.listUserBet)

			.post("/process-result", GameController.handleGameResult)
	}
}
