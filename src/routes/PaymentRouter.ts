import express, {Router} from "express"

import PaymentController from "../controllers/PaymentController"

// routes
export class PaymentRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/create", PaymentController.create)
			.post("/update", PaymentController.update)
			.get("/webhook", PaymentController.webhook)
			.post("/webhook", PaymentController.webhook)
	}
}
