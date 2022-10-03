declare class ProfileMetaGaugesData {
    constructor();
    metaGauges: TreeDataValue[];
    selectedIndex: number;
    static getDebugValue(): ProfileMetaGaugesData;
}
declare class FlightData {
    iLogVersion: number;
    entryID: number;
    iCreationTimeInSeconds: number;
    iStartDay: number;
    iStartMonth: number;
    iStartYear: number;
    iStartTimeInSeconds: number;
    distance: DataValue;
    fTotalHours: number;
    fNightHours: number;
    fDayHours: number;
    fIFRHours: number;
    fVFRHours: number;
    iDayLandingCount: number;
    iDayTakeOffCount: number;
    iNightLandingCount: number;
    iNightTakeOffCount: number;
    sStartingAirport: string;
    sEndingAirport: string;
    bFullFlight: boolean;
    bAllowFlyAgain: boolean;
    sAircraftCategory: string;
    sAircraftId: string;
    sAircraftName: string;
    sActivityName: string;
    daNotes: string[];
}
declare class TimelineEntry {
    iDay: number;
    iMonth: number;
    iYear: number;
    sDate: number;
    daFlights: FlightData[];
}
declare class ProfileAircraftData {
    name: string;
    image: string;
    engineType: string;
    stats: DataValue[];
    static getDebugValue(): ProfileAircraftData;
}
declare class LogbookData {
    entries: TimelineEntry[];
    total: FlightData;
    remarks: string;
    favoriteAircraft: ProfileAircraftData;
    favoriteAirport: string;
    favoriteAircraftType: ProfileAircraftData;
    favoriteFlight: string;
    static getDebugValue(): LogbookData;
}
declare class ProfileReward {
    id: string;
    name: string;
    image: string;
    unlocked: boolean;
    description: string;
    category: string;
    progress: number;
    unlockProgress: number;
    unlockedDate: string;
}
declare class SlottedProfileReward extends ProfileReward {
    slotId: number;
}
declare class ProfileRank {
    name: string;
    image: string;
    nextValue: DataValue;
    unlockProgress: number;
}
interface MissionStat {
    name: string;
    value: number;
    total: number;
}
declare class ProfileData {
    sProfileName: string;
    hasOverview: boolean;
    avatarImage: string;
    levelImage: string;
    fTotalHours: number;
    iLandingCount: number;
    iAirportCount: number;
    missionStats: MissionStat[];
    statsData: DataValue[];
    logbook: LogbookData;
    metaStats: ProfileMetaGaugesData;
    badges: ProfileReward[];
    achievements: ProfileReward[];
    favoriteBadges: ProfileReward[];
    rank: ProfileRank;
    static getDebugValue(): ProfileData;
}
declare class ProfileListener extends ViewListener.ViewListener {
    onProfileUpdated(callback: (data: ProfileData) => void): void;
    onProfileFavoriteRewardsUpdated(callback: (data: ProfileReward[]) => void): void;
    fillDebugValues(): ProfileData;
    setFavoriteReward(data: ProfileReward, index: number): void;
    createNote(entryID: number, content: string): void;
    tooggleFavoriteEntry(entryID: number): void;
    reflyEntry(entryID: number): void;
}
declare function RegisterProfileListener(callback?: any): ProfileListener;
