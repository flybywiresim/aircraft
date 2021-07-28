import { Degrees, NauticalMiles } from '@typings/types';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/transitions';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { GuidanceParameters } from './ControlLaws';

export const EARTH_RADIUS_NM = 3440.1;

export interface Guidable {
    getGuidanceParameters(ppos: LatLongData, trueTrack: Degrees): GuidanceParameters | null;
    getDistanceToGo(ppos: LatLongData): NauticalMiles;
    isAbeam(ppos: LatLongData): boolean;
}

export class Geometry {
    /**
     * The list of transitions between legs.
     * - entry n: transition after leg n
     */
    public transitions: Map<number, Transition>;

    /**
     * The list of legs in this geometry, possibly connected through transitions:
     * - entry n: nth leg, before transition n
     */
    public legs: Map<number, Leg>;

    constructor(transitions: Map<number, Transition>, legs: Map<number, Leg>) {
        this.transitions = transitions;
        this.legs = legs;
    }

    /**
     *
     * @param ppos
     * @param trueTrack
     * @example
     * const a = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"),
     * const b = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude")
     * const ppos = new LatLongAlt(a, b);
     * const trueTrack = SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
     * getGuidanceParameters(ppos, trueTrack);
     */
    getGuidanceParameters(ppos, trueTrack) {
        // first, check if we're abeam with one of the transitions (start or end)
        const fromTransition = this.transitions.get(1);
        if (fromTransition && fromTransition.isAbeam(ppos)) {
            return fromTransition.getGuidanceParameters(ppos, trueTrack);
        }

        const toTransition = this.transitions.get(2);
        if (toTransition && toTransition.isAbeam(ppos)) {
            return toTransition.getGuidanceParameters(ppos, trueTrack);
        }

        // otherwise perform straight point-to-point guidance for the first leg
        const activeLeg = this.legs.get(1);
        if (activeLeg) {
            return activeLeg.getGuidanceParameters(ppos, trueTrack);
        }

        return null;
    }

    getDistanceToGo(ppos): number | null {
        const activeLeg = this.legs.get(1);
        if (activeLeg) {
            return activeLeg.getDistanceToGo(ppos);
        }

        return null;
    }

    shouldSequenceLeg(ppos: LatLongAlt): boolean {
        const activeLeg = this.legs.get(1);

        // VM legs do not connect to anything and do not have a transition after them - we never sequence them
        if (activeLeg instanceof VMLeg) {
            return false;
        }

        // FIXME I don't think this works since getActiveLegGeometry doesn't put a transition at n = 2
        const terminatingTransition = this.transitions.get(2);

        if (terminatingTransition) {
            const tdttp = terminatingTransition.getTrackDistanceToTerminationPoint(ppos);

            return tdttp < 0.001;
        }

        if (activeLeg) {
            return activeLeg.getDistanceToGo(ppos) < 0.001;
        }

        return false;
    }
}
