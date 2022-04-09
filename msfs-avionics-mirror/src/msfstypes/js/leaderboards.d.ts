declare class LeaderboardEntry {
    name: string;
    xuid: string;
    score: number;
    rank: number;
    time: string;
    plane: string;
    breadcrumb: boolean;
    pylons: boolean;
    hud: boolean;
    notifications: boolean;
    pageType: LeaderBoardPageType;
    isMe: boolean;
    constructor(data?: any);
    getScoreStr(): string;
    static getDebugValue(rank: number): LeaderboardEntry;
}
interface AdditionalData {
    __Type: string;
}
declare class RenoAditionalData implements AdditionalData {
    __Type: string;
    Category: RenoRaceCategory;
    RenoLeaderboardType: RenoLeaderboardType;
}
declare class RenoQuickMatchAdditionalData extends RenoAditionalData {
    __Type: string;
}
declare class RenoTimeTrialAdditionalData extends RenoAditionalData {
    __Type: string;
    daPlanes: string[];
}
declare class LeaderboardTableWithAdditionalDataFields {
    columnsID: string[];
    daPlayerData: string[];
    table: LeaderboardTable;
    constructor();
}
declare class LeaderboardTableWithAdditionalDataObject {
    Table: LeaderboardTable;
    AdditionalData: AdditionalData;
    constructor();
}
declare class LeaderboardTable {
    entries: LeaderboardEntry[];
    playerPosition: number;
    name: string;
    isUpToDate: boolean;
    static getDebugValue(): LeaderboardTable;
    static mapEntriesWithAdditionalData(leaderboardTable: LeaderboardTable, columnsID: string[], playerDataFields: string[]): LeaderboardTable;
    static mapEntriesWithAdditionalDataObject(leaderboardTable: LeaderboardTable, context: LeaderBoards, additionalData: AdditionalData): LeaderboardTable;
}
declare enum LeaderboardScoreType {
    Points = 0,
    TimeMilliseconds = 1
}
declare class LeaderBoards {
    worldTable: LeaderboardTableWithAdditionalDataObject;
    aroundTable: LeaderboardTableWithAdditionalDataObject;
    friendsTable: LeaderboardTableWithAdditionalDataObject;
    isOnline: boolean;
    InverseScore: boolean;
    ScoreType: LeaderboardScoreType;
    static getDebugValue(): LeaderBoards;
}
