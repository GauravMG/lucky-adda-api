import express, {Router} from "express"

import DocumentController from "../controllers/DocumentController"

// routes
export class DocumentRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/contact-detail", DocumentController.contactDetail)
			.post("/faq", DocumentController.faq)
			.post("/privacy-policy", DocumentController.privacyPolicy)
			.post("/tnc", DocumentController.tnc)
	}
}
