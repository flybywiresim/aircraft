import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { ControlLaw, LateralPathGuidance } from '@fmgc/guidance/ControlLaws';
import { SegmentType } from '@fmgc/wtsdk';
import { MathUtils } from '@shared/MathUtils';
import { Constants } from '@shared/Constants';

/**
 * Compute the remaining distance around an arc
 * This is only valid once past the itp
 * @param ppos       current aircraft position
 * @param itp        current aircraft track
 * @param centreFix  centre of the arc
 * @param sweepAngle angle swept around the arc, +ve for clockwise
 * @returns
 */
export function arcDistanceToGo(ppos: Coordinates, itp: Coordinates, centreFix: Coordinates, sweepAngle: Degrees) {
    const itpBearing = Avionics.Utils.computeGreatCircleHeading(centreFix, itp);
    const pposBearing = Avionics.Utils.computeGreatCircleHeading(centreFix, ppos);
    const radius = Avionics.Utils.computeGreatCircleDistance(centreFix, itp);

    const refFrameOffset = Avionics.Utils.diffAngle(0, itpBearing);
    const pposAngle = sweepAngle < 0 ? Avionics.Utils.clampAngle(refFrameOffset - pposBearing) : Avionics.Utils.clampAngle(pposBearing - refFrameOffset);

    // before the arc... this implies max sweep angle is <340, arinc allows less than that anyway
    if (pposAngle >= 340) {
        return radius * Math.PI * Math.abs(sweepAngle) / 180;
    }

    if (pposAngle >= Math.abs(sweepAngle)) {
        return 0;
    }

    return radius * Math.PI * (Math.abs(sweepAngle) - pposAngle) / 180;
}

/**
 * Compute guidance parameters for an arc path
 *
 * @param ppos       current aircraft position
 * @param trueTrack  current aircraft track
 * @param itp        initial turning point for the arc
 * @param centreFix  centre of the arc
 * @param sweepAngle angle swept around the arc, +ve for clockwise
 *
 * @returns lateral path law params
 */
export function arcGuidance(ppos: Coordinates, trueTrack: Degrees, itp: Coordinates, centreFix: Coordinates, sweepAngle: Degrees): LateralPathGuidance {
    const bearingPpos = Avionics.Utils.computeGreatCircleHeading(
        centreFix,
        ppos,
    );

    const desiredTrack = sweepAngle > 0 ? Avionics.Utils.clampAngle(bearingPpos + 90) : Avionics.Utils.clampAngle(bearingPpos - 90);
    const trackAngleError = Avionics.Utils.diffAngle(trueTrack, desiredTrack);

    const radius = Avionics.Utils.computeGreatCircleDistance(centreFix, itp);
    const distanceFromCenter = Avionics.Utils.computeGreatCircleDistance(centreFix, ppos);

    const crossTrackError = sweepAngle > 0
        ? distanceFromCenter - radius
        : radius - distanceFromCenter;

    const groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'meters per second');
    const radiusInMetre = radius * 1852;
    const phiCommand = (sweepAngle > 0 ? 1 : -1) * Math.atan((groundSpeed * groundSpeed) / (radiusInMetre * 9.81)) * (180 / Math.PI);

    return {
        law: ControlLaw.LATERAL_PATH,
        trackAngleError,
        crossTrackError,
        phiCommand,
    };
}

/**
 * Computes a point along a course to a fix
 *
 * @param distanceFromEnd distance before end of line
 * @param course          course of the line to the fix
 * @param fix             self-explanatory
 */
export function pointOnCourseToFix(
    distanceFromEnd: NauticalMiles,
    course: DegreesTrue,
    fix: Coordinates,
): Coordinates {
    return Avionics.Utils.bearingDistanceToCoordinates(
        Avionics.Utils.clampAngle(course + 180),
        distanceFromEnd,
        fix.lat,
        fix.long,
    );
}

/**
 * Computes a point along an arc at a distance before its termination
 *
 * @param distanceFromFtp distance before end of arc
 * @param ftp             arc exit point
 * @param centreFix       arc centre fix
 * @param sweepAngle      angle swept around the arc, +ve for clockwise
 */
export function pointOnArc(
    distanceFromFtp: NauticalMiles,
    ftp: Coordinates,
    centreFix: Coordinates,
    sweepAngle: Degrees,
): Coordinates {
    const radius = Avionics.Utils.computeGreatCircleDistance(centreFix, ftp);
    const distanceRatio = distanceFromFtp / arcLength(radius, sweepAngle);
    const angleFromFtp = -distanceRatio * sweepAngle;

    const centerToTerminationBearing = Avionics.Utils.computeGreatCircleHeading(centreFix, ftp);

    return Avionics.Utils.bearingDistanceToCoordinates(
        Avionics.Utils.clampAngle(centerToTerminationBearing + angleFromFtp),
        radius,
        centreFix.lat,
        centreFix.long,
    );
}

export function minBank(segment: SegmentType): Degrees {
    return segment === SegmentType.Enroute ? 5 : 10;
}

export function maxBank(tas: Knots, toGuidedPath: boolean): Degrees {
    /*
    TODO
    if (engineOut) {
        return 15;
    }
    */

    if (toGuidedPath) {
        // roll limit 2 from honeywell doc
        if (tas < 100) {
            return 15 + (tas / 10);
        }
        if (tas > 350) {
            return 19 + Math.max(0, ((450 - tas) * 6 / 100));
        }
        return 25;
    }
    // roll limit 1
    if (tas < 150) {
        return 15 + (tas / 10);
    }
    if (tas > 300) {
        return 30 + Math.max(0, ((450 - tas) * 11 / 150));
    }
    return 30;
}

