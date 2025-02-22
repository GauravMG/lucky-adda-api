import express, {Router} from "express"

import AuthController from "../controllers/AuthController"

// routes
export class AuthRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/sign-in-with-otp", AuthController.signInWithOTP)
			.post("/get-me", AuthController.getMe)
			.post("/refresh-token", AuthController.refreshToken)
			.post("/logout", AuthController.logout)

			.post("/send-otp", AuthController.sendOTP)
	}
}
