declare enum LocationType {
    Departure = 0,
    Arrival = 1,
    Free = 2
}
declare class AirportInfos {
    runways: DataValue[];
    taxis: DataValue[];
    frequencies: DataValue[];
    departures: DataValue[];
    arrivals: DataValue[];
    approaches: DataValue[];
    runwaySelected: number;
}
declare class WaypointInfos {
    waypointType: string;
    frequency: DataValue;
}
declare class POIInfos {
    POIType: string;
    creator: string;
}
declare class NPCPlaneInfo {
    infos: DataValue[];
    ID: string;
    from: WorldLocation;
    to: WorldLocation;
    percent: number;
    server: ServerInfoData;
}
declare class WorldLocation {
    type: string;
    wlType: number;
    name: string;
    city: string;
    country: string;
    icon: string;
    icao: string;
    lla: LatLongAlt;
    altitude: DataValue;
    latDMS: string;
    longDMS: string;
    image: string;
    waypointInfos: WaypointInfos;
    poiInfos: POIInfos;
    weather: WeatherData;
    airportInfos: AirportInfos;
    npcInfos: NPCPlaneInfo;
    toString(): string;
    constructor(data?: any);
    static getDebugValue(): WorldLocation;
}
declare class WeatherData {
    index: number;
    name: string;
    icon: string;
    pressure: number;
    weatherImage: string;
    weatherImageLayered: string;
    live: boolean;
    wind: string;
    visibility: string;
    locked: boolean;
    static isEqual(a: WeatherData, b: WeatherData): boolean;
    static getDebugValue(): WeatherData;
}
declare class TimeData {
    timeImage: string;
    live: boolean;
    year: number;
    month: number;
    dayInMonth: number;
    dateShort: string;
    dateLong: string;
    yearLocal: number;
    monthLocal: number;
    dayInMonthLocal: number;
    dateShortLocal: string;
    dateLongLocal: string;
    timeLocal: RangeDataValue;
    timeUTC: RangeDataValue;
    dateLocal: RangeDataValue;
    dateUTC: RangeDataValue;
    static getDebugValue(): TimeData;
}
declare class ATC_FLIGHTPLAN_TYPE {
    __Type: string;
    FLIGHTPLAN_TYPE_NONE: number;
    FLIGHTPLAN_TYPE_IFR: number;
    FLIGHTPLAN_TYPE_VFR: number;
    value: number;
    constructor(value?: number);
    static getName(obj: ATC_FLIGHTPLAN_TYPE): string;
}
declare class ATC_ROUTE_TYPE {
    __Type: string;
    ROUTE_TYPE_DIRECT: number;
    ROUTE_TYPE_VOR: number;
    ROUTE_TYPE_LOWALT: number;
    ROUTE_TYPE_HIGHALT: number;
    ROUTE_TYPE_UNAVAILABLE: number;
    value: number;
    available: boolean;
    constructor(value?: number);
    static getName(obj: ATC_ROUTE_TYPE): string;
}
declare class RouteAlgorithmChoice {
    __Type: string;
    flightPlanType: ATC_FLIGHTPLAN_TYPE;
    routeTypes: ATC_ROUTE_TYPE[];
}
declare enum FlightLegStateEnum {
    LEG_NOT_STARTED = 0,
    LEG_STARTED = 1,
    LEG_FINISHED = 2
}
declare class FlightLegInfo {
    index: number;
    distance: DataValue;
    ete: DataValue;
    state: FlightLegStateEnum;
    from: WorldLocation;
    to: WorldLocation;
    strFrom: string;
    strTo: string;
    strImageFrom: string;
    strImageTo: string;
    weather: WeatherData;
}
declare type FlightConditionID = "MULTIPLAYERLIVE" | "MULTIPLAYERALL" | "MULTIPLAYEROFF" | "AIRTRAFFICLIVE" | "AIRTRAFFICAI" | "AIRTRAFFICOFF" | "WEATHERLIVE" | "WEATHERPRESET" | "WEATHERCUSTOM";
interface FlightConfigurationButton {
    id: FlightConditionID;
    selected: boolean;
    disabled: boolean;
}
interface FlightConditions {
    multiplayer: FlightConfigurationButton[];
    airtraffic: FlightConfigurationButton[];
    weather: FlightConfigurationButton[];
    multiplayerDisabledReason: string;
    multiplayerDisabledShowButtons: boolean;
}
declare class Flight {
    canBeEdited: boolean;
    canWeatherBeLive: boolean;
    weatherCanBeEdited: boolean;
    flightConditionsCanBeEdited: boolean;
    timeCanBeEdited: boolean;
    canLaunchFlight: boolean;
    departure: WorldLocation;
    departurePlateIndex: number;
    departureRunwayIndex: number;
    departureTaxiIndex: number;
    arrival: WorldLocation;
    approachIndex: number;
    arrivalPlateIndex: number;
    arrivalRunwayIndex: number;
    arrivalTaxiIndex: number;
    aircraftData: AircraftData;
    weatherData: WeatherData;
    timeData: TimeData;
    flightName: string;
    activityType: string;
    activityTypeID: string;
    activityTypeStringID: any;
    string: any;
    briefingText: string;
    descriptionText: string;
    briefingImages: string[];
    briefingImagesOverlay: string[];
    briefingHTMLUrl: string;
    activityInfos: DataValue[];
    widgetImage: string;
    aircraftCanBeEdited: boolean;
    algorithms: RouteAlgorithmChoice[];
    flightPlanType: number;
    routeType: number;
    hasLeaderboards: boolean;
    canBeResumed: boolean;
    hasLegs: boolean;
    currentLeg: number;
    legsInfos: FlightLegInfo[];
    departureTime: string;
    timeToComplete: string;
    aircraftName: string;
    aircraftImage: string;
    aircraftPayload: string;
    aircraftFuel: string;
    timeElapsed: string;
    timeRemaining: string;
    distanceFlown: string;
    distanceToGo: string;
    stepsCount: number;
    currentStep: number;
    currentStepName: string;
    nextWaypoints: Array<LatLongAlt>;
    constructor(data?: any);
}
declare class WorldMapListener extends ViewListener.ViewListener {
    onWorldmapSelectionChange(callback: (location: WorldLocation) => void): void;
    selectRunway(index: number): void;
    selectWaypointByIndex(index: number): void;
    onWorldMapScaleChanged(callback: (scale: DataValue) => void): void;
    onWorldMapFilterChange(callback: (str: string) => void): void;
    getWorldMapFilters(): Promise<any>;
    getSelectedFilter(): Promise<any>;
    getWorldMapLegend(): Promise<TreeDataValue>;
    onPanelOpened(): void;
    onPanelClosed(): void;
}
declare class GameFlightListener extends ViewListener.ViewListener {
    constructor(name: string);
    onGameFlightUpdated(callback: (flight: Flight) => void): void;
    onWeatherAndTimeUpdated(callback: (flight: Flight) => void): void;
    onShowFlightPlan(callback: () => void): void;
    onLeaderbaordUpdated(callback: (flight: Flight, data: LeaderBoards) => void): void;
    onEnterActivityMode(callback: (flight: Flight) => void): void;
    onExitActivityMode(callback: (flight: Flight) => void): void;
    resetGameFlight(): void;
    setSelectionAsDeparture(): void;
    resetDeparture(): void;
    onGameFlightReseted(callback: () => void): void;
    setDepartureRunwayIndex(index: number): void;
    setDepartureTaxiIndex(index: number): void;
    setDeparturePlateIndex(index: number): void;
    setArrivalRunwayIndex(index: number): void;
    setArrivalTaxiIndex(index: number): void;
    setArrivalPlateIndex(index: number): void;
    setApproachIndex(index: number): void;
    setAlgorithmType(fpType: ATC_FLIGHTPLAN_TYPE, routeType: ATC_ROUTE_TYPE): void;
    viewGamercard(strXuid: string): void;
    switchDepartureArrival(): void;
    setSelectionAsArrival(): void;
    resetArrival(): void;
    addSelectionToFlightPlan(): void;
    removeSelectionFromFlightPlan(): void;
    setDepartureTime(timeInSeconds: number, utc: boolean): void;
    increaseDepartureTime(utc: boolean): void;
    decreaseDepartureTime(utc: boolean): void;
    setDepartureDate(year: number, monthStart0: number, dayStart0: number): void;
    setWeatherPreset(iPreset: number): void;
    resetToSystemTime(val: boolean): void;
    setSelectedLegIndex(index: number): void;
    onFlightLegChanged(callback: (leg: FlightLegInfo, flight: Flight) => void): void;
    launchFlight(): void;
    launchFlightWithNPC(): void;
    showLoadSavePopUp(): void;
    setAircraftTailNumber(value: string): any;
    setAircraftCallSign(value: string): any;
    setAircraftFlightNumber(value: string): any;
    setAppendHeavyToCallSign(value: boolean): any;
    setShowTailNumber(value: boolean): any;
    setElevatorAuthorityValue(value: number): any;
    setRudderAuthorityValue(value: number): any;
    setAileronAuthorityValue(value: number): any;
    setWearTearValue(value: number): any;
    setFlightConditionConfiguration(id: string): void;
    updateFlightConditions(): void;
    onUpdateFlightConditionConfiguration(callback: (data: FlightConditions) => void): void;
    requestGameFlight(callback: any): void;
}
declare function RegisterGameFlightListener(callback?: any): GameFlightListener;
declare function RegisterFlightBriefingListener(callback?: any): GameFlightListener;
declare function RegisterWorldMapListener(callback?: any): WorldMapListener;
declare class WaypointData {
    index: number;
    name: string;
    heading: DataValue;
    distance: DataValue;
    altitude: DataValue;
    frequency: DataValue;
    speed: DataValue;
    ete: DataValue;
    eta: DataValue;
    type: string;
    icon: string;
}
declare class LocationInfo {
    IDEN: string;
    name: string;
    date: string;
    time: string;
    valid: boolean;
}
declare class FlightPlanData {
    cruisingAltitude: DataValue;
    altitudeData: AltitudeGraphData;
    departure: LocationInfo;
    arrival: LocationInfo;
    waypoints: WaypointData[];
}
declare class FlightPlanListener extends ViewListener.ViewListener {
    constructor(name: string);
    onUpdateFlightPlan(callback: (data: FlightPlanData) => void): void;
    setCruisingAltitude(value: number): void;
    requestFlightPlan(): void;
}
declare function RegisterFlightPlanListener(callback?: any): FlightPlanListener;
