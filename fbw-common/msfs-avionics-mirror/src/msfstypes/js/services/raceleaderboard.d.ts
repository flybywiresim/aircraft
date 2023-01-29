declare class RaceLeaderboardListener extends ViewListener.ViewListener {
    onRaceStatsUpdated(callback: (data: RaceStatistics) => void): void;
    onStatsRankUpdated(callback: (rank: number, type: any) => void): void;
    displayOverview(): void;
    getLeaderboard(category: string, type: string): void;
    onQuickMatchLeaderboardUpdated(callback: (table: LeaderboardTable, leaderboardType: LeaderboardType) => void): void;
    onTimeTrialLeaderboardUpdated(callback: (table: LeaderboardTableWithAdditionalDataFields, leaderboardType: LeaderboardType, category: RenoLeaderboardType) => void): void;
}
declare function RegisterRaceLeaderboardListener(callback?: any): RaceLeaderboardListener;
