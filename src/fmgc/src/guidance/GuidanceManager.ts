import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { SegmentType } from '@fmgc/wtsdk';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { LegType } from '@fmgc/types/fstypes/FSEnums';
import { TransitionPicker } from '@fmgc/guidance/lnav/TransitionPicker';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { CRLeg } from '@fmgc/guidance/lnav/legs/CR';
import { CILeg } from '@fmgc/guidance/lnav/legs/CI';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { FlightPlanManager, FlightPlans } from '../flightplanning/FlightPlanManager';
import { Geometry } from './Geometry';

/**
 * This class will guide the aircraft by predicting a flight path and
 * calculating the autopilot inputs to follow the predicted flight path.
 */
export class GuidanceManager {
    flightPlanManager: FlightPlanManager;

    constructor(flightPlanManager: FlightPlanManager) {
        this.flightPlanManager = flightPlanManager;
    }

    /**
     * Returns a {@link Leg} from two {@link WayPoint} objects. Only for fpm v1.
     *
     * @param from      the FROM waypoint
     * @param to        the TO waypoint
     * @param toIndex   index of the TO waypoint
     * @param segment   flight plan segment
     *
     * @private
     */
    private static legFromWaypoints(
        prevLeg: Leg | undefined,
        nextLeg: Leg | undefined,
        from: WayPoint,
        to: WayPoint,
        toIndex: number,
        segment: SegmentType,
    ): Leg {
        if (to?.additionalData?.legType === LegType.IF) {
            if (prevLeg && prevLeg instanceof XFLeg && !prevLeg.fix.endsInDiscontinuity) {
                return new TFLeg(prevLeg.fix, to, segment);
            }

            return new IFLeg(to, segment);
        }

        if (!from || !to) {
            return null;
        }

        if (from.endsInDiscontinuity) {
            if (to?.additionalData.legType === LegType.CF || to?.additionalData.legType === LegType.TF) {
                return new IFLeg(to, segment);
            }

            return null;
        }

        if (to.additionalData) {
            if (to.additionalData.legType === LegType.CF) {
                return new CFLeg(to, to.additionalData.course, segment);
            }

            if (to.additionalData.legType === LegType.DF) {
                return new DFLeg(to, segment);
            }

            if (to.additionalData.legType === LegType.RF) {
                return new RFLeg(from, to, to.additionalData.center, segment);
            }

            if (to.additionalData.legType === LegType.CA) {
                const course = to.additionalData.vectorsCourse;
                const altitude = to.additionalData.vectorsAltitude;

                return new CALeg(course, altitude, segment, to.turnDirection);
            }

            if (to.additionalData.legType === LegType.CI || to.additionalData.legType === LegType.VI) {
                if (!nextLeg) {
                    return null;
                }

                const course = to.additionalData.vectorsCourse;

                return new CILeg(course, nextLeg, segment, to.turnDirection);
            }

            if (to.additionalData.legType === LegType.CR) {
                const course = to.additionalData.vectorsCourse;
                const origin = to.additionalData.origin as RawFacility;
                const radial = to.additionalData.radial;
                const theta = to.additionalData.theta;

                const originObj = { coordinates: { lat: origin.lat, long: origin.lon }, ident: origin.icao.substring(7, 12).trim(), theta };

                return new CRLeg(course, originObj, radial, segment, to.turnDirection);
            }

            if (to.additionalData?.legType === LegType.HA) {
                return new HALeg(to, segment);
            }

            if (to.additionalData?.legType === LegType.HF) {
                return new HFLeg(to, segment);
            }

            if (to.additionalData?.legType === LegType.HM) {
                return new HMLeg(to, segment);
            }
        }

        if (to.isVectors) {
            return new VMLeg(to.additionalData.vectorsHeading, to.additionalData.vectorsCourse, segment, to.turnDirection);
        }

        return new TFLeg(from, to, segment);
    }

    getLeg(prevLeg: Leg | null, nextLeg: Leg | null, index: number, flightPlanIndex): Leg | null {
        const from = this.flightPlanManager.getWaypoint(index - 1, flightPlanIndex);
        const to = this.flightPlanManager.getWaypoint(index, flightPlanIndex);
        const segment = this.flightPlanManager.getSegmentFromWaypoint(to, flightPlanIndex).type;

        return GuidanceManager.legFromWaypoints(prevLeg, nextLeg, from, to, index, segment);
    }

