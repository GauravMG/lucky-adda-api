import axios from "axios"

import {CreateTransactionPayload} from "../types/pay-from-upi"

const BASE_PATH: string = "https://payfromupi.com/api"
const PAY_FROM_UPI_APP_LOGIN_KEY: string = process.env
	.PAY_FROM_UPI_APP_LOGIN_KEY as string

// Create an Axios instance with default config
const axiosObj = axios.create({
	baseURL: BASE_PATH,
	headers: {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${PAY_FROM_UPI_APP_LOGIN_KEY}`
	}
})

export const createTransaction = async (payload: CreateTransactionPayload) => {
	try {
		const response = await axiosObj.post("/transactions/create", payload)
		return response.data
	} catch (error) {
		throw error
	}
}
