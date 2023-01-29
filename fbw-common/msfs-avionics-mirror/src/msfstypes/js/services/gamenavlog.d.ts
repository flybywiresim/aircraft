interface LegacyGameNavlogLeg {
    __Type: string;
    AbsoluteSubLegIndex: number;
    Comments: string;
    Distance: string;
    Ete: string;
    Heading: string;
    IsDescriptionActive: boolean;
    IsImageActive: boolean;
    LegIndex: number;
    NextLegAvaiable: boolean;
    NextSubLegAvailable: boolean;
    PrevLegAvaiable: boolean;
    PrevSubLegAvailable: boolean;
    SubLegImagePath: string;
    SubLegIndex: number;
    Winds: string;
    nextLegName: string;
    nextSubLegName: string;
    prevLegName: string;
    prevSubLegName: string;
}
interface GameNavlogLeg {
    index: number;
    name: string;
    distance: string;
    ete: string;
    nextLegName: string;
    subLegs: GameNavlogSubLeg[];
}
interface GameNavlogSubLeg {
    index: number;
    name: string;
    icao: string;
    absoluteIndex: number;
    comments: string;
    distance: string;
    ete: string;
    heading: string;
    winds: string;
    imagePath: string;
    isLast: boolean;
    nextSubLegName: string;
}
declare class GameNavlogListener extends ViewListener.ViewListener {
    constructor(name: string);
    onUpdateDisplayedLeg(callback: (leg: LegacyGameNavlogLeg) => void): void;
    onUpdateLeg(callback: (leg: GameNavlogLeg) => void): void;
    onUpdateTime(callback: (data: TimeData) => void): void;
    onUpdateWatchTime(callback: (data: DataValue, isRunning: boolean) => void): void;
    toggleStopWatch(value: boolean): void;
    resetStopWatch(): void;
}
declare function RegisterGameNavlogListener(callback?: any): GameNavlogListener;
