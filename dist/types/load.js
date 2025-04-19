"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOAD_DELIVERY_STATUSES = exports.LoadDeliveryStatus = exports.LOAD_CURRENT_STATUSES = exports.LoadCurrentStatus = void 0;
const helpers_1 = require("../helpers");
var LoadCurrentStatus;
(function (LoadCurrentStatus) {
    LoadCurrentStatus["Driver_Assigned"] = "driver_assigned";
    LoadCurrentStatus["Ready_To_Track"] = "ready_to_track";
    LoadCurrentStatus["Arrived_At_Origin"] = "arrived_at_origin";
    LoadCurrentStatus["Departed_From_Origin"] = "departed_from_origin";
    LoadCurrentStatus["In_Transit"] = "in_transit";
    LoadCurrentStatus["Arrived_At_Destination"] = "arrived_at_destination";
    LoadCurrentStatus["Departed_From_Destination"] = "departed_from_destination";
})(LoadCurrentStatus || (exports.LoadCurrentStatus = LoadCurrentStatus = {}));
exports.LOAD_CURRENT_STATUSES = [
    {
        loadStatus: LoadCurrentStatus.Driver_Assigned,
        loadStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadCurrentStatus.Driver_Assigned)
    },
    {
        loadStatus: LoadCurrentStatus.Ready_To_Track,
        loadStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadCurrentStatus.Ready_To_Track)
    },
    {
        loadStatus: LoadCurrentStatus.Arrived_At_Origin,
        loadStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadCurrentStatus.Arrived_At_Origin)
    },
    {
        loadStatus: LoadCurrentStatus.Departed_From_Origin,
        loadStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadCurrentStatus.Departed_From_Origin)
    },
    {
        loadStatus: LoadCurrentStatus.In_Transit,
        loadStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadCurrentStatus.In_Transit)
    },
    {
        loadStatus: LoadCurrentStatus.Arrived_At_Destination,
        loadStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadCurrentStatus.Arrived_At_Destination)
    },
    {
        loadStatus: LoadCurrentStatus.Departed_From_Destination,
        loadStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadCurrentStatus.Departed_From_Destination)
    }
];
var LoadDeliveryStatus;
(function (LoadDeliveryStatus) {
    LoadDeliveryStatus["On_Time"] = "on_time";
    LoadDeliveryStatus["Delayed"] = "delayed";
    LoadDeliveryStatus["Cant_Make_It"] = "cant_make_it";
    LoadDeliveryStatus["Completed"] = "completed";
})(LoadDeliveryStatus || (exports.LoadDeliveryStatus = LoadDeliveryStatus = {}));
exports.LOAD_DELIVERY_STATUSES = [
    {
        loadDeliveryStatus: LoadDeliveryStatus.On_Time,
        loadDeliveryStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadDeliveryStatus.On_Time)
    },
    {
        loadDeliveryStatus: LoadDeliveryStatus.Delayed,
        loadDeliveryStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadDeliveryStatus.Delayed)
    },
    {
        loadDeliveryStatus: LoadDeliveryStatus.Cant_Make_It,
        loadDeliveryStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadDeliveryStatus.Cant_Make_It)
    },
    {
        loadDeliveryStatus: LoadDeliveryStatus.Completed,
        loadDeliveryStatusDisplayText: (0, helpers_1.snakeToPascal)(LoadDeliveryStatus.Completed)
    }
];
