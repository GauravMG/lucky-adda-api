"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommonModel_1 = __importDefault(require("./CommonModel"));
class UserModel {
    getBusinessByUserIds = async (transaction, userIds) => {
        try {
            if (!userIds?.length) {
                return [];
            }
            // get all business mappings by user ids
            const commonModelBusinessUserMapping = new CommonModel_1.default("BusinessUserMapping", "businessUserMappingId", []);
            const businessUserMappings = await commonModelBusinessUserMapping.list(transaction, {
                filter: { userId: userIds }
                // fields: ["businessId", "userId"]
            });
            const businessIds = businessUserMappings?.map((el) => el.businessId);
            if (!businessIds?.length) {
                return [];
            }
            // get all businesses by ids
            const commonModelBusiness = new CommonModel_1.default("Business", "businessId", [
                "name",
                "type",
                "yearOfIncorporation",
                "address",
                "city",
                "state",
                "country"
            ]);
            const businesses = await commonModelBusiness.list(transaction, {
                filter: { businessId: businessIds }
            });
            if (!businesses?.length) {
                return [];
            }
            const result = userIds.map((userId) => ({
                userId,
                business: businesses.find((business) => business.businessId ===
                    businessUserMappings.find((businessUserMapping) => businessUserMapping.userId === userId)?.businessId)
            }));
            return result;
        }
        catch (error) {
            throw error;
        }
    };
}
exports.default = UserModel;
