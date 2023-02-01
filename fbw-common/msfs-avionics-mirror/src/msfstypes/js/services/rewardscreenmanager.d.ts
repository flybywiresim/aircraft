declare const enum MissionState {
    MISSION_NONE = 0,
    MISSION_INCOMPLETE = 1,
    MISSION_FAILED = 2,
    MISSION_CRASHED = 3,
    MISSION_PROHIBITED = 4,
    MISSION_OUT_OF_BOUNDS = 5,
    MISSION_SUCCEEDED = 6,
    MISSION_ABORTED = 7
}
declare const enum GoalState {
    GOAL_NONE = -1,
    GOAL_PENDING = 0,
    GOAL_COMPLETED = 1,
    GOAL_FAILED = 2,
    GOAL_ABORTED = 3
}
declare const enum StepState {
    STEP_PENDING = 0,
    STEP_FAILED = 1,
    STEP_COMPLETED = 2,
    STEP_ABORTED = 3
}
declare class MissionStep {
    State: StepState;
    Description: string;
    Text: string;
    Image: string;
    Score: EOMScore;
}
declare class MissionObjective {
    index?: number;
    State: GoalState;
    Description: string;
    Text: string;
    Image: string;
    Score: EOMScore;
    Steps: MissionStep[];
}
declare class RewardElementData {
    type: string;
    state: "default" | "hide" | "disable";
    tag: string;
    path: string;
    external: boolean;
}
declare class RewardPage {
    id: string;
    title: string;
    tabs?: string[];
    elements: RewardElementData[];
    buttons: InputBar.InputBarButtonParams[];
    forceNoButtons: boolean;
}
declare class EOMData_Base {
    MissionState: MissionState;
    MissionType: string;
    MissionName: string;
    MissionEndingMessage: string;
    MissionEndingTitle: string;
    Description: string;
    ActivitiesMenuTitle: string;
    NextActivityButtonTitle: string;
    Image: string;
    CompletionTime: string;
    AllowContinue: boolean;
    AllowContinueBushTrip: boolean;
    AllowRestart: boolean;
    AllowRaceRestart: boolean;
    AllowBackRaceMenu: boolean;
    AllowRaceNew: boolean;
    AllowActivityMenu: boolean;
    AllowBackMainMenu: boolean;
    NextFlight: Flight;
    Objectives: MissionObjective[];
    pages: RewardPage[];
}
declare abstract class RewardScreenElement extends TemplateElement {
    abstract elementPosition(): "external" | "inTabs";
    showPage(val: boolean, transition: boolean): void;
    setData(eomData: EOMData_Base, pageData: RewardElementData): void;
    setPageElementData(pageData: RewardElementData): void;
}
declare function EndScreenSetData(data: EOMData_Base): void;
declare class EOMScore extends RewardElementData {
    constructor();
    ScoreName: string;
    IconFilename: string;
    Description: string;
    Score: ScoreParam;
    Tracked: ScoreParam;
    Reference: ScoreParam;
    MinScore: ScoreParam;
    MaxScore: ScoreParam;
    Ranks: EOMRank[];
    SubScores: EOMScore[];
    currentRank?: EOMRank;
    static applyRankToScore(score: EOMScore): void;
    static getDebugValue(): EOMScore;
}
declare class RewardScreenListener extends ViewListener.ViewListener {
    requestEndOfMissionData(): void;
    onUpdateEndOfMissionData(callback: (data: EOMData_Base) => void): void;
    onUpdatePageData(callback: (data: RewardPage) => void): void;
    onUpdatePageElementData(callback: (data: RewardElementData, pageId: string) => void): void;
}
declare function RegisterRewardScreenListener(callback?: () => void): RewardScreenListener;
