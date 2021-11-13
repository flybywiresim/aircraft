import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { ControlLaw, LateralPathGuidance } from '@fmgc/guidance/ControlLaws';

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
    const distanceRatio = distanceFromFtp / (Math.PI * 2 * radius);
    const angleFromFtp = -distanceRatio * sweepAngle;

    const centerToTerminationBearing = Avionics.Utils.computeGreatCircleHeading(centreFix, ftp);

    return Avionics.Utils.bearingDistanceToCoordinates(
        Avionics.Utils.clampAngle(centerToTerminationBearing + angleFromFtp),
        radius,
        centreFix.lat,
        centreFix.long,
    );
}

export function maxBank(tas: Knots, toGuidedPath: boolean): Degrees {
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
