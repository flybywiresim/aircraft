declare class Airway {
    name: string;
    type: number;
    icaos: string[];
    SetFromIAirwayData(data: IAirwayData): void;
}
declare class WayPoint {
    instrument: BaseInstrument;
    ident: string;
    icao: string;
    private _icaoNoSpace;
    get icaoNoSpace(): string;
    infos: WayPointInfo;
    latitudeFP: number;
    longitudeFP: number;
    altitudeinFP: number;
    altitudeModeinFP: string;
    bearingInFP: number;
    distanceInFP: number;
    estimatedTimeOfArrivalFP: number;
    estimatedTimeEnRouteFP: number;
    cumulativeEstimatedTimeEnRouteFP: number;
    cumulativeDistanceInFP: number;
    originalIndexInFP: number;
    type: string;
    isInFlightPlan: boolean;
    isActiveInFlightPlan: boolean;
    timeWasReached: number;
    altitudeWasReached: number;
    fuelWasReached: number;
    getFuelWasReached(useLbs?: boolean): number;
    directFrom: WayPoint;
    legAltitudeDescription: number;
    legAltitude1: number;
    getLegAltitude1Text(): string;
    legAltitude2: number;
    getLegAltitude2Text(): string;
    speedConstraint: number;
    transitionLLas: LatLongAlt[];
    magvar: number;
    getSvgElement(index: number): SvgWaypointElement;
    constructor(_instrument: BaseInstrument);
    SetTypeFromEnum(_enum: number): void;
    UpdateInfos(_CallBack?: Function, _LoadApproaches?: boolean): void;
    UpdateApproaches(): void;
    GetInfos(): WayPointInfo;
    SetICAO(_ICAO: string, _endLoadCallback?: Function, _LoadApproaches?: boolean): void;
    SetIdent(_Ident: string): void;
    SetFromIFacility(data: IFacilityData, callback?: () => void): void;
    imageFileName(): string;
}
declare class WayPointInfo {
    icao: string;
    ident: string;
    region: string;
    name: string;
    city: string;
    routes: IRoute[];
    timeInFP: number;
    totalTimeInFP: number;
    etaInFP: number;
    totalDistInFP: number;
    fuelConsInFP: number;
    totalFuelConsInFP: number;
    airwayIdentInFP: string;
    coordinates: LatLongAlt;
    get lat(): number;
    set lat(l: number);
    get long(): number;
    set long(l: number);
    instrument: BaseInstrument;
    loaded: boolean;
    protected endLoadCallback: Function;
    airways: Airway[];
    constructor(_instrument: BaseInstrument);
    id(): string;
    protected _svgElements: SvgWaypointElement[];
    getSvgElement(index: number): SvgWaypointElement;
    CopyBaseInfosFrom(_WP: WayPointInfo): void;
    UpdateInfos(_CallBack?: Function): void;
    GetSymbol(): string;
    imageFileName(): string;
    getWaypointType(): string;
    setEndCallbackIfUnset(_Callback: Function): void;
    SetFromIFacilityWaypoint(data: IFacilityData): void;
    UpdateAirways(): Promise<void>;
}
declare class AirportInfo extends WayPointInfo {
    frequencies: Array<Frequency>;
    privateType: number;
    radarCoverage: number;
    fuel: string;
    bestApproach: string;
    airspaceType: string;
    departures: IDeparture[];
    approaches: Array<Approach>;
    arrivals: IArrival[];
    runways: Array<Runway>;
    oneWayRunways: Array<Runway>;
    unsortedOneWayRunways: Array<Runway>;
    longestRunwayDirection: number;
    airportClass: number;
    towered: boolean;
    transitionAltitude: number;
    private needReload;
    private reloadCallback;
    private loadApproaches;
    private approachLoadIndex;
    constructor(_instrument: BaseInstrument);
    getWaypointType(): string;
    getSvgElement(index: number): SvgWaypointElement;
    UpdateInfos(_CallBack?: Function, _LoadApproaches?: boolean): void;
    GetSymbolFileName(): string;
    imageFileName(): string;
    GetSize(): Vec2;
    getClassSize(): AirportSize;
    IsUpToDate(): boolean;
    SetFromIFacilityAirport(data: IFacilityAirportData, loadApproachesData?: boolean, callback?: () => void): Promise<void>;
}
declare class VORInfo extends WayPointInfo {
    static readManager: InstrumentDataReadManager;
    frequencyMHz: number;
    frequencyBcd16: number;
    weatherBroadcast: number;
    magneticVariation: number;
    type: number;
    vorClass: number;
    constructor(_instrument: BaseInstrument);
    getWaypointType(): string;
    getSvgElement(index: number): SvgWaypointElement;
    IsUpToDate(): boolean;
    GetSymbol(): string;
    imageFileName(): string;
    UpdateInfos(_CallBack?: Function): void;
    getClassName(): string;
    SetFromIFacilityVOR(data: IFacilityVORData, callback?: () => void): void;
}
declare class NDBInfo extends WayPointInfo {
    static readManager: InstrumentDataReadManager;
    frequencyMHz: number;
    weatherBroadcast: number;
    type: number;
    constructor(_instrument: BaseInstrument);
    getSvgElement(index: number): SvgWaypointElement;
    getWaypointType(): string;
    GetSymbol(): "GPS/Marker.png" | "GPS/Ndb.png";
    imageFileName(): string;
    IsUpToDate(): boolean;
    UpdateInfos(_CallBack?: Function): void;
    getTypeString(): "Unknown" | "H" | "Compass Point" | "MH" | "HH";
    SetFromIFacilityNDB(data: IFacilityNDBData, callback?: () => void): void;
}
declare class IntersectionInfo extends WayPointInfo {
    static readManager: InstrumentDataReadManager;
    nearestVORICAO: string;
    nearestVORIdent: string;
    nearestVORTrueRadial: number;
    nearestVORMagneticRadial: number;
    nearestVORDistance: number;
    nearestVORFrequencyBCD16: number;
    nearestVORFrequencyMHz: number;
    nearestVORType: number;
    constructor(_instrument: BaseInstrument);
    getWaypointType(): string;
    IsUpToDate(): boolean;
    GetSymbol(): string;
    imageFileName(): string;
    vorImageFileNameSync(): string;
    UpdateInfos(_CallBack?: Function): void;
    GetRouteToIdent(ident: string): IRoute;
    GetIcaoViaRouteByIdent(ident: string): string;
    GetRouteToIcao(icao: string): IRoute;
    GetNextIcaoVia(routeName: string): string;
    GetNextWayPointVia(routeName: string): Promise<WayPoint>;
    static longestAirway: number;
    SetFromIFacilityIntersection(data: IFacilityIntersectionData, callback?: () => void): void;
    UpdateAirways(): Promise<void>;
    static GetCommonAirway(wp1: WayPoint, wp2: WayPoint): Airway;
}
declare enum EFrequencyType {
    NONE = 0,
    ATIS = 1,
    MULTICOM = 2,
    UNICOM = 3,
    CTAF = 4,
    GROUND = 5,
    TOWER = 6,
    CLEARANCE = 7,
    APPROACH = 8,
    DEPARTURE = 9,
    CENTER = 10,
    FSS = 11,
    AWOS = 12,
    ASOS = 13,
    CPT = 14,
    GCO = 15
}
declare class Frequency {
    name: string;
    mhValue: number;
    bcd16Value: number;
    type: EFrequencyType;
    constructor(_name: string, _mhValue: number, _bcd16Value: number, _type?: EFrequencyType);
    getTypeName(): string;
}