export function courseToFixDistanceToGo(ppos: Coordinates, course: Degrees, fix: Coordinates): NauticalMiles {
    const pposToFixBearing = Avionics.Utils.computeGreatCircleHeading(ppos, fix);
    const pposToFixDist = Avionics.Utils.computeGreatCircleDistance(ppos, fix);

    const pposToFixAngle = Avionics.Utils.diffAngle(pposToFixBearing, course);

    return Math.max(0, pposToFixDist * Math.cos(pposToFixAngle * Math.PI / 180));
}

export function courseToFixGuidance(ppos: Coordinates, trueTrack: Degrees, course: Degrees, fix: Coordinates): LateralPathGuidance {
    const pposToFixBearing = Avionics.Utils.computeGreatCircleHeading(ppos, fix);
    const pposToFixDist = Avionics.Utils.computeGreatCircleDistance(ppos, fix);

    const pposToFixAngle = Avionics.Utils.diffAngle(course, pposToFixBearing);

    const crossTrackError = pposToFixDist * Math.sin(pposToFixAngle * Math.PI / 180);

    const trackAngleError = Avionics.Utils.diffAngle(trueTrack, course);

    return {
        law: ControlLaw.LATERAL_PATH,
        trackAngleError,
        crossTrackError,
        phiCommand: 0,
    };
}

function getAlongTrackDistanceTo(start: Coordinates, end: Coordinates, ppos: Coordinates): number {
    const R = Constants.EARTH_RADIUS_NM;

    const d13 = Avionics.Utils.computeGreatCircleDistance(start, ppos) / R;
    const Theta13 = Avionics.Utils.DEG2RAD * Avionics.Utils.computeGreatCircleHeading(start, ppos);
    const Theta12 = Avionics.Utils.DEG2RAD * Avionics.Utils.computeGreatCircleHeading(start, end);

    const deltaXt = Math.asin(Math.sin(d13) * Math.sin(Theta13 - Theta12));

    const deltaAt = Math.acos(Math.cos(d13) / Math.abs(Math.cos(deltaXt)));

    return deltaAt * Math.sign(Math.cos(Theta12 - Theta13)) * R;
}

export function getIntermediatePoint(start: Coordinates, end: Coordinates, fraction: number): Coordinates {
    const Phi1 = start.lat * Avionics.Utils.DEG2RAD;
    const Gamma1 = start.long * Avionics.Utils.DEG2RAD;
    const Phi2 = end.lat * Avionics.Utils.DEG2RAD;
    const Gamma2 = end.long * Avionics.Utils.DEG2RAD;

    const deltaPhi = Phi2 - Phi1;
    const deltaGamma = Gamma2 - Gamma1;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(Phi1) * Math.cos(Phi2) * Math.sin(deltaGamma / 2) * Math.sin(deltaGamma / 2);
    const delta = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const A = Math.sin((1 - fraction) * delta) / Math.sin(delta);
    const B = Math.sin(fraction * delta) / Math.sin(delta);

    const x = A * Math.cos(Phi1) * Math.cos(Gamma1) + B * Math.cos(Phi2) * Math.cos(Gamma2);
    const y = A * Math.cos(Phi1) * Math.sin(Gamma1) + B * Math.cos(Phi2) * Math.sin(Gamma2);
    const z = A * Math.sin(Phi1) + B * Math.sin(Phi2);

    const Phi3 = Math.atan2(z, Math.sqrt(x * x + y * y));
    const Gamma3 = Math.atan2(y, x);

    return {
        lat: Phi3 * Avionics.Utils.RAD2DEG,
        long: Gamma3 * Avionics.Utils.RAD2DEG,
    };
}

export function fixToFixGuidance(ppos: Coordinates, trueTrack: DegreesTrue, from: Coordinates, to: Coordinates): LateralPathGuidance {
    // Track angle error
    const totalTrackDistance = Avionics.Utils.computeGreatCircleDistance(from, to);
    const alongTrackDistance = getAlongTrackDistanceTo(from, to, ppos);

    const intermediatePoint = getIntermediatePoint(from, to, Math.min(Math.max(alongTrackDistance / totalTrackDistance, 0.05), 0.95));

    const desiredTrack = Avionics.Utils.computeGreatCircleHeading(intermediatePoint, to);
    const trackAngleError = MathUtils.mod(desiredTrack - trueTrack + 180, 360) - 180;

    // Cross track error
    const bearingAC = Avionics.Utils.computeGreatCircleHeading(from, ppos);
    const bearingAB = Avionics.Utils.computeGreatCircleHeading(from, to);
    const distanceAC = Avionics.Utils.computeDistance(from, ppos);

    const desiredOffset = 0;
    const actualOffset = (
        Math.asin(
            Math.sin(Avionics.Utils.DEG2RAD * (distanceAC / Constants.EARTH_RADIUS_NM))
            * Math.sin(Avionics.Utils.DEG2RAD * (bearingAC - bearingAB)),
        ) * Avionics.Utils.RAD2DEG
    ) * Constants.EARTH_RADIUS_NM;
    const crossTrackError = desiredOffset - actualOffset;

    return {
        law: ControlLaw.LATERAL_PATH,
        trackAngleError,
        crossTrackError,
        phiCommand: 0,
    };
}

export function arcLength(radius: NauticalMiles, sweepAngle: Degrees): NauticalMiles {
    const circumference = 2 * Math.PI * radius;

    return circumference / 360 * Math.abs(sweepAngle);
}
