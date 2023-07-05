import {
    FlightPlanLeg, FlightPlanSegment, SegmentClass, VerticalWaypointPrediction,
    AltitudeConstraintType, SpeedConstraintType, WindVector, DerivedFplnLegData,
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
        location: { lat: 0, long: 0 },
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

const leg5: FlightPlanLeg = new FlightPlanLeg(enrouteSegment, procDaxi, '(SPDLIM)', undefined, undefined, undefined, false);
const pred5: VerticalWaypointPrediction = {
    waypointIndex: 4,
    altitude: 10000,
    speed: 250,
    estimatedFuelOnBoard: 87.4,
    distanceFromStart: 23,
    secondsFromPresent: 6 * 60,
    altitudeConstraint: null,
    speedConstraint: { type: SpeedConstraintType.at, speed: 250 },
    isAltitudeConstraintMet: null,
    isSpeedConstraintMet: true,
    altError: null,
    distanceToTopOfDescent: null,
    distanceFromAircraft: null,
};
const der5: DerivedFplnLegData = {
    trackFromLastWpt: null,
    distanceFromLastWpt: null,
    windPrediction: new WindVector(276, 19),
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
    overfly: false,
    waypoint: simpleWaypointFactory('UKUVO'),
    waypointDescriptor: WaypointDescriptor.Essential,
    transitionAltitude: 13000,
}, 'UKUVO', 'PS53', undefined, undefined, false);
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

export const flightPlanLegsMockData: FlightPlanLeg[] = [leg1, leg2, leg3, leg4, leg5, leg6, leg7, leg8, leg9, leg2, leg3, leg4, leg5, leg6, leg7, leg8, leg9];
export const predictionsMockData: VerticalWaypointPrediction[] = [pred1, pred2, pred3, pred4, pred5, pred6, pred7, pred8, pred9, pred2, pred3, pred4, pred5, pred6, pred7, pred8, pred9];
export const derivedMockData: DerivedFplnLegData[] = [der1, der2, der3, der4, der5, der6, der7, der8, der9, der2, der3, der4, der5, der6, der7, der8, der9];
