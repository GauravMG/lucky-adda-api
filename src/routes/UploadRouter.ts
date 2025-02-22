import express, {Router} from "express"

import UploadController from "../controllers/UploadController"
import upload from "../utils/Multer"

// routes
export class UploadRouter {
	public readonly router: Router
	constructor() {
		this.router = express.Router()
		this.router
			.post("/single", upload.single("file"), UploadController.uploadSingle)
			.post(
				"/multiple",
				upload.array("files", 10),
				UploadController.uploadMultiple
			)
	}
}
