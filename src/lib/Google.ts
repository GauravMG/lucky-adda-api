import axios from "axios"

import {logMessage} from "../utils/Logger"

type GeocodingResponseResult = {
	address_components: Array<{
		long_name: string | null
		short_name: string | null
		types: Array<string> | null
	}>
	formatted_address: string
	geometry: {
		bounds: any
		location: {
			lat: number
			lng: number
		}
		location_type: string
		viewport: any
	}
	navigation_points: any
	place_id: string
	types: Array<string>
}

type GeocodingResponse = {
	results: Array<GeocodingResponseResult>
}

const GOOGLE_API_KEY: string = process.env.GOOGLE_API_KEY as string

export const getAddressFromLatLong = async (
	lat: number,
	lng: number
): Promise<GeocodingResponseResult | undefined> => {
	const url: string = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`

	try {
		const response = await axios.get<GeocodingResponse>(url)
		const result: GeocodingResponseResult = response.data.results[0]

		if (result) {
			return result
		}

		return undefined
	} catch (error: any) {
		logMessage("error", error?.message.toString())
		return undefined
	}
}

export const getLatLongFromAddress = async (
	address: string
): Promise<{lat: number; lng: number} | undefined> => {
	const url: string = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`

	try {
		const response = await axios.get(url)
		const result = response.data.results[0]

		if (result) {
			const location = result.geometry.location
			return {lat: location.lat, lng: location.lng}
		}

		return undefined
	} catch (error: any) {
		logMessage("error", error?.message.toString())
		return undefined
	}
}
