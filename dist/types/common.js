"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalStatus = exports.DEFAULT_PAGE_SIZE = exports.DEFAULT_PAGE = void 0;
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_PAGE_SIZE = 10;
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["Pending"] = "pending";
    ApprovalStatus["Approved"] = "approved";
    ApprovalStatus["Rejected"] = "rejected";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
