import { Guidable } from '@fmgc/guidance/Geometry';
import { Degrees, NauticalMiles } from '@typings/types';

export abstract class Transition implements Guidable {
    abstract isAbeam(ppos: LatLongAlt): boolean;

    abstract getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees);

    abstract getNominalRollAngle(gs): Degrees;

    abstract get isCircularArc(): boolean;

    abstract getDistanceToGo(ppos: LatLongAlt);

    abstract getTrackDistanceToTerminationPoint(ppos: LatLongAlt): NauticalMiles;

    abstract getTurningPoints(): [LatLongAlt, LatLongAlt]
}
