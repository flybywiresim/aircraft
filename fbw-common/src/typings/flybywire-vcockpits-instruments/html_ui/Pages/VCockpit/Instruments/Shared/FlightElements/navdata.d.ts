// Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
// SPDX-License-Identifier: MIT

import {
    AirportClass,
    AirportPrivateType,
    AirspaceType,
    AltitudeDescriptor,
    FixTypeFlags,
    FrequencyType,
    LegType,
    NdbType,
    RnavTypeFlags,
    RouteType,
    RunwayDesignatorChar,
    RunwayLighting,
    RunwaySurface,
    TurnDirection,
    VorClass,
    VorType, WaypointConstraintType,
} from './enums';

declare global {
    interface OneWayRunway {
        designation: string;
        designator: RunwayDesignatorChar;
        direction: number;
        beginningCoordinates: LatLongAlt;
        endCoordinates: LatLongAlt;
        elevation: number;
        length: number;
        number: number;
        slope: number;
        thresholdCoordinates: LatLongAlt;
        thresholdLength: number;
        thresholdElevation: number;
        primaryILSFrequency: RawIlsFrequency;
        secondaryILSFrequency: RawIlsFrequency;
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
        /** Leg RNP, added by RawDataMapper for AR/SAAR procs as MSFS does not have RNP data */
        rnp?: number;
        // knots
        speedRestriction: number;
        // heading to originIcao, megnetic unless trueDegrees is true?
        theta: number;
        trueDegrees: boolean;
        turnDirection: TurnDirection;
        type: LegType;
        /** glide path angle + 360 */
        verticalAngle?: number;
        __Type: 'JS_Leg';
    }

    interface RawApproachTransition {
        // denotes the subclass of this instance
        legs: RawProcedureLeg[];
        name: string;
        __Type: 'JS_ApproachTransition';
    }

    interface RawApproach {
        approachSuffix: string;
        approachType: ApproachType;
        finalLegs: RawProcedureLeg[];
        // unknown/empty
        icaos: Array<string>;
        missedLegs: RawProcedureLeg[];
        /** Short format approach name (up to 7 chars) for MCDU */
        name: string;
        /** Long format approach name (up to 9 chars) for EIS */
        longName: string;
        rnavTypeFlags: RnavTypeFlags;
        // 3 digits [0-9]{2}[LCR]
        runway: string;
        runwayDesignator: RunwayDesignatorChar;
        runwayNumber: number;
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
        /** Added by RawDataMapper */
        name?: string;
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
        // added for a32nx
        additionalData: { [key: string]: any }
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
        altitude: number;
        __Type: 'JS_FacilityAirport';
    }

    interface RawFrequency {
        freqBCD16: number;
        freqMHz: number;
        name: string;
        icao: string;
        type: FrequencyType;
        __Type: 'JS_Frequency' | 'JS_FrequencyILS';
    }

    interface RawIlsFrequency extends RawFrequency {
        hasGlideslope: boolean;
        glideslopeAngle: number;
        localizerCourse: number;
        magvar: number;
        __Type: 'JS_FrequencyILS';
    }

    interface RawRunway {
        __Type: 'JS_Runway',
        /** runway designation numbers only, split by - */
        designation: string,
        designatorCharPrimary: RunwayDesignatorChar,
        designatorCharSecondary: RunwayDesignatorChar,
        /** runway bearing in true degrees */
        direction: number,
        /** runway elevation in metres */
        elevation: number,
        /** latitude of the centre of the runway */
        latitude: number,
        /** runway length in metres */
        length: number,
        /** seems to always be 0 */
        lighting: RunwayLighting,
        /** longitude of the centre of the runway */
        longitude: number,
        /** primary elevation in metres... not sure if threshold or end */
        primaryElevation: number,
        /** ils frequency for the primary end... not always filled */
        primaryILSFrequency: JS_Frequency,
        /** offset of the primary end threshold in metres */
        primaryThresholdLength: number,
        /** secondary elevation in metres... not sure if threshold or end */
        secondaryElevation: number,
        /** ils frequency for the secondary end... not always filled */
        secondaryILSFrequency: JS_Frequency,
        /** offset of the secondary end threshold in metres */
        secondaryThresholdLength: number,
        surface: RunwaySurface,
        /** runway width in metres */
        width: number,
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

export {};
