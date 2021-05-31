/*
 * MIT License
 *
 * Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { FlightPlanManager } from "@fmgc/index";
import { NXDataStore } from "@shared/persistence";

declare class WayPoint {
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

    cumulativeDistanceInFP: number;

    instrument: BaseInstrument;

    altDesc: number;

    altitude1: number;

    altitude2: number;

    legAltitudeDescription: number;

    legAltitude1: number;

    legAltitude2: number;

    additionalData: { [key: string]: any }

    _svgElements: any;
}

declare class WayPointInfo {
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

declare class AirportInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);

    frequencies: any[];

    namedFrequencies: any[];

    departures: any[];

    approaches: MSFS.RawApproachData[];

    arrivals: any[];

    runways: any[];

    oneWayRunways: OneWayRunway[];

    UpdateNamedFrequencies(icao?: string): Promise<void>
}

declare class IntersectionInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
}

declare class VORInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
}

declare class NDBInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
}

declare class FMCMainDisplay {
    constructor();

    approachSpeeds: NXSpeedsApp;


    flightPlanManager: FlightPlanManager;
}

declare class NXSpeedsApp {
    vapp: number;
}

declare interface OneWayRunway {
    designation: string;
    direction: number;
    beginningCoordinates: LatLongAlt;
    endCoordinates: LatLongAlt;
    elevation: number;
}

declare interface RunwayTransition {
    runwayNumber: number;
    runwayDesignation: number;
}

declare interface EnrouteTransition {
    legs: ProcedureLeg[];
}

declare interface ProcedureLeg {
    type: number;
    fixIcao: string;
    originIcao: string;
    altDesc: number;
    altitude1: number;
    altitude2: number;
    course: number;
    distance: number;
    rho: number;
    theta: number;
}

declare interface RopsStateMachine {
    currentState: RopsState;
    states: {
        FLIGHT_INHIBIT: {
            value: number;
            activateROPS(): void;
            execute(): void;
        },
        ROPS: {
            value: number;
            armROW(): void;
            execute(): void;
        },
        ROW: {
            value: number;
            engageROP(): void;
            execute(): void;
        },
        ROP: {
            value: number;
            engageGroundInhibit(): void;
            execute(): void;
        },
        GROUND_INHIBIT: {
            value: number;
            engageInflightInhibit(): void;
            execute(): void;
        }
    }
}

declare interface RopsState {
    value: number;

    activateROPS?();

    armROW?();

    engageROP?();

    engageGroundInhibit?();

    engageInflightInhibit?();

    execute(): void;
}

declare interface RopsLandingConstants {
    flapFull: {
        refDist: number;
        positiveWeightCorrection: number;
        negativeWeightCorrection: number;
        speedCorrection: number;
        altCorrection: number;
        windCorrection: number;
        tempCorrection: number;
        downSlopeCorrection: number;
        reverseThrCorrection: number;
        overWeightCorrection: number;
        autolandCorrection: number;
    },
    config3: {
        refDist: number;
        positiveWeightCorrection: number;
        negativeWeightCorrection: number;
        speedCorrection: number;
        altCorrection: number;
        windCorrection: number;
        tempCorrection: number;
        downSlopeCorrection: number;
        reverseThrCorrection: number;
        overWeightCorrection: number;
        autolandCorrection: number;
    }
}

declare function RegisterViewListener(handler: string): void

declare namespace MSFS {

    interface RawApproachData {
        finalLegs: ProcedureLeg[],
        missedLegs: ProcedureLeg[],
        icaos: string[],
        index: number,
        name?: string,
        runway: string,
        transitions: MSFS.RawApproachTransitionData[],
        __Type: 'JS_Approach',
    }

    export interface RawApproachTransitionData {
        legs: ProcedureLeg[],
        name: string,
        __Type: 'JS_ApproachTransition',
    }

}
