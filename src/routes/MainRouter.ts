import express from "express"

import {
	AppSettingRouter,
	AuthRouter,
	DocumentRouter,
	GameRouter,
	NotificationRouter,
	RoleRouter,
	UploadRouter,
	UserBankDetailRouter,
	UserRouter,
	WalletRouter,
	PaymentRouter
} from "."

const router = express.Router()

// auth routes
router.use("/v1/auth", new AuthRouter().router)

// master routes
router.use("/v1/role", new RoleRouter().router)

// helper routes
router.use("/v1/upload", new UploadRouter().router)

// user routes
router.use("/v1/user", new UserRouter().router)
router.use("/v1/wallet", new WalletRouter().router)
router.use("/v1/user-bank-detail", new UserBankDetailRouter().router)

// other routes
router.use("/v1/document", new DocumentRouter().router)
router.use("/v1/notification", new NotificationRouter().router)
router.use("/v1/app-setting", new AppSettingRouter().router)

// game routes
router.use("/v1/game", new GameRouter().router)

// payment routes
router.use("/v1/payment", new PaymentRouter().router)

export default router
