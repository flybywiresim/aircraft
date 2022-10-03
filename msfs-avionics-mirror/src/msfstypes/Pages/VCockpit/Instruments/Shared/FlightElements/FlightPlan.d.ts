declare class FlightPlan implements AsynchroneDataGetter {
    static readManager: InstrumentDataReadManager;
    manager: FlightPlanManager;
    instrument: BaseInstrument;
    name: string;
    wayPoints: Array<WayPoint>;
    activeWayPoint: number;
    approach: Approach;
    nbElementToDisplay: number;
    isDirectTo: boolean;
    private endLoadingCallback;
    private beginGeoCalc;
    private loadState;
    private waypointsBatch;
    private approachBatch;
    constructor(_instrument: BaseInstrument, _manager: FlightPlanManager);
    updateActiveWaypoint(): void;
    LoadData(): void;
    IsUpToDate(): boolean;
    EndLoad(): void;
    FillWithCurrentFP(_Callback?: Function): void;
    GetAirportList(): Array<WayPoint>;
    FillHTMLElement(_element: HTMLElement, _nbElemMax: number, _startIndex: number): void;
}
declare class FlightPlanAlternate {
    instrument: BaseInstrument;
    activeWaypoint: number;
    waypoints: WayPoint[];
    origin: WayPoint;
    routeWaypoints: WayPoint[];
    dest: WayPoint;
    updating: boolean;
    activeBearing(): number;
    constructor(instrument: BaseInstrument);
    update(): Promise<void>;
}
