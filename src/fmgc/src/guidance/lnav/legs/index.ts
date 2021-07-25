import { Degrees, NauticalMiles } from '@typings/types';
import { Guidable } from '@fmgc/guidance/Geometry';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';

export interface Leg extends Guidable {
    get bearing(): Degrees;

    getGuidanceParameters(ppos: LatLongAlt, trueTrack: Degrees);

    /**
     * Calculates directed DTG parameter
     *
     * @param ppos {LatLong} the current position of the aircraft
     */
    getDistanceToGo(ppos: LatLongData): NauticalMiles;

    isAbeam(ppos);
}