    updateGeometry(geometry: Geometry, flightPlanIndex: FlightPlans, activeIdx: number, wptCount: number): void {
        if (LnavConfig.DEBUG_GEOMETRY) {
            console.log('[Fms/Geometry/Update] Starting geometry update.');
        }

        for (let i = activeIdx - 1; i < wptCount; i++) {
            const prevLeg = geometry.legs.get(i - 1);
            const oldLeg = geometry.legs.get(i);
            const nextLeg = this.getLeg(prevLeg, null, i + 1, flightPlanIndex);
            const newLeg = this.getLeg(prevLeg, nextLeg, i, flightPlanIndex);

            if (LnavConfig.DEBUG_GEOMETRY) {
                console.log(`[FMS/Geometry/Update] Old leg #${i} = ${oldLeg?.repr ?? '<none>'}`);
                console.log(`[FMS/Geometry/Update] New leg #${i} = ${newLeg?.repr ?? '<none>'}`);
            }

            const legsMatch = oldLeg?.repr === newLeg?.repr;

            if (legsMatch) {
                if (LnavConfig.DEBUG_GEOMETRY) {
                    console.log('[FMS/Geometry/Update] Old and new leg are the same. Keeping old leg.');
                }

                // Sync discontinuity info (FIXME until we have proper discontinuities)

                if (oldLeg instanceof XFLeg && newLeg instanceof XFLeg) {
                    oldLeg.fix.endsInDiscontinuity = newLeg.fix.endsInDiscontinuity;
                    oldLeg.fix.discontinuityCanBeCleared = newLeg.fix.discontinuityCanBeCleared;
                }

                // Sync T-P (FIXME with proper DIRECT TO)

                // isTurningPoint property seems to sometimes get lost, so we check ident too. HAX!
                if (oldLeg instanceof IFLeg && (oldLeg.fix.isTurningPoint || oldLeg.fix.ident === 'T-P') && newLeg instanceof IFLeg && newLeg.fix.isTurningPoint) {
                    oldLeg.fix = newLeg.fix;
                }

                const prevLeg = geometry.legs.get(i - 1);

                const oldInboundTransition = geometry.transitions.get(i - 1);
                const newInboundTransition = TransitionPicker.forLegs(prevLeg, newLeg);

                const transitionsMatch = oldInboundTransition?.repr === newInboundTransition?.repr;

                if (!transitionsMatch) {
                    geometry.transitions.set(i - 1, newInboundTransition);
                }
            } else {
                if (LnavConfig.DEBUG_GEOMETRY) {
                    if (!oldLeg) console.log('[FMS/Geometry/Update] No old leg. Adding new leg.');
                    else if (!newLeg) console.log('[FMS/Geometry/Update] No new leg. Removing old leg.');
                    else console.log('[FMS/Geometry/Update] Old and new leg are different. Keeping new leg.');
                }

                if (newLeg) {
                    geometry.legs.set(i, newLeg);

                    const prevLeg = geometry.legs.get(i - 1);

                    const computeAllTransitions = LnavConfig.NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE === -1;

                    if (prevLeg && (computeAllTransitions || (i - activeIdx) <= LnavConfig.NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE)) {
                        const newInboundTransition = TransitionPicker.forLegs(prevLeg, newLeg);

                        if (LnavConfig.DEBUG_GEOMETRY) {
                            console.log(`[FMS/Geometry/Update] Set new inbound transition for new leg (${newInboundTransition?.repr ?? '<none>'})`);
                        }

                        if (newInboundTransition) {
                            geometry.transitions.set(i - 1, newInboundTransition);
                        } else {
                            geometry.transitions.delete(i - 1);
                        }
                    } else {
                        geometry.transitions.delete(i - 1);
                    }
                } else {
                    geometry.legs.delete(i);
                    geometry.transitions.delete(i - 1);
                    geometry.transitions.delete(i);
                }
            }
        }

        // Trim geometry

        for (const [index] of geometry.legs.entries()) {
            const legBeforePrev = index < activeIdx - 1;
            const legAfterLastWpt = index >= wptCount;

            if (legBeforePrev || legAfterLastWpt) {
                if (LnavConfig.DEBUG_GEOMETRY) {
                    console.log(`[FMS/Geometry/Update] Removed leg #${index} (${geometry.legs.get(index)?.repr ?? '<unknown>'}) because of trimming.`);
                }

                geometry.legs.delete(index);
                geometry.transitions.delete(index - 1);
            }
        }

        if (LnavConfig.DEBUG_GEOMETRY) {
            console.log('[Fms/Geometry/Update] Done with geometry update.');
        }
    }

    /**
     * The full leg path geometry, used for the ND and predictions on the F-PLN page.
     */
    getMultipleLegGeometry(temp? : boolean): Geometry | null {
        if (temp) {
            if (this.flightPlanManager.getFlightPlan(1) === undefined) {
                return undefined;
            }
        }

        const activeIdx = temp
            ? this.flightPlanManager.getFlightPlan(1).activeWaypointIndex
            : this.flightPlanManager.getCurrentFlightPlan().activeWaypointIndex;
        const legs = new Map<number, Leg>();
        const transitions = new Map<number, Transition>();

        const wpCount = temp
            ? this.flightPlanManager.getFlightPlan(1).length
            : this.flightPlanManager.getCurrentFlightPlan().length;

        for (let i = activeIdx - 1; i < wpCount; i++) {
            // Leg
            const prevLeg = legs.get(i - 1);
            const nextLeg = this.getLeg(prevLeg, null, i + 1, temp ? FlightPlans.Temporary : FlightPlans.Active);
            const currentLeg = this.getLeg(prevLeg, nextLeg, i, temp ? FlightPlans.Temporary : FlightPlans.Active);

            if (currentLeg) {
                legs.set(i, currentLeg);
            }

            // Transition
            const transition = TransitionPicker.forLegs(prevLeg, currentLeg);

            if (transition) {
                transitions.set(i - 1, transition);
            }
        }

        return new Geometry(transitions, legs);
    }
}
