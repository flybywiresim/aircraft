// Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
// SPDX-License-Identifier: MIT

import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import {
    AirportClass,
    AirportPrivateType,
    AirspaceType,
    AltitudeDescriptor,
    FixTypeFlags,
    FrequencyType,
    LegType,
    NdbType,
    RouteType,
    RunwayDesignatorChar,
    RunwayLighting,
    RunwaySurface,
    TurnDirection,
    VorClass,
    VorType,
} from './FSEnums';

declare global {
    class WayPoint {
        constructor(_baseInstrument: BaseInstrument);

        icao: string;

        ident: string;

        endsInDiscontinuity?: boolean;

        discontinuityCanBeCleared?: boolean;

        isVectors?: boolean;

        isRunway?: boolean;

        isTurningPoint?: boolean;

        infos: WayPointInfo;

        type: string;

        bearingInFP: number;

        distanceInFP: number;

        distanceInMinutes: number;

        cumulativeDistanceInFP: number;

        waypointReachedAt: number;

        instrument: BaseInstrument;

        altDesc: number;

        altitude1: number;

        altitude2: number;

        legAltitudeDescription: number;

        legAltitude1: number;

        legAltitude2: number;

        speedConstraint: number;

        constraintType: WaypointConstraintType;

        additionalData: { [key: string]: any }

        turnDirection: TurnDirection;

        verticalAngle?: number;

        _svgElements: any;
    }

    class WayPointInfo {
        constructor(_instrument: BaseInstrument);

        coordinates: LatLongAlt;

        icao: string;

        ident: string;

        airwayIn: string;

        airwayOut: string;

        routes: any[];

        instrument: BaseInstrument;

        magneticVariation?: number;

        _svgElements: any;

        UpdateInfos(_CallBack?, loadFacilitiesTransitively?);

        CopyBaseInfosFrom(_WP: WayPoint);
    }

    class AirportInfo extends WayPointInfo {
        constructor(_instrument: BaseInstrument);

        frequencies: any[];

        namedFrequencies: any[];

        departures: any[];

        approaches: RawApproach[];

        arrivals: any[];

        runways: any[];

        oneWayRunways: OneWayRunway[];

        UpdateNamedFrequencies(icao?: string): Promise<void>
    }

    class IntersectionInfo extends WayPointInfo {
        constructor(_instrument: BaseInstrument);
    }

    class VORInfo extends WayPointInfo {
        constructor(_instrument: BaseInstrument);
        type: VorType;
    }

    class NDBInfo extends WayPointInfo {
        constructor(_instrument: BaseInstrument);
    }

    interface OneWayRunway {
        designation: string;
        direction: number;
        beginningCoordinates: LatLongAlt;
        endCoordinates: LatLongAlt;
        elevation: number;
        length: number;
        slope: number;
        thresholdCoordinates: LatLongAlt;
        thresholdLength: number;
        thresholdElevation: number;
    }

    interface RawProcedureLeg {
        altDesc: AltitudeDescriptor;
        // constraint 1 metres
        altitude1: number;
        // constraint 2 metres
        altitude2: number;
        // icao of arc centre...
        arcCenterFixIcao: string;
        // course if needed, otherwise 0
        course: number;
        // length of leg in metres or minutes...
        distance: number;
        // distance in minutes?
        distanceMinutes: boolean;
        // fix this leg goes TO
        fixIcao: string;
        // type for approach fixes
        fixTypeFlags: FixTypeFlags;
        flyOver: boolean;
        // reference navaid... is the ILS for final leg of ILS approaches
        originIcao: string;
        // distance to originIcao in metres
        rho: number;
        // knots
        speedRestriction: number;
        // heading to originIcao, megnetic unless trueDegrees is true?
        theta: number;
        trueDegrees: boolean;
        turnDirection: TurnDirection;
        type: LegType;
        __Type: 'JS_Leg';
    }

    interface RawApproachTransition {
        // denotes the subclass of this instance
        legs: RawProcedureLeg[];
        name: string;
        __Type: 'JS_ApproachTransition';
    }

    interface RawApproach {
        finalLegs: RawProcedureLeg[];
        // unknown/empty
        icaos: Array<string>;
        missedLegs: RawProcedureLeg[];
        // "(VOR|ILS|LOC|RNAV|...) [0-9]{2} ([A-Z])?"
        name: string;
        // 3 digits [0-9]{2}[LCR]
        runway: string;
        transitions: RawApproachTransition[];
        __Type: 'JS_Approach';
    }

    interface RawDeparture {
        // seems to be always empty...
        commonLegs: RawProcedureLeg[];
        enRouteTransitions: RawEnRouteTransition[];
        name: string;
        runwayTransitions: RawRunwayTransition[];
        __Type: 'JS_Departure';
    }

    interface RawArrival {
        // seems to be always empty...
        commonLegs: RawProcedureLeg[];
        enRouteTransitions: RawEnRouteTransition[];
        name: string;
        runwayTransitions: RawRunwayTransition[];
        __Type: 'JS_Arrival';
    }

    interface RawApproachTransition {
        legs: RawProcedureLeg[];
        name: string;
        __Type: 'JS_ApproachTransition';
    }

    interface RawEnRouteTransition {
        legs: RawProcedureLeg[];
        name: string;
        __Type: 'JS_EnRouteTransition';
    }

    interface RawRunwayTransition {
        legs: RawProcedureLeg[];
        runwayDesignation: RunwayDesignatorChar;
        runwayNumber: number;
        __Type: 'JS_RunwayTransition';
    }

    interface RawFacility {
        // sometimes empty, sometimes two digit ICAO area code
        region: string;
        // translation string identifier
        city: string;
        icao: string;
        // often seems to be empty
        name: string;
        lat: number;
        lon: number;
        __Type: string;
    }

    interface RawVor extends RawFacility {
        freqBCD16: number;
        freqMHz: number;
        type: VorType;
        vorClass: VorClass;
        weatherBroadcast: number;
        // [0, 360)
        magneticVariation?: number;
        __Type: 'JS_FacilityVOR';
    }

    interface RawNdb extends RawFacility {
        freqMHz: number;
        type: NdbType;
        weatherBroadcast: number;
        // [0, 360)
        magneticVariation?: number;
        __Type: 'JS_FacilityNDB';
    }

    interface RawIntersection extends RawFacility {
        nearestVorDistance: number;
        nearestVorFrequencyBCD16: number;
        nearestVorFrequencyMHz: number;
        nearestVorICAO: string;
        nearestVorMagneticRadial: number;
        nearestVorTrueRadial: number;
        nearestVorType: VorType;
        routes: RawRoute[]; // airways
        __Type: 'JS_FacilityIntersection';
    }

    interface RawRoute {
        // airway name
        name: string;
        // end of airway
        nextIcao: string;
        // start of airway
        prevIcao: string;
        type: RouteType;
        __Type: 'JS_Route';
    }

    interface RawAirport extends RawFacility {
        airportClass: AirportClass;
        airportPrivateType: AirportPrivateType;
        airspaceType: AirspaceType;
        approaches: RawApproach[];
        arrivals: RawArrival[];
        // often (always?) "Unknown"
        bestApproach: string;
        departures: RawDeparture[];
        // com frequencies, and sometimes navaids too...
        frequencies: RawFrequency[];
        // these two seem to be unused?
        fuel1: string;
        fuel2: string;
        // TODO enum?
        radarCoverage: number;
        runways: RawRunway[];
        towered: boolean;
        __Type: 'JS_FacilityAirport';
    }

    interface RawFrequency {
        freqBCD16: number;
        freqMHz: number;
        name: string;
        type: FrequencyType;
        __Type: 'JS_Frequency';
    }

    interface RawRunway {
        // denotes the subclass of this instance
        __Type: string;
        // [0-9]{2}[LCR](\-[0-9]{2}[LCR])?
        designation: string;
        designatorCharPrimary: RunwayDesignatorChar;
        designatorCharSecondary: RunwayDesignatorChar;
        // degrees
        direction: number;
        // metres
        elevation: number;
        latitude: number;
        // metres
        length: number;
        lighting: RunwayLighting;
        longitude: number;
        // these don't seem to be filled on almost all runways, but a curious few are...
        primaryILSFrequency: RawFrequency;
        secondaryILSFrequency: RawFrequency;
        surface: RunwaySurface;
        // metres
        width: number;
    }

    interface NearestSearch {
        __Type: 'JS_NearestSearch',
        sessionId: number,
        searchId: number,
        added: string[],
        removed: string[],
    }

    function RegisterViewListener(handler: string): ViewListener.ViewListener
}
