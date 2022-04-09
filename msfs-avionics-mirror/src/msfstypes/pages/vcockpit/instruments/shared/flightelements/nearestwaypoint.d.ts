declare class FullDataAirport extends WayPoint {
    toDelete: boolean;
    distance: number;
    bearing: number;
    bestApproach: string;
    frequencyName: string;
    frequencyMHz: number;
    frequencyBCD16: number;
    longestRunwayLength: number;
    longestRunwayDirection: number;
    airportClass: number;
    constructor(_instrument: BaseInstrument);
}
declare class NearestWaypoint extends WayPoint {
    toDelete: boolean;
    distance: number;
    bearing: number;
    lastDistance: number;
    lastBearing: number;
    coordinates: LatLongAlt;
    routes: NearestWaypointRoute[];
}
declare enum AirportSize {
    Small = 0,
    Medium = 1,
    Large = 2
}
declare class NearestAirport extends NearestWaypoint {
    name: string;
    bestApproach: string;
    frequencyName: string;
    frequencyMHz: number;
    frequencyBCD16: number;
    longestRunwayLength: number;
    longestRunwayDirection: number;
    type: string;
    airportClass: number;
    fuel1: string;
    fuel2: string;
    towered: boolean;
    hasAirportInfosLoaded: boolean;
    private _svgMapElement;
    get svgMapElement(): SvgNearestAirportElement;
    imageFileName(): string;
    getSize(): AirportSize;
}
declare class FullDataNearestAirportList {
    instrument: BaseInstrument;
    airports: FullDataAirport[];
    private loadState;
    private nbMax;
    private milesDistance;
    private batch;
    private _referentialLatLong;
    private _currentLatLong;
    constructor(_instrument: BaseInstrument);
    Update(_nbMax?: number, _milesDistance?: number): void;
    private LoadData;
    private IsUpToDate;
    private IsIdle;
}
declare class NearestAirportList {
    static DEBUG_INSTANCE: NearestAirportList;
    instrument: BaseInstrument;
    airports: Array<NearestAirport>;
    private loadState;
    private nbMax;
    private milesDistance;
    private _timer;
    private airportLineBatch;
    private airportSelectedBatch;
    private _referentialLatLong;
    private _currentLatLong;
    constructor(_instrument: BaseInstrument);
    Update(_nbMax?: number, _milesDistance?: number): void;
    private LoadData;
    private IsUpToDate;
    private IsIdle;
}
declare class NearestWaypointRoute {
    nearestIntersection: NearestWaypoint;
    name: string;
    prevIcao: string;
    prevCoordinates: LatLong;
    prevWaypoint: WayPoint;
    nextIcao: string;
    nextCoordinates: LatLong;
    nextWaypoint: WayPoint;
    constructor(nearestIntersection: NearestWaypoint);
}
declare class NearestIntersection extends NearestWaypoint {
    airwaysDrawn: boolean;
    private _svgMapElement;
    get svgMapElement(): SvgNearestIntersectionElement;
    constructor(_instrumentName: any);
    imageFileName(): string;
}
declare class NearestIntersectionList {
    instrument: BaseInstrument;
    intersections: Array<NearestIntersection>;
    private loadState;
    private nbMax;
    private milesDistance;
    private _timer;
    private batch;
    private _referentialLatLong;
    private _currentLatLong;
    constructor(_instrument: BaseInstrument);
    Update(_nbMax?: number, _milesDistance?: number): void;
    private LoadData;
    private IsUpToDate;
    private IsIdle;
}
declare class NearestNDB extends NearestWaypoint {
    private _svgMapElement;
    get svgMapElement(): SvgNearestNDBElement;
    ndbType: number;
    frequencyMHz: number;
    name: string;
    imageFileName(): string;
}
declare class NearestNDBList {
    instrument: BaseInstrument;
    ndbs: Array<NearestNDB>;
    private loadState;
    private nbMax;
    private milesDistance;
    private _timer;
    private ndbLinesBatch;
    private ndbSelectedBatch;
    private _referentialLatLong;
    private _currentLatLong;
    constructor(_instrument: BaseInstrument);
    Update(_nbMax?: number, _milesDistance?: number): void;
    private LoadData;
    private IsUpToDate;
    private IsIdle;
}
declare class NearestVOR extends NearestWaypoint {
    private _svgMapElement;
    get svgMapElement(): SvgNearestVORElement;
    name: string;
    vorType: number;
    frequencyMHz: number;
    frequencyBCD16: number;
    imageFileName(): string;
}
declare class NearestVORList {
    instrument: BaseInstrument;
    vors: Array<NearestVOR>;
    private loadState;
    private nbMax;
    private milesDistance;
    private _timer;
    private vorLinesBatch;
    private vorSelectedBatch;
    private _referentialLatLong;
    private _currentLatLong;
    constructor(_instrument: BaseInstrument);
    Update(_nbMax?: number, _milesDistance?: number): void;
    private LoadData;
    private IsUpToDate;
    private IsIdle;
}
declare class NearestAirspace {
    static I: number;
    ident: string;
    name: string;
    type: number;
    status: number;
    nearDistance: number;
    aheadTime: number;
    segments: LatLong[];
    svgMapElement: SvgAirspaceElement;
    constructor();
    GetStatus(): string;
}
declare class NearestAirspaceList {
    instrument: BaseInstrument;
    airspaces: Array<NearestAirspace>;
    private loadState;
    private nbMax;
    private milesDistance;
    private batch;
    private _referentialLatLong;
    private _currentLatLong;
    constructor(_instrument: BaseInstrument);
    Update(_nbMax?: number, _milesDistance?: number): void;
    private LoadData;
    private IsUpToDate;
    private IsIdle;
}
