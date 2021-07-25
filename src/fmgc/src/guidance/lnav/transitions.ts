import { Guidable } from '@fmgc/guidance/Geometry';
import { NauticalMiles } from '@typings/types';

export abstract class Transition implements Guidable {
    abstract isAbeam(ppos: LatLongAlt): boolean;

    abstract getGuidanceParameters(ppos, trueTrack);

    abstract getDistanceToGo(ppos);

    abstract getTrackDistanceToTerminationPoint(ppos: LatLongAlt): NauticalMiles;
}
