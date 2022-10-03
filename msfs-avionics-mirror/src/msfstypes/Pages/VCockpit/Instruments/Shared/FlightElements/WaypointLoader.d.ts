interface IFrequency {
    name: string;
    freqMHz: number;
    freqBCD16: number;
    type: number;
}
interface IRunway {
    latitude: number;
    longitude: number;
    elevation: number;
    direction: number;
    designation: string;
    length: number;
    width: number;
    surface: number;
    lighting: number;
    designatorCharPrimary: number;
    designatorCharSecondary: number;
}
interface IRoute {
    name: string;
    type: number;
    prevIcao: string;
    nextIcao: string;
}
interface IAirwayData {
    name: string;
    type: number;
    icaos: string[];
}
interface ILeg {
    fixIcao: string;
    originIcao: string;
    course: number;
    distance: number;
    altDesc: number;
    altitude1: number;
    altitude2: number;
}
interface IRunwayTransition {
    name: string;
    runwayNumber: number;
    runwayDesignation: number;
    legs: ILeg[];
}
interface IEnRouteTransition {
    name: string;
    legs: ILeg[];
}
interface IApproachTransition {
    name: string;
    legs: ILeg[];
}
interface IDeparture {
    name: string;
    commonLegs: ILeg[];
    enRouteTransitions: IEnRouteTransition[];
    runwayTransitions: IRunwayTransition[];
}
interface IApproach {
    name: string;
    runway: string;
    icaos: string[];
    transitions: IApproachTransition[];
    finalLegs: ILeg[];
    missedLegs: ILeg[];
}
interface IArrival {
    name: string;
    commonLegs: ILeg[];
    enRouteTransitions: IEnRouteTransition[];
    runwayTransitions: IRunwayTransition[];
}
interface IFacilityData {
    icao: string;
    icaoTrimed: string;
    name: string;
    lat: number;
    lon: number;
    region: string;
    city: string;
    altitudeMode: string;
    magvar: number;
}
interface IFacilityAirportData extends IFacilityData {
    airportPrivateType: number;
    fuel1: string;
    fuel2: string;
    bestApproach: string;
    radarCoverage: number;
    airspaceType: number;
    airportClass: number;
    towered: boolean;
    frequencies: IFrequency[];
    runways: IRunway[];
    departures: IDeparture[];
    approaches: IApproach[];
    arrivals: IArrival[];
}
interface IFacilityIntersectionData extends IFacilityData {
    routes: IRoute[];
    nearestVorICAO: string;
    nearestVorType: number;
    nearestVorFrequencyBCD16: number;
    nearestVorFrequencyMHz: number;
    nearestVorTrueRadial: number;
    nearestVorMagneticRadial: number;
    nearestVorDistance: number;
}
interface IFacilityVORData extends IFacilityData {
    freqMHz: number;
    freqBCD16: number;
    weatherBroadcast: number;
    magneticVariation: number;
    type: number;
    vorClass: number;
}
interface IFacilityNDBData extends IFacilityData {
    freqMHz: number;
    weatherBroadcast: number;
    type: number;
}
declare class NearestAirspacesLoader {
    lla: LatLongAlt;
    nearestAirspaces: NearestAirspace[];
    onNewAirspaceAddedCallback: (airspace: NearestAirspace) => void;
    private _lastlla;
    private _updating;
    private instrument;
    constructor(_instrument: BaseInstrument);
    update(): void;
}
declare class FacilityLoader {
    private instrument;
    constructor(_instrument: BaseInstrument);
    pendingRequests: any[];
    loadingFacilities: string[];
    loadedFacilities: IFacilityData[];
    loadedAirwayDatas: Map<string, IAirwayData>;
    private _isRegistered;
    private _isCompletelyRegistered;
    registerListener(): void;
    private _maxSimultaneousCoherentCalls;
    private _pendingGetFacilityCoherentCall;
    update(): void;
    private addFacility;
    getFacilityCB(icao: string, callback: (waypoint: WayPoint) => void): void;
    waitRegistration(): Promise<void>;
    getFacility(icao: string): Promise<WayPoint>;
    getFacilityDataCB(icao: string, callback: (data: IFacilityData) => void): void;
    getFacilityData(icao: string): Promise<IFacilityData>;
    getAirport(icao: string): Promise<WayPoint>;
    getAirportDataCB(icao: string, callback: (data: IFacilityAirportData) => void): void;
    getAirportData(icao: string): Promise<IFacilityData>;
    getAirports(icaos: string[]): Promise<WayPoint[]>;
    getAirportsData(icaos: string[]): Promise<IFacilityData[]>;
    getIntersectionDataCB(icao: string, callback: (data: IFacilityData) => void): void;
    getIntersectionData(icao: string): Promise<IFacilityIntersectionData>;
    getIntersections(icaos: string[]): Promise<WayPoint[]>;
    getIntersectionsData(icaos: string[]): Promise<IFacilityData[]>;
    getNdbDataCB(icao: string, callback: (data: IFacilityData) => void): void;
    getNdbWaypointDataCB(icao: string, callback: (data: IFacilityIntersectionData) => void): void;
    getNdbData(icao: string): Promise<IFacilityData>;
    getNdbs(icaos: string[]): Promise<WayPoint[]>;
    getNdbsData(icaos: string[]): Promise<IFacilityData[]>;
    getVorDataCB(icao: string, callback: (data: IFacilityData) => void): void;
    getVorWaypointDataCB(icao: string, callback: (data: IFacilityIntersectionData) => void): void;
    getVorData(icao: string): Promise<IFacilityData>;
    getVors(icaos: string[]): Promise<WayPoint[]>;
    getVorsData(icaos: string[]): Promise<IFacilityData[]>;
    getAllAirways(intersection: WayPoint | WayPointInfo, maxLength?: number): Promise<Airway[]>;
    getAllAirwaysData(intersectionInfo: WayPointInfo, maxLength?: number): Promise<IAirwayData[]>;
    getAirwayData(intersectionInfo: WayPointInfo, name?: string, maxLength?: number): Promise<IAirwayData>;
}
declare abstract class WaypointLoader {
    static DEPRECATION_DELAY_MAX: number;
    static DEPRECATION_DELAY_MIN: number;
    deprecationDelay: number;
    slowDown(): void;
    speedUp(): void;
    protected waypointsCountLimit: number;
    waypoints: WayPoint[];
    private _locked;
    private _lastMaxItemsSearchCountSyncDate;
    private _maxItemsSearchCountNeedUpdate;
    private _maxItemsSearchCount;
    get maxItemsSearchCount(): number;
    set maxItemsSearchCount(v: number);
    private _lastSearchRangeSyncDate;
    private _searchRangeNeedUpdate;
    private _searchRange;
    get searchRange(): number;
    get searchRangeInMeters(): number;
    set searchRange(v: number);
    private _lastSearchOriginSyncDate;
    private _lastSearchOriginLat;
    private _lastSearchOriginLong;
    private _searchOrigin;
    get searchLat(): number;
    set searchLat(v: number);
    get searchLong(): number;
    set searchLong(v: number);
    private _itemsCountNeedUpdate;
    private _itemsNeedUpdate;
    private _isLoadingItems;
    private _hasUpdatedItems;
    private _lastItemCountUpdateDate;
    private _itemsCount;
    private _itemIterator;
    private batch;
    protected SET_ORIGIN_LATITUDE: string;
    protected SET_ORIGIN_LONGITUDE: string;
    protected SET_SEARCH_RANGE: string;
    protected GET_SEARCH_RANGE: string;
    protected SET_MAX_ITEMS: string;
    protected GET_MAX_ITEMS: string;
    protected GET_ITEMS_COUNT: string;
    protected SET_ITEM_INDEX: string;
    protected GET_ITEM_ICAO: string;
    protected GET_ITEM_IDENT: string;
    protected createCallback: (icao: string) => Promise<NearestWaypoint>;
    protected createWaypointCallback: (icao: string) => Promise<WayPoint>;
    protected createWaypointsCallback: (icaos: string[]) => Promise<WayPoint[]>;
    loaderName: string;
    currentMapAngularWidth: number;
    currentMapAngularHeight: number;
    instrument: BaseInstrument;
    constructor(_instrument: BaseInstrument);
    update(): void;
}
declare class NDBLoader extends WaypointLoader {
    constructor(_instrument: BaseInstrument);
}
declare class VORLoader extends WaypointLoader {
    constructor(_instrument: BaseInstrument);
}
declare class IntersectionLoader extends WaypointLoader {
    constructor(_instrument: BaseInstrument);
}
declare class AirportLoader extends WaypointLoader {
    constructor(_instrument: BaseInstrument);
}
