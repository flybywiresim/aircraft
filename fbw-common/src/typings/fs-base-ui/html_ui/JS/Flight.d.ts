/// <reference path="../../../types.d.ts" />
/// <reference path="./Types.d.ts" />
/// <reference path="./common.d.ts" />

declare global {
    class LeaderboardEntry {
        constructor(data: any);
        getScoreStr(): string;
    }

    enum LocationType {
        Departure,
        Arrival,
        Free
    }

    class AirportInfos {
    }

    class WaypointInfos {
    }

    class POIInfos {
    }

    class NPCPlaneInfo {
    }

    class WorldLocation {
        static getDebugValue(): {
            image: string;
            icao: string;
            name: string;
            weather: WeatherData;
        };

        constructor(data: {
            lla: LatLongAlt;
            image: string;
            icao: string;
            name: string;
            weather: WeatherData;
        });

        lla: LatLongAlt;
        image: string;
        icao: string;
        name: string;
        weather: WeatherData;

        toString(): string;
    }

    class WeatherData {
        static isEqual(a: any, b: any): boolean;
        static getDebugValue(): WeatherData;

        locked: boolean;
        index: any;
        name: string;
        icon: string;
        weatherImage: string;
        weatherImageLayered: any;
        live: boolean;
        visibility: string;
        wind: string;
    }

    interface TimeDataValue {
        min: number;
        max: number;
        value: number;
        valueStr: string;
        percent: number;
    }

    class TimeData {
        static getDebugValue(): TimeData;

        timeImage: string;
        live: boolean;
        timeLocal: TimeDataValue;
        timeUTC: TimeDataValue;
        dateLocal: TimeDataValue;
        dateUTC: TimeDataValue;
    }

    class ATC_FLIGHTPLAN_TYPE {
        static getName(obj: any): "" | "TT:GAME.ATC_ROUTE_IFR" | "TT:GAME.ATC_ROUTE_VFR";

        constructor(value: any);

        value: any;
    }

    class ATC_ROUTE_TYPE {
        static getName(obj: any): "" | "TT:GAME.ATC_ROUTE_GPS" | "TT:GAME.ATC_ROUTE_VOR_TO_VOR"
            | "TT:GAME.ATC_ROUTE_LOW_AIRWAYS" | "TT:GAME.ATC_ROUTE_HIGH_AIRWAYS" | "TT:GAME.ATC_ROUTE_UNAVAILABLE";

        constructor(value: any);

        value: any;
    }

    class RouteAlgorithmChoice {
    }

    enum FlightLegStateEnum {
        LEG_NOT_STARTED,
        LEG_STARTED,
        LEG_FINISHED
    }

    class FlightLegInfo {
    }

    class Flight {
        constructor(data: any);

        canBeResumed: boolean;
        nextWaypoints: LatLongAlt[];
        leaderboardWorld: LeaderboardEntry[];
        leaderboardFriends: LeaderboardEntry[];
        leaderboardAroundPlayer: LeaderboardEntry[];
    }

    class WorldMapListener extends ViewListener.ViewListener {
        onWorldmapSelectionChange(callback: (...args: any[]) => void): void;
        selectRunway(index: any): void;
        selectWaypointByIndex(index: any): void;
        onWorldMapScaleChanged(callback: (...args: any[]) => void): void;
        onWorldMapFilterChange(callback: (...args: any[]) => void): void;
        getWorldMapFilters(): Promise<unknown>;
        getSelectedFilter(): Promise<unknown>;
        getWorldMapLegend(): Promise<unknown>;
    }

    class GameFlightListener extends ViewListener.ViewListener {
        constructor(name: string);

        onGameFlightUpdated(callback: (...args: any[]) => void): void;
        onTimeUpdated(callback: (...args: any[]) => void): void;
        onWeatherUpdated(callback: (...args: any[]) => void): void;
        onShowFlightPlan(callback: (...args: any[]) => void): void;
        onLeaderbaordUpdated(callback: (...args: any[]) => void): void;
        onEnterActivityMode(callback: (...args: any[]) => void): void;
        onExitActivityMode(callback: (...args: any[]) => void): void;
        resetGameFlight(): void;
        setSelectionAsDeparture(): void;
        resetDeparture(): void;
        onGameFlightReseted(callback: (...args: any[]) => void): void;
        setDepartureRunwayIndex(index: any): void;
        setDepartureTaxiIndex(index: any): void;
        setDeparturePlateIndex(index: any): void;
        setArrivalRunwayIndex(index: any): void;
        setArrivalTaxiIndex(index: any): void;
        setArrivalPlateIndex(index: any): void;
        setApproachIndex(index: any): void;
        setAlgorithmType(fpType: any, routeType: any): void;
        switchDepartureArrival(): void;
        setSelectionAsArrival(): void;
        resetArrival(): void;
        addSelectionToFlightPlan(): void;
        removeSelectionFromFlightPlan(): void;
        setDepartureTime(timeInSeconds: number, utc: any): void;
        increaseDepartureTime(utc: any): void;
        decreaseDepartureTime(utc: any): void;
        setDepartureDate(year: any, monthStart0: any, dayStart0: any): void;
        setWeatherPreset(iPreset: any): void;
        resetToSystemTime(val: any): void;
        setSelectedLegIndex(index: any): void;
        onFlightLegChanged(callback: (...args: any[]) => void): void;
        launchFlight(): void;
        launchFlightWithNPC(): void;
        showLoadSavePopUp(): void;
        setAircraftTailNumber(value: any): void;
        setAircraftCallSign(value: any): void;
        setAircraftFlightNumber(value: any): void;
        setAppendHeavyToCallSign(value: any): void;
        setShowTailNumber(value: any): void;
        setFlightConditionConfiguration(id: any): void;
        updateFlightConditions(): void;
        onUpdateFlightConditionConfiguration(callback: (...args: any[]) => void): void;
        requestGameFlight(callback: (flight: any) => void): void;
    }

    function RegisterGameFlightListener(callback?: () => void): GameFlightListener;
    function RegisterWorldMapListener(callback?: () => void): WorldMapListener;

    class WaypointData {
    }

    class LocationInfo {
    }

    class FlightPlanData {
    }

    class FlightPlanListener {
        constructor(name: any);
        onUpdateFlightPlan(callback: (...args: any[]) => void): void;
        setCruisingAltitude(value: number): void;
        requestFlightPlan(): void;
    }

    function RegisterFlightPlanListener(callback?: () => void): FlightPlanListener;
}

export {};
