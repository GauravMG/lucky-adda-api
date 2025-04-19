"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const helpers_1 = require("../helpers");
const APIResponse_1 = require("../lib/APIResponse");
const PrismaLib_1 = require("../lib/PrismaLib");
const exceptions_1 = require("../lib/exceptions");
// import {sendPushNotification} from "../lib/sendPush"
const FCMService_1 = require("../lib/FCMService");
const CommonModel_1 = __importDefault(require("../models/CommonModel"));
const common_1 = require("../types/common");
const Logger_1 = require("../utils/Logger");
class GameController {
    commonModelGame;
    commonModelGameResult;
    commonModelUserBet;
    commonModelWallet;
    commonModelLoginHistory;
    commonModelUser;
    idColumnGame = "gameId";
    idColumnGameResult = "resultId";
    idColumnUserBet = "betId";
    idColumnWallet = "walletId";
    idColumnLoginHistory = "loginHistoryId";
    idColumnUser = "userId";
    constructor() {
        this.commonModelGame = new CommonModel_1.default("Game", this.idColumnGame, [
            "name",
            "city"
        ]);
        this.commonModelGameResult = new CommonModel_1.default("GameResult", this.idColumnGameResult, []);
        this.commonModelUserBet = new CommonModel_1.default("UserBet", this.idColumnUserBet, []);
        this.commonModelWallet = new CommonModel_1.default("Wallet", this.idColumnWallet, []);
        this.commonModelLoginHistory = new CommonModel_1.default("LoginHistory", this.idColumnLoginHistory, []);
        this.commonModelUser = new CommonModel_1.default("User", this.idColumnUser, []);
        this.create = this.create.bind(this);
        this.list = this.list.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.listGameResults = this.listGameResults.bind(this);
        this.listGameResultsChart = this.listGameResultsChart.bind(this);
        this.saveUserBet = this.saveUserBet.bind(this);
        this.listUserBet = this.listUserBet.bind(this);
        this.handleGameResult = this.handleGameResult.bind(this);
        this.finalizeGameResult = this.finalizeGameResult.bind(this);
    }
    async create(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const payload = Array.isArray(req.body) ? req.body : [req.body];
            const [data] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const games = await this.commonModelGame.bulkCreate(transaction, payload, userId);
                return [games];
            });
            return response.successResponse({
                message: `Games created successfully`,
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
    async list(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { roleId } = req.headers;
            const { filter, range, sort } = await (0, helpers_1.listAPIPayload)(req.body);
            const customFilters = [];
            const previousDate = (0, dayjs_1.default)()
                .tz("Asia/Kolkata")
                .subtract(1, "days")
                .format("YYYY-MM-DD");
            const currentDate = (0, dayjs_1.default)().tz("Asia/Kolkata").format("YYYY-MM-DD");
            const currentTime = (0, dayjs_1.default)().tz("Asia/Kolkata").format("HH:mm");
            const currentTimePlus1Hour = (0, dayjs_1.default)()
                .tz("Asia/Kolkata")
                .add(60, "minutes")
                .format("HH:mm:ss");
            const currentTimeSub1Hour = (0, dayjs_1.default)()
                .tz("Asia/Kolkata")
                .subtract(60, "minutes")
                .format("HH:mm:ss");
            let gameStatus = "";
            let gameRange = null;
            if (filter?.gameStatus && Array.isArray(filter.gameStatus)) {
                if (filter.gameStatus.includes("live")) {
                    gameStatus = "live";
                    gameRange = {
                        all: true
                    };
                }
                else if (filter.gameStatus.includes("upcoming")) {
                    gameStatus = "upcoming";
                    gameRange = {
                        all: true
                    };
                }
                else if (filter.gameStatus.includes("past")) {
                    customFilters.push({ endTime: { lt: currentTime } });
                }
                delete filter.gameStatus;
            }
            const [data, total] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                let [games, total] = await Promise.all([
                    this.commonModelGame.list(transaction, {
                        filter,
                        customFilters,
                        range: gameRange ?? range,
                        sort
                    }),
                    this.commonModelGame.list(transaction, {
                        filter,
                        customFilters,
                        isCountOnly: true
                    })
                ]);
                let filteredGames = games;
                if (gameStatus !== "") {
                    if (gameStatus === "live") {
                        filteredGames = games.filter(({ startTime, endTime }) => {
                            if (startTime <= endTime) {
                                return startTime <= currentTime && endTime >= currentTime;
                            }
                            else {
                                return startTime <= currentTime || endTime >= currentTime;
                            }
                        });
                    }
                    else if (gameStatus === "upcoming") {
                        filteredGames = games.filter(({ startTime, resultTime }) => {
                            if (startTime <= resultTime) {
                                return startTime > currentTime;
                            }
                            else if (startTime > resultTime &&
                                currentTime <= "23:59:59") {
                                return startTime > currentTime;
                            }
                            else if (startTime > resultTime && currentTime > "23:59:59") {
                                return resultTime < currentTime;
                            }
                        });
                    }
                    if (!range?.all && range?.pageSize) {
                        filteredGames = filteredGames.slice((range.page - 1) * range.pageSize, range.pageSize);
                    }
                    if (gameStatus === "live") {
                        for (let i = 0; i < filteredGames.length; i++) {
                            let userBetTimeCondition = {};
                            if (filteredGames[i].startTime <= filteredGames[i].endTime) {
                                userBetTimeCondition = {
                                    createdAt: {
                                        gte: (0, dayjs_1.default)(`${currentDate} ${filteredGames[i].startTime}:00`)
                                            .tz("Asia/Kolkata")
                                            .toDate(),
                                        lte: (0, dayjs_1.default)(`${currentDate} ${filteredGames[i].endTime}:00`)
                                            .tz("Asia/Kolkata")
                                            .toDate()
                                    }
                                };
                            }
                            else if (filteredGames[i].startTime <= currentTime) {
                                userBetTimeCondition = {
                                    createdAt: {
                                        gte: (0, dayjs_1.default)(`${currentDate} ${filteredGames[i].startTime}:00`)
                                            .tz("Asia/Kolkata")
                                            .toDate()
                                    }
                                };
                            }
                            else if (filteredGames[i].endTime >= currentTime) {
                                userBetTimeCondition = {
                                    createdAt: {
                                        gte: (0, dayjs_1.default)(`${previousDate} ${filteredGames[i].startTime}:00`)
                                            .tz("Asia/Kolkata")
                                            .toDate(),
                                        lte: (0, dayjs_1.default)(`${currentDate} ${filteredGames[i].endTime}:00`)
                                            .tz("Asia/Kolkata")
                                            .toDate()
                                    }
                                };
                            }
                            let userBetsCount = await this.commonModelUserBet.list(transaction, {
                                filter: {
                                    gameId: filteredGames[i].gameId,
                                    ...userBetTimeCondition
                                }
                            });
                            userBetsCount = Array.from(new Map(userBetsCount.map((item) => [item.userId, item])).values());
                            // filteredGames[i].livePlayers = userBetsCount.length
                            filteredGames[i].livePlayers = (0, helpers_1.generateRandomNumber)();
                        }
                    }
                }
                return [filteredGames, total];
            });
            return response.successResponse({
                message: `Data`,
                metadata: {
                    total,
                    page: range?.page ?? common_1.DEFAULT_PAGE,
                    pageSize: range?.pageSize ?? common_1.DEFAULT_PAGE_SIZE
                },
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const { gameId, ...restPayload } = req.body;
            const [data] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                // check if game exists
                const [existingGame] = await this.commonModelGame.list(transaction, {
                    filter: {
                        gameId
                    }
                });
                if (!existingGame) {
                    throw new exceptions_1.BadRequestException("Game doesn't exist");
                }
                // update game
                await this.commonModelGame.updateById(transaction, restPayload, gameId, userId);
                // get updated details
                const [game] = await this.commonModelGame.list(transaction, {
                    filter: {
                        gameId
                    }
                });
                return [game];
            });
            return response.successResponse({
                message: `Details updated successfully`,
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const { gameIds } = req.body;
            if (!gameIds?.length) {
                throw new exceptions_1.BadRequestException(`Please select game(s) to be deleted`);
            }
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const existingGames = await this.commonModelGame.list(transaction, {
                    filter: {
                        gameId: gameIds
                    }
                });
                if (!existingGames.length) {
                    const gameIdsSet = new Set(existingGames.map((obj) => obj.gameId));
                    throw new exceptions_1.BadRequestException(`Selected games(s) not found: ${gameIds.filter((gameId) => !gameIdsSet.has(gameId))}`);
                }
                await this.commonModelGame.softDeleteByIds(transaction, gameIds, userId);
            });
            return response.successResponse({
                message: `Game(s) deleted successfully`
            });
        }
        catch (error) {
            next(error);
        }
    }
    async listGameResults(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { filter, range, sort } = await (0, helpers_1.listAPIPayload)(req.body);
            const customFilters = [];
            const currentTime = (0, dayjs_1.default)().tz("Asia/Kolkata").format("HH:mm:ss");
            const currentTimePlus1Hour = (0, dayjs_1.default)()
                .tz("Asia/Kolkata")
                .add(60, "minutes")
                .format("HH:mm:ss");
            const currentTimeSub1Hour = (0, dayjs_1.default)()
                .tz("Asia/Kolkata")
                .subtract(60, "minutes")
                .format("HH:mm:ss");
            const startOfDay = (0, dayjs_1.default)().utc().startOf("day").toISOString();
            const endOfDay = (0, dayjs_1.default)().utc().endOf("day").toISOString();
            // Handle resultStatus filtering
            if (filter?.resultStatus && Array.isArray(filter.resultStatus)) {
                if (filter.resultStatus.includes("live")) {
                    customFilters.push({
                        AND: [
                            { endTime: { lte: currentTime } },
                            { resultTime: { gte: currentTimeSub1Hour } }
                        ]
                    }); // resultTime has passed
                }
                if (filter.resultStatus.includes("upcoming")) {
                    customFilters.push({ endTime: { gt: currentTime } }); // resultTime in the future
                }
                if (filter.resultStatus.includes("past")) {
                    customFilters.push({ resultTime: { lt: currentTimeSub1Hour } }); // resultTime has passed
                }
                delete filter.resultStatus;
            }
            const [data, total] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                let [games, total] = await Promise.all([
                    this.commonModelGame.list(transaction, {
                        filter,
                        customFilters,
                        range,
                        sort
                    }),
                    this.commonModelGame.list(transaction, {
                        filter,
                        customFilters,
                        isCountOnly: true
                    })
                ]);
                const gameIds = games.map(({ gameId }) => gameId);
                const gameResults = await this.commonModelGameResult.list(transaction, {
                    filter: { gameId: gameIds },
                    customFilters: [
                        {
                            resultTime: {
                                gte: startOfDay,
                                lte: endOfDay
                            }
                        }
                    ],
                    range: { all: true }
                });
                games = games.map((game) => {
                    const thisGameResults = gameResults.filter((gameResult) => gameResult.gameId === game.gameId);
                    return {
                        ...game,
                        gameResults: thisGameResults ?? [],
                        gameResultFinal: thisGameResults?.at(-1) ?? null
                    };
                });
                // if (
                // 	filter?.resultStatus?.length === 1 &&
                // 	filter?.resultStatus?.includes("past")
                // ) {
                // 	games = games.filter(({gameResultFinal}) => gameResultFinal)
                // }
                return [games, total];
            });
            return response.successResponse({
                message: "Data",
                metadata: {
                    total,
                    page: range?.page ?? common_1.DEFAULT_PAGE,
                    pageSize: range?.pageSize ?? common_1.DEFAULT_PAGE_SIZE
                },
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
    async listGameResultsChart(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { filter, range, sort } = await (0, helpers_1.listAPIPayload)(req.body);
            const customFiltersGameResults = [];
            if ((filter?.resultMonth ?? "").trim() !== "") {
                const startOfMonth = (0, dayjs_1.default)(filter.resultMonth)
                    .startOf("month")
                    .toISOString();
                const endOfMonth = (0, dayjs_1.default)(filter.resultMonth)
                    .endOf("month")
                    .toISOString();
                customFiltersGameResults.push({
                    createdAt: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                });
                delete filter.resultMonth;
            }
            const [data, total] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                let [games, total] = await Promise.all([
                    this.commonModelGame.list(transaction, {
                        filter,
                        range,
                        sort
                    }),
                    this.commonModelGame.list(transaction, {
                        filter,
                        isCountOnly: true
                    })
                ]);
                const gameIds = games.map(({ gameId }) => gameId);
                const gameResults = await this.commonModelGameResult.list(transaction, {
                    filter: { gameId: gameIds },
                    customFilters: customFiltersGameResults,
                    range: { all: true }
                });
                games = games.map((game) => ({
                    ...game,
                    gameResults: gameResults.filter((gameResult) => gameResult.gameId === game.gameId) ?? []
                }));
                return [games, total];
            });
            return response.successResponse({
                message: "Data",
                metadata: {
                    total,
                    page: range?.page ?? common_1.DEFAULT_PAGE,
                    pageSize: range?.pageSize ?? common_1.DEFAULT_PAGE_SIZE
                },
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
    async saveUserBet(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const { gameId, bets } = req.body;
            const [data] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const [[game], data] = await Promise.all([
                    this.commonModelGame.list(transaction, {
                        filter: { gameId }
                    }),
                    this.commonModelUserBet.bulkCreate(transaction, bets.map((el) => ({
                        userId,
                        gameId,
                        betNumber: el.pair,
                        betAmount: el.amount,
                        pairType: el.pairType
                    })), userId)
                ]);
                let totalAmount = 0;
                bets.map((el) => (totalAmount += Number(el.amount)));
                await this.commonModelWallet.bulkCreate(transaction, [
                    {
                        userId,
                        transactionType: "debit",
                        amount: totalAmount,
                        approvalStatus: "approved",
                        remarks: `${(game.name ?? "").trim() !== "" ? `For Bet ${game.name.toUpperCase()}` : "Used for placing bet"}`,
                        gameId,
                        userBetIds: data.map(({ betId }) => betId).join(",")
                    }
                ], userId);
                return [data];
            });
            return response.successResponse({
                message: `Bet placed successfully`,
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
    async listUserBet(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            let { filter, range, sort } = await (0, helpers_1.listAPIPayload)(req.body);
            filter =
                filter && Object.keys(filter).length
                    ? !filter.userId
                        ? {
                            ...filter,
                            userId
                        }
                        : filter
                    : { userId };
            const [data, total] = await PrismaLib_1.prisma.$transaction(async (transaction) => {
                let [data, total] = await Promise.all([
                    this.commonModelUserBet.list(transaction, {
                        filter,
                        range,
                        sort
                    }),
                    this.commonModelUserBet.list(transaction, {
                        filter,
                        isCountOnly: true
                    })
                ]);
                const gameIds = data.map((el) => el.gameId);
                const games = await this.commonModelGame.list(transaction, {
                    filter: {
                        gameId: gameIds
                    },
                    range: { all: true }
                });
                data = data.map((el) => ({
                    ...el,
                    game: games.find((game) => game.gameId === el.gameId)
                }));
                return [data, total];
            });
            // Group bets by gameId and createdAt (date-wise)
            const groupedBets = data.reduce((acc, bet) => {
                const gameId = bet.gameId;
                const game = bet.game;
                const createdAt = (0, dayjs_1.default)(bet.createdAt).format("YYYY-MM-DD"); // Group by date
                const pairType = bet.pairType || "others"; // Default to "others" if undefined
                const key = `${gameId}-${createdAt}-${pairType}`;
                if (!acc[key]) {
                    acc[key] = {
                        gameId,
                        game,
                        createdAt,
                        pairType,
                        bets: []
                    };
                }
                acc[key].bets.push(bet);
                return acc;
            }, {});
            // Convert grouped object to an array
            const groupedBetsArray = Object.values(groupedBets);
            return response.successResponse({
                message: `Data`,
                metadata: {
                    total,
                    page: range?.page ?? common_1.DEFAULT_PAGE,
                    pageSize: range?.pageSize ?? common_1.DEFAULT_PAGE_SIZE
                },
                data: groupedBetsArray
            });
        }
        catch (error) {
            next(error);
        }
    }
    async handleGameResult(req, res, next) {
        try {
            const response = new APIResponse_1.ApiResponse(res);
            const { userId, roleId } = req.headers;
            const { gameId, resultNumber } = req.body;
            const userPushNotificationPayload = [];
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const [[game], [existingGameResult], userBets] = await Promise.all([
                    this.commonModelGame.list(transaction, {
                        filter: {
                            gameId
                        }
                    }),
                    this.commonModelGameResult.list(transaction, {
                        filter: {
                            gameId,
                            resultType: "open"
                        },
                        range: {
                            page: 1,
                            pageSize: 1
                        },
                        sort: [
                            {
                                orderBy: "resultId",
                                orderDir: "desc"
                            }
                        ]
                    }),
                    this.commonModelUserBet.list(transaction, {
                        filter: {
                            gameId,
                            betStatus: "pending"
                        },
                        range: { all: true }
                    })
                ]);
                if (existingGameResult &&
                    existingGameResult.resultNumber.toString() ===
                        resultNumber.toString()) {
                    return;
                }
                if (existingGameResult &&
                    existingGameResult.resultNumber !== resultNumber.toString()) {
                    await this.commonModelGameResult.updateById(transaction, { resultType: "close" }, existingGameResult.resultId);
                }
                const [gameResult] = await this.commonModelGameResult.bulkCreate(transaction, [
                    {
                        gameId,
                        resultNumber,
                        resultType: "open"
                    }
                ], userId);
                let userIds = userBets.map((userBet) => Number(userBet.userId));
                const users = await this.commonModelUser.list(transaction, {
                    filter: {
                        userId: userIds,
                        isNotificationsOn: true
                    },
                    range: { all: true }
                });
                // re-assigning userIds
                userIds = users.map((user) => Number(user.userId));
                const allPayloadUserLoginHistories = await this.commonModelLoginHistory.list(transaction, {
                    filter: {
                        userId: userIds,
                        deviceType: ["android", "ios"]
                    },
                    range: { all: true }
                });
                allPayloadUserLoginHistories
                    .filter((allPayloadUserLoginHistory) => (allPayloadUserLoginHistory.fcmToken ?? "").trim() !== "")
                    .map((allPayloadUserLoginHistory) => allPayloadUserLoginHistory.fcmToken)
                    .map((fcmToken) => userPushNotificationPayload.push({
                    token: fcmToken,
                    title: `Result Out${(game?.name ?? "").trim() !== "" ? ` for ${game.name}` : ""}`,
                    body: `Result Out${(game?.name ?? "").trim() !== "" ? ` for ${game.name}` : ""}`,
                    data: {}
                }));
                return;
            });
            userPushNotificationPayload.map((userPushNotification) => (0, FCMService_1.sendPushNotification)({
                token: userPushNotification.token,
                title: userPushNotification.title,
                body: userPushNotification.body,
                data: userPushNotification.data
            }));
            return response.successResponse({
                message: `Game results processed successfully`
            });
        }
        catch (error) {
            next(error);
        }
    }
    async finalizeGameResult() {
        try {
            const nowMinus15Minutes = (0, dayjs_1.default)()
                .tz("Asia/Kolkata")
                .subtract(15, "minutes")
                .toISOString();
            await PrismaLib_1.prisma.$transaction(async (transaction) => {
                const gameResults = await this.commonModelGameResult.list(transaction, {
                    filter: {
                        resultType: "open",
                        resultTime: {
                            lte: nowMinus15Minutes
                        }
                    }
                });
                for (let i = 0; i < gameResults?.length; i++) {
                    await this.commonModelGameResult.updateById(transaction, { resultType: "final" }, gameResults[i].resultId);
                    // Get all bets for this game created today
                    const userBets = await this.commonModelUserBet.list(transaction, {
                        filter: {
                            gameId: gameResults[i].gameId,
                            betStatus: "pending"
                        },
                        range: { all: true }
                    });
                    const walletCredits = [];
                    const walletUserId = [];
                    const resultNumber = gameResults[i].resultNumber.toString();
                    const updatedBets = await Promise.all(userBets.map(async (bet) => {
                        let betStatus = "lost";
                        let winningAmount = 0.0;
                        if (bet.betNumber.toString() === resultNumber) {
                            // Case 1: Exact match
                            betStatus = "won";
                            winningAmount =
                                bet.betAmount *
                                    parseFloat(process.env.AMOUNT_JODI ?? "90");
                        }
                        else if (bet.betNumber.startsWith("A") &&
                            bet.betNumber[1] === resultNumber[0]) {
                            // Case 2: Matches 1st digit after removing "A"
                            betStatus = "won";
                            winningAmount =
                                bet.betAmount *
                                    parseFloat(process.env.AMOUNT_HARUP ?? "9");
                        }
                        else if (bet.betNumber.startsWith("B") &&
                            bet.betNumber[1] === resultNumber[1]) {
                            // Case 3: Matches 2nd digit after removing "B"
                            betStatus = "won";
                            winningAmount =
                                bet.betAmount *
                                    parseFloat(process.env.AMOUNT_HARUP ?? "9");
                        }
                        if (!walletUserId.includes(bet.userId)) {
                            walletCredits.push({
                                userId: bet.userId,
                                resultId: gameResults[i].resultId,
                                transactionType: "credit",
                                amount: Number(winningAmount),
                                remarks: "Horray! You Win",
                                approvalStatus: "approved",
                                gameId: bet.gameId
                            });
                            walletUserId.push(bet.userId);
                        }
                        else {
                            const walletIndex = walletUserId.indexOf(bet.userId);
                            walletCredits[walletIndex].amount += Number(winningAmount);
                        }
                        return this.commonModelUserBet.updateById(transaction, { betStatus, winningAmount }, bet.betId);
                    }));
                    if (walletCredits?.length) {
                        await this.commonModelWallet.bulkCreate(transaction, walletCredits, gameResults[i].createdById);
                    }
                }
            });
        }
        catch (error) {
            (0, Logger_1.logMessage)("error", error.toString());
        }
    }
}
exports.default = new GameController();
