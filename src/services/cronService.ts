import cron from "node-cron"

import GameController from "../controllers/GameController"

// Sample cron job — runs every minute
cron.schedule("* * * * *", () => {
	console.log("Running a task every minute:", new Date().toISOString())

	GameController.finalizeGameResult()
})

const startCronJobs = () => {
	console.log("Cron jobs initialized.")
}

export default startCronJobs
