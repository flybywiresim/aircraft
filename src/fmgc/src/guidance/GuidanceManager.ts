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

    private static ifLeg(fix: WayPoint, segment: SegmentType, indexInFullPath: number) {
        return new IFLeg(fix, segment, indexInFullPath);
    }

    private static vmLeg(heading: DegreesMagnetic, course: DegreesTrue, segment: SegmentType, indexInFullPath: number) {
        return new VMLeg(heading, course, segment, indexInFullPath);
    }

    private static cfLeg(fix: WayPoint, course: DegreesTrue, segment: SegmentType, indexInFullPath: number) {
        return new CFLeg(fix, course, segment, indexInFullPath);
    }

    private static dfLeg(fix: WayPoint, segment: SegmentType, indexInFullPath: number) {
        return new DFLeg(fix, segment, indexInFullPath);
    }

    private static rfLeg(from: WayPoint, to: WayPoint, center: LatLongData, segment: SegmentType, indexInFullPath: number) {
        return new RFLeg(from, to, center, segment, indexInFullPath);
    }

    private static tfLeg(from: WayPoint, to: WayPoint, segment: SegmentType, indexInFullPath: number) {
        return new TFLeg(from, to, segment, indexInFullPath);
    }

    private static haLeg(to: WayPoint, segment: SegmentType, indexInFullPath: number) {
        return new HALeg(to, segment, indexInFullPath);
    }

    private static hfLeg(to: WayPoint, segment: SegmentType, indexInFullPath: number) {
        return new HFLeg(to, segment, indexInFullPath);
    }

    private static hmLeg(to: WayPoint, segment: SegmentType, indexInFullPath: number) {
        return new HMLeg(to, segment, indexInFullPath);
    }

    private static caLeg(course: DegreesTrue, altitude: Feet, segment: SegmentType, indexInFullPath: number) {
        return new CALeg(course, altitude, segment, indexInFullPath);
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
    private static legFromWaypoints(prevLeg: Leg | undefined, from: WayPoint, to: WayPoint, toIndex: number, segment: SegmentType): Leg {
        if (to?.additionalData?.legType === LegType.IF) {
            if (prevLeg && prevLeg instanceof IFLeg) {
                return GuidanceManager.tfLeg(from, to, segment, toIndex);
            }

            return GuidanceManager.ifLeg(to, segment, toIndex);
        }

        if (!from || !to) {
            return null;
        }

        if (from.endsInDiscontinuity) {
            return null;
        }

        if (to.additionalData) {
            if (to.additionalData.legType === LegType.CF) {
                return GuidanceManager.cfLeg(to, to.additionalData.course, segment, toIndex);
            }

            if (to.additionalData.legType === LegType.DF) {
                return GuidanceManager.dfLeg(to, segment, toIndex);
            }

            if (to.additionalData.legType === LegType.RF) {
                return GuidanceManager.rfLeg(from, to, to.additionalData.center, segment, toIndex);
            }

            if (to.additionalData.legType === LegType.CA) {
                const course = to.additionalData.vectorsCourse;
                const altitude = to.additionalData.vectorsAltitude;

                return GuidanceManager.caLeg(course, altitude, segment, toIndex);
            }

            if (to.additionalData?.legType === LegType.HA) {
                return GuidanceManager.haLeg(to, segment, toIndex);
            }

            if (to.additionalData?.legType === LegType.HF) {
                return GuidanceManager.hfLeg(to, segment, toIndex);
            }

            if (to.additionalData?.legType === LegType.HM) {
                return GuidanceManager.hmLeg(to, segment, toIndex);
            }
        }

        if (to.isVectors) {
            return GuidanceManager.vmLeg(to.additionalData.vectorsHeading, to.additionalData.vectorsCourse, segment, toIndex);
        }

        // Substitute TF after CA with DF for now to make transitions work
        if (from.additionalData?.legType === LegType.CA) {
            return GuidanceManager.dfLeg(to, segment, toIndex);
        }

        return GuidanceManager.tfLeg(from, to, segment, toIndex);
    }

    getLeg(prevLeg: Leg | null, index: number, flightPlanIndex): Leg | null {
        const from = this.flightPlanManager.getWaypoint(index - 1, flightPlanIndex);
        const to = this.flightPlanManager.getWaypoint(index, flightPlanIndex);
        const segment = this.flightPlanManager.getSegmentFromWaypoint(to, flightPlanIndex).type;

        return GuidanceManager.legFromWaypoints(prevLeg, from, to, index, segment);
    }

    updateGeometry(geometry: Geometry, flightPlanIndex: FlightPlans, activeIdx: number, wptCount: number): void {
        if (LnavConfig.DEBUG_GEOMETRY) {
            console.log('[Fms/Geometry/Update] Starting geometry update.');
        }

        for (let i = activeIdx; i < wptCount; i++) {
            const oldLeg = geometry.legs.get(i);
            const prevLeg = geometry.legs.get(i - 1);
            const newLeg = this.getLeg(prevLeg, i, flightPlanIndex);

            if (LnavConfig.DEBUG_GEOMETRY) {
                console.log(`[FMS/Geometry/Update] Old leg #${i} = ${oldLeg?.repr ?? '<none>'}`);
                console.log(`[FMS/Geometry/Update] New leg #${i} = ${newLeg?.repr ?? '<none>'}`);
            }

            const legsMatch = oldLeg?.repr === newLeg?.repr;

            if (legsMatch) {
                if (LnavConfig.DEBUG_GEOMETRY) {
                    console.log('[FMS/Geometry/Update] Old and new leg are the same. Keeping old leg.');
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
            const currentLeg = this.getLeg(prevLeg, i, temp ? FlightPlans.Temporary : FlightPlans.Active);

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
