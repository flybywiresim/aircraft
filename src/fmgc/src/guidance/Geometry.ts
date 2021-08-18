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
     * const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');
     * getGuidanceParameters(ppos, trueTrack, gs);
     */
    getGuidanceParameters(ppos, trueTrack, gs) {
        // first, check if we're abeam with one of the transitions (start or end)
        const fromTransition = this.transitions.get(1);
        // TODO RAD
        if (fromTransition && fromTransition.isAbeam(ppos)) {
            return fromTransition.getGuidanceParameters(ppos, trueTrack);
        }

        const activeLeg = this.legs.get(1);

        const toTransition = this.transitions.get(2);
        if (toTransition) {
            if (toTransition.isAbeam(ppos)) {
                return toTransition.getGuidanceParameters(ppos, trueTrack);
            }

            if (activeLeg) {
                const [itp] = toTransition.getTurningPoints();
                // TODO this should be tidied up somewhere else
                const unTravelled = Avionics.Utils.computeGreatCircleDistance(itp, activeLeg.terminatorLocation);
                const rad = this.getRollAnticipationDistance(gs, activeLeg, toTransition);
                if ((activeLeg.getDistanceToGo(ppos) - unTravelled) <= rad) {
                    console.log(`RAD for transition ${rad}`);
                    const params = activeLeg.getGuidanceParameters(ppos, trueTrack);
                    const toParams = toTransition.getGuidanceParameters(ppos, trueTrack);
                    params.phiCommand = toParams.phiCommand ?? 0;
                    return params;
                }
            }
        }

        if (activeLeg) {
            const nextLeg = this.legs.get(2);
            if (nextLeg) {
                const rad = this.getRollAnticipationDistance(gs, activeLeg, nextLeg);
                if (activeLeg.getDistanceToGo(ppos) <= rad) {
                    console.log(`RAD for next leg ${rad}`);
                    const params = activeLeg.getGuidanceParameters(ppos, trueTrack);
                    const toParams = nextLeg.getGuidanceParameters(ppos, trueTrack);
                    params.phiCommand = toParams.phiCommand ?? 0;
                    return params;
                }
            }

            // otherwise perform straight point-to-point guidance for the first leg
            return activeLeg.getGuidanceParameters(ppos, trueTrack);
        }

        return null;
    }

    getRollAnticipationDistance(gs, from: Leg | Transition, to: Leg | Transition) {
        if (!from.isCircularArc && !to.isCircularArc) {
            return 0;
        }

        // convert ground speed to m/s
        const groundSpeedMeterPerSecond = gs * (463 / 900);

        // get nominal phi from previous and next leg
        const phiNominalFrom = from.getNominalRollAngle(groundSpeedMeterPerSecond);
        const phiNominalTo = to.getNominalRollAngle(groundSpeedMeterPerSecond);

        // calculate delta phi
        const deltaPhi = Math.abs(phiNominalTo - phiNominalFrom);

        // calculate RAD
        const maxRollRate = 5; // deg / s, TODO picked off the wind
        const k2 = 0.0045;
        const rad = gs / 3600 * (Math.sqrt(1 + 2 * k2 * 9.81 * deltaPhi / maxRollRate) - 1) / (k2 * 9.81);

        // TODO consider case where RAD > transition distance

        return rad;
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
            const distanceToGo = activeLeg.getDistanceToGo(ppos);
            if (distanceToGo > -0.1 && distanceToGo < 0.001) {
                return true;
            }
        }

        return false;
    }
}
