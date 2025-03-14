import dotenv from "dotenv"
dotenv.config() // Load environment variables

import compression from "compression"
import cors from "cors"
import express, {Application} from "express"
import helmet from "helmet"
import morgan from "morgan"
import path from "path"

import {runSeeders} from "./lib/PrismaLib"
import {
	accessControl,
	middleware404,
	optionsMiddleware
} from "./middlewares/APIMiddlewares"
import {errorHandler} from "./middlewares/ErrorHandler"
import routes from "./routes/MainRouter"
import startCronJobs from "./services/cronService"
import {validateJWTToken} from "./utils/Jwt"
import {accessLogStream, logMessage} from "./utils/Logger"
import {getAccessToken} from "./lib/FCMService"
// import {sendPushNotification} from "./lib/sendPush"
import {sendPushNotification} from "./lib/FCMService"

const PORT = process.env.PORT
const BASE_URL_API = process.env.BASE_URL_API

const app: Application = express()

// Access-Control-Allow-Origin
app.use(accessControl)

// Middleware
app.use(cors()) // Cross-Origin Resource Sharing
app.use(compression()) // Gzip Compression
app.use(express.json({limit: "50mb"}))
app.use(express.urlencoded({limit: "50mb", extended: true}))
app.use(express.static(path.join(process.cwd(), "public")))

app.use(optionsMiddleware)

// use helmet for Security headers
app.use(helmet.contentSecurityPolicy())
app.use(helmet.crossOriginEmbedderPolicy())
app.use(helmet.crossOriginOpenerPolicy())
app.use(helmet.crossOriginResourcePolicy())
app.use(helmet.dnsPrefetchControl())
app.use(helmet.frameguard())
app.use(helmet.hidePoweredBy())
app.use(helmet.hsts())
app.use(helmet.ieNoOpen())
app.use(helmet.noSniff())
app.use(helmet.originAgentCluster())
app.use(helmet.permittedCrossDomainPolicies())
app.use(helmet.referrerPolicy())
app.use(helmet.xssFilter())

// Logging middleware for access logs
app.use(morgan("combined", {stream: accessLogStream}))
app.use(morgan("dev")) // Log to console in development

// Routes
app.get("/", async (req, res, next) => {
	res.status(200).send("This is lucky-adda-api repo running...")
})
app.get("/send-test-push", async (req, res, next) => {
	try {
		const fcmToken = req.query.fcmToken as string
		// const response = await sendPushNotification(
		// 	fcmToken ??"evHfa8UvTPShSjQbzURgVM:APA91bGIxEX9zs1AFRj9ub3EBPoY-lvhvLMSEl1I_LTZvOyttbzO0h6MAPbKw5bCwo7YeQM2AcIUGviZblGU9oEN681P0s1Syxo_r2F3VBMT6A7RsV5YklE",
		// 	"Result Out",
		// 	"Result Out Now",
		// 	{}
		// )

		const response = await sendPushNotification({
			token: fcmToken,
			title: `Result Out`,
			body: `Result Out Now`,
			data: {
				// referenceId: loadId
			}
		})

		res.json(response)
	} catch (error) {
		next(error)
	}
})
app.use(validateJWTToken)
app.use(routes)

// Route not found middleware
app.use("*", middleware404)

// Error handling middleware to log errors to error logs
app.use(errorHandler)

// Initialize cron jobs
startCronJobs()

app.listen(PORT, async () => {
	logMessage("access", `Server running on ${BASE_URL_API} on port ${PORT}`)
	runSeeders()
})
