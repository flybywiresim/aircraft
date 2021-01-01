import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Degrees } from '../../../../../typings';

/**
 * Compute the remaining distance around an arc
 * This is only valid once past the itp
 * @param ppos
 * @param itp
 * @param centrePoint
 * @param sweepAngle
 * @returns
 */
export function arcDistanceToGo(ppos: Coordinates, itp: Coordinates, centrePoint: Coordinates, sweepAngle: Degrees) {
    const itpBearing = Avionics.Utils.computeGreatCircleHeading(centrePoint, itp);
    const pposBearing = Avionics.Utils.computeGreatCircleHeading(centrePoint, ppos);
    const radius = Avionics.Utils.computeGreatCircleDistance(centrePoint, itp);

    const refFrameOffset = Avionics.Utils.diffAngle(0, itpBearing);
    const pposAngle = sweepAngle < 0 ? Avionics.Utils.clampAngle(refFrameOffset - pposBearing) : Avionics.Utils.clampAngle(pposBearing - refFrameOffset);

    if (pposAngle >= Math.abs(sweepAngle)) {
        return 0;
    }

    return radius * Math.PI * (Math.abs(sweepAngle) - pposAngle) / 180;
}
