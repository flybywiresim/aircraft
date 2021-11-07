import { Guidable } from '@fmgc/guidance/Geometry';

export abstract class Transition implements Guidable {
    abstract isAbeam(ppos: LatLongData): boolean;

    abstract getGuidanceParameters(ppos: LatLongData, trueTrack: Degrees);

    abstract getNominalRollAngle(gs): Degrees;

    abstract get isCircularArc(): boolean;

    abstract getDistanceToGo(ppos: LatLongData);

    abstract getTrackDistanceToTerminationPoint(ppos: LatLongData): NauticalMiles;

    abstract getTurningPoints(): [LatLongData, LatLongData]
}
