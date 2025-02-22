import {snakeToPascal} from "../helpers"

export enum LoadCurrentStatus {
	Driver_Assigned = "driver_assigned",
	Ready_To_Track = "ready_to_track",
	Arrived_At_Origin = "arrived_at_origin",
	Departed_From_Origin = "departed_from_origin",
	In_Transit = "in_transit",
	Arrived_At_Destination = "arrived_at_destination",
	Departed_From_Destination = "departed_from_destination"
}

export const LOAD_CURRENT_STATUSES = [
	{
		loadStatus: LoadCurrentStatus.Driver_Assigned,
		loadStatusDisplayText: snakeToPascal(LoadCurrentStatus.Driver_Assigned)
	},
	{
		loadStatus: LoadCurrentStatus.Ready_To_Track,
		loadStatusDisplayText: snakeToPascal(LoadCurrentStatus.Ready_To_Track)
	},
	{
		loadStatus: LoadCurrentStatus.Arrived_At_Origin,
		loadStatusDisplayText: snakeToPascal(LoadCurrentStatus.Arrived_At_Origin)
	},
	{
		loadStatus: LoadCurrentStatus.Departed_From_Origin,
		loadStatusDisplayText: snakeToPascal(LoadCurrentStatus.Departed_From_Origin)
	},
	{
		loadStatus: LoadCurrentStatus.In_Transit,
		loadStatusDisplayText: snakeToPascal(LoadCurrentStatus.In_Transit)
	},
	{
		loadStatus: LoadCurrentStatus.Arrived_At_Destination,
		loadStatusDisplayText: snakeToPascal(
			LoadCurrentStatus.Arrived_At_Destination
		)
	},
	{
		loadStatus: LoadCurrentStatus.Departed_From_Destination,
		loadStatusDisplayText: snakeToPascal(
			LoadCurrentStatus.Departed_From_Destination
		)
	}
]

export enum LoadDeliveryStatus {
	On_Time = "on_time",
	Delayed = "delayed",
	Cant_Make_It = "cant_make_it",
	Completed = "completed"
}

export const LOAD_DELIVERY_STATUSES = [
	{
		loadDeliveryStatus: LoadDeliveryStatus.On_Time,
		loadDeliveryStatusDisplayText: snakeToPascal(LoadDeliveryStatus.On_Time)
	},
	{
		loadDeliveryStatus: LoadDeliveryStatus.Delayed,
		loadDeliveryStatusDisplayText: snakeToPascal(LoadDeliveryStatus.Delayed)
	},
	{
		loadDeliveryStatus: LoadDeliveryStatus.Cant_Make_It,
		loadDeliveryStatusDisplayText: snakeToPascal(
			LoadDeliveryStatus.Cant_Make_It
		)
	},
	{
		loadDeliveryStatus: LoadDeliveryStatus.Completed,
		loadDeliveryStatusDisplayText: snakeToPascal(LoadDeliveryStatus.Completed)
	}
]
