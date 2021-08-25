import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/transitions';
import { Type1Transition } from '@fmgc/guidance/lnav/transitions/Type1';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { GeoMath } from '@fmgc/flightplanning/GeoMath';
import { MathUtils } from '@shared/MathUtils';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Degrees, NauticalMiles } from '../../../../typings';
import { GuidanceParameters } from './ControlLaws';

export const EARTH_RADIUS_NM = 3440.1;

export interface Guidable {
    getGuidanceParameters(ppos: Coordinates, trueTrack: Degrees): GuidanceParameters | null;
    getDistanceToGo(ppos: Coordinates): NauticalMiles;
    isAbeam(ppos: Coordinates): boolean;
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
        const fromTransition = this.transitions.get(0);
        // TODO RAD
        if (fromTransition && fromTransition.isAbeam(ppos)) {
            return fromTransition.getGuidanceParameters(ppos, trueTrack);
        }

        const activeLeg = this.legs.get(1);

        const toTransition = this.transitions.get(1);
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

        const transitionAfterActiveLeg = this.transitions.get(1);
        if (activeLeg instanceof TFLeg && transitionAfterActiveLeg instanceof Type1Transition) {
            // Sequence at ITP
            const [transItp] = transitionAfterActiveLeg.getTurningPoints();

            const legBearing = activeLeg.bearing;
            const bearingToTransItp = Avionics.Utils.computeGreatCircleHeading(ppos, transItp);
            const innerAngleWithTransItp = MathUtils.smallCrossingAngle(legBearing, bearingToTransItp);

            const directedDtgToTransItp = GeoMath.directedDistanceToGo(ppos, transItp, innerAngleWithTransItp);

            return directedDtgToTransItp < 0;
        }

        if (activeLeg) {
            return activeLeg.getDistanceToGo(ppos) < 0.001;
        }

        return false;
    }
}
