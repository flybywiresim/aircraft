/* eslint-disable max-len */
import {
    FlightPlanLeg, FlightPlanSegment, SegmentClass, VerticalWaypointPrediction,
    AltitudeConstraintType, SpeedConstraintType, WindVector, DerivedFplnLegData, Discontinuity, FlightPlanElement, PseudoWaypoint,
} from 'instruments/src/MFD/dev-data/FlightPlanInterfaceMockup';
import { EnrouteSubsectionCode, LegType, SectionCode, Waypoint, WaypointArea, WaypointDescriptor } from 'msfs-navdata';

/*
public constructor(
        public segment: FlightPlanSegment,
        public readonly definition: FlightPlanLegDefinition,
        public ident: string,
        public annotation: string,
        public readonly airwayIdent: string | undefined,
        public readonly rnp: number | undefined,
        public readonly overfly: boolean,
    )
*/

function simpleWaypointFactory(name: string): Waypoint {
    return {
        subSectionCode: EnrouteSubsectionCode.Waypoints,
        name,
        area: WaypointArea.Enroute,
        location: { lat: 42.262, long: 50.282 },
        databaseId: 'abc123',
        icaoCode: 'XYZ',
        ident: name,
        sectionCode: SectionCode.Enroute,
    };
}

const enrouteSegment: FlightPlanSegment = {
    class: SegmentClass.Enroute,
    strung: false,
};

const leg1: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, {
    procedureIdent: '',
    type: LegType.IF,
    overfly: false,
    waypoint: simpleWaypointFactory('OMAA31L'),
    waypointDescriptor: WaypointDescriptor.Runway,
    transitionAltitude: 13000,
}, 'OMAA31L', 'DAXI1K', undefined, undefined, false);
const pred1: VerticalWaypointPrediction = {
    waypointIndex: 0,
    altitude: 80,
    speed: 141,
    estimatedFuelOnBoard: 90.1,
    distanceFromStart: 0,
    secondsFromPresent: 0,
    altitudeConstraint: null,
    speedConstraint: null,
    isAltitudeConstraintMet: null,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der1: DerivedFplnLegData = {
    trackFromLastWpt: 0,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(276, 0),
};

const procDaxi = {
    procedureIdent: 'DAXI1K',
    type: LegType.CF,
    overfly: false,
    waypoint: simpleWaypointFactory('DAXIB'),
    waypointDescriptor: WaypointDescriptor.Essential,
    transitionAltitude: 13000,
};

const leg2: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, procDaxi, 'AA820', 'DAXI1K', undefined, undefined, false);
const pred2: VerticalWaypointPrediction = {
    waypointIndex: 1,
    altitude: 4350,
    speed: 250,
    estimatedFuelOnBoard: 88.5,
    distanceFromStart: 10,
    secondsFromPresent: 3 * 60,
    altitudeConstraint: null,
    speedConstraint: null,
    isAltitudeConstraintMet: null,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: 10,
};
const der2: DerivedFplnLegData = {
    trackFromLastWpt: 306,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(276, 8),
};

const leg3: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, procDaxi, 'OBTOL', 'DAXI1K', undefined, undefined, false);
const pred3: VerticalWaypointPrediction = {
    waypointIndex: 2,
    altitude: 9000,
    speed: 250,
    estimatedFuelOnBoard: 87.7,
    distanceFromStart: 18,
    secondsFromPresent: 5 * 60,
    altitudeConstraint: { type: AltitudeConstraintType.at, altitude1: 9000, altitude2: null },
    speedConstraint: null,
    isAltitudeConstraintMet: true,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der3: DerivedFplnLegData = {
    trackFromLastWpt: 306,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(276, 17),
};

const leg4: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, procDaxi, 'PUXUT', 'DAXI1K', undefined, undefined, false);
const pred4: VerticalWaypointPrediction = {
    waypointIndex: 3,
    altitude: 9000,
    speed: 250,
    estimatedFuelOnBoard: 87.6,
    distanceFromStart: 21,
    secondsFromPresent: 5 * 60,
    altitudeConstraint: { type: AltitudeConstraintType.at, altitude1: 9000, altitude2: null },
    speedConstraint: { type: SpeedConstraintType.at, speed: 250 },
    isAltitudeConstraintMet: false,
    isSpeedConstraintMet: true,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der4: DerivedFplnLegData = {
    trackFromLastWpt: 306,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(276, 17),
};

const leg6: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, procDaxi, 'DAXIB', 'DAXI1K', undefined, undefined, false);
const pred6: VerticalWaypointPrediction = {
    waypointIndex: 5,
    altitude: 15600,
    speed: 314,
    estimatedFuelOnBoard: 86.0,
    distanceFromStart: 41,
    secondsFromPresent: 9 * 60,
    altitudeConstraint: { type: AltitudeConstraintType.atOrAbove, altitude1: 15000, altitude2: null },
    speedConstraint: null,
    isAltitudeConstraintMet: true,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der6: DerivedFplnLegData = {
    trackFromLastWpt: 323,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(287, 26),
};

const leg7: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, {
    procedureIdent: 'PS53',
    type: LegType.CF,
    overfly: true,
    waypoint: simpleWaypointFactory('UKUVO'),
    waypointDescriptor: WaypointDescriptor.Essential,
    transitionAltitude: 13000,
}, 'UKUVO', 'PS53', undefined, undefined, true);
const pred7: VerticalWaypointPrediction = {
    waypointIndex: 6,
    altitude: 22700,
    speed: 314,
    estimatedFuelOnBoard: 84.4,
    distanceFromStart: 68,
    secondsFromPresent: 13 * 60,
    altitudeConstraint: null,
    speedConstraint: null,
    isAltitudeConstraintMet: null,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der7: DerivedFplnLegData = {
    trackFromLastWpt: 310,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(262, 34),
};

const leg8: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, {
    procedureIdent: 'G462',
    type: LegType.CF,
    overfly: false,
    waypoint: simpleWaypointFactory('OXARI'),
    waypointDescriptor: WaypointDescriptor.Essential,
    transitionAltitude: 13000,
}, 'OXARI', 'G462', 'G462', undefined, false);
const pred8: VerticalWaypointPrediction = {
    waypointIndex: 7,
    altitude: 25900,
    speed: 314,
    estimatedFuelOnBoard: 83.6,
    distanceFromStart: 95,
    secondsFromPresent: 15 * 60,
    altitudeConstraint: null,
    speedConstraint: null,
    isAltitudeConstraintMet: null,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der8: DerivedFplnLegData = {
    trackFromLastWpt: 318,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(249, 38),
};

const leg9: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, {
    procedureIdent: 'G462',
    type: LegType.CF,
    overfly: false,
    waypoint: simpleWaypointFactory('PURLI'),
    waypointDescriptor: WaypointDescriptor.Essential,
    transitionAltitude: 13000,
}, 'PURLI', 'G462', 'G462', undefined, false);
const pred9: VerticalWaypointPrediction = {
    waypointIndex: 8,
    altitude: 28300,
    speed: 314,
    estimatedFuelOnBoard: 83.0,
    distanceFromStart: 110,
    secondsFromPresent: 17 * 60,
    altitudeConstraint: null,
    speedConstraint: null,
    isAltitudeConstraintMet: null,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der9: DerivedFplnLegData = {
    trackFromLastWpt: 318,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(240, 40),
};

const leg10: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, {
    procedureIdent: '',
    type: LegType.IF,
    overfly: false,
    waypoint: simpleWaypointFactory('FF26R'),
    waypointDescriptor: WaypointDescriptor.Runway,
    transitionAltitude: 5000,
    verticalAngle: -3.0,
}, 'FF26R', 'ILS26R', undefined, undefined, false);
const pred10: VerticalWaypointPrediction = {
    waypointIndex: 9,
    altitude: 4000,
    speed: 190,
    estimatedFuelOnBoard: 11.2,
    distanceFromStart: 490,
    secondsFromPresent: 195 * 60,
    altitudeConstraint: { type: AltitudeConstraintType.atOrAbove, altitude1: 4000, altitude2: null },
    speedConstraint: null,
    isAltitudeConstraintMet: true,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der10: DerivedFplnLegData = {
    trackFromLastWpt: 264,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(276, 9),
};

const leg11: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, {
    procedureIdent: '',
    type: LegType.IF,
    overfly: false,
    waypoint: simpleWaypointFactory('LFPG26R'),
    waypointDescriptor: WaypointDescriptor.Runway,
    transitionAltitude: 5000,
    verticalAngle: -3.0,
}, 'LFPG26R', 'ILS26R', undefined, undefined, false);
const pred11: VerticalWaypointPrediction = {
    waypointIndex: 10,
    altitude: 145,
    speed: 138,
    estimatedFuelOnBoard: 8.7,
    distanceFromStart: 500,
    secondsFromPresent: 200 * 60,
    altitudeConstraint: null,
    speedConstraint: null,
    isAltitudeConstraintMet: null,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der11: DerivedFplnLegData = {
    trackFromLastWpt: 264,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(270, 6),
};

const spdlim: PseudoWaypoint = {
    ident: '(SPDLIM)',
    mcduIdent: '(SPDLIM)',
    mcduHeader: '',
    alongLegIndex: 4,
    distanceFromLegTermination: 18,
    displayedOnMcdu: true,
    efisSymbolFlag: 1,
    efisSymbolLla: null,
    displayedOnNd: true,
    distanceFromStart: 200,
    flightPlanInfo: {
        altitude: 10000,
        speed: 250,
        secondsFromPresent: 6 * 60,
        distanceFromLastFix: 2,
    },
};

const tc: PseudoWaypoint = {
    ident: '(T/D)',
    mcduHeader: '',
    alongLegIndex: 16,
    distanceFromLegTermination: 1,
    displayedOnMcdu: true,
    efisSymbolFlag: 1,
    efisSymbolLla: null,
    displayedOnNd: true,
    distanceFromStart: 200,
    flightPlanInfo: {
        altitude: 29000,
        speed: 0.84,
        secondsFromPresent: 400,
        distanceFromLastFix: 2,
    },
};

const afterDiscoLeg: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, {
    procedureIdent: '',
    type: LegType.CF,
    overfly: false,
    waypoint: simpleWaypointFactory('ABAXA'),
    waypointDescriptor: WaypointDescriptor.Essential,
    transitionAltitude: 13000,
}, 'ABAXA', '', undefined, undefined, false);
const afterDiscoPred: VerticalWaypointPrediction = {
    waypointIndex: 10,
    altitude: 4400,
    speed: 250,
    estimatedFuelOnBoard: 88.5,
    distanceFromStart: 112,
    secondsFromPresent: 3 * 60,
    altitudeConstraint: null,
    speedConstraint: null,
    isAltitudeConstraintMet: null,
    isSpeedConstraintMet: null,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: 10,
};
const afterDiscoDer: DerivedFplnLegData = {
    trackFromLastWpt: null,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(276, 8),
};

const disco: Discontinuity = { isDiscontinuity: true };

export const mockFlightPlanLegsData: FlightPlanElement[] = [leg1, leg2, leg3, leg4, leg6, leg7, leg8, leg9, disco, afterDiscoLeg, leg10, leg11];
export const mockPredictionsData: VerticalWaypointPrediction[] = [pred1, pred2, pred3, pred4, pred6, pred7, pred8, pred9, null, afterDiscoPred, pred10, pred11];
export const mockDerivedData: DerivedFplnLegData[] = [der1, der2, der3, der4, der6, der7, der8, der9, null, afterDiscoDer, der10, der11];
export const mockPseudoWaypoints: PseudoWaypoint[] = [spdlim, tc];
