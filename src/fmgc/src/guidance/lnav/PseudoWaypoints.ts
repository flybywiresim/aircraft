import { GuidanceComponent } from '@fmgc/guidance/GuidanceComponent';
import { PseudoWaypoint, PseudoWaypointSequencingAction } from '@fmgc/guidance/PsuedoWaypoint';
import { VnavConfig, VnavDescentMode } from '@fmgc/guidance/vnav/VnavConfig';
import { NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { Geometry } from '@fmgc/guidance/Geometry';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { LateralMode } from '@shared/autopilot';

const PWP_IDENT_TOD = '(T/D)';
const PWP_IDENT_DECEL = '(DECEL)';
const PWP_IDENT_FLAP1 = '(FLAP1)';
const PWP_IDENT_FLAP2 = '(FLAP2)';

export class PseudoWaypoints implements GuidanceComponent {
    public pseudoWaypoints: PseudoWaypoint[] = [];

    constructor(
        private guidanceController: GuidanceController,
    ) {
    }

    acceptNewMultipleLegGeometry(geometry: Geometry) {
        const newPseudoWaypoints: PseudoWaypoint[] = [];

        if (VnavConfig.VNAV_EMIT_TOD) {
            const tod = PseudoWaypoints.pointFromEndOfPath(geometry, this.guidanceController.vnavDriver.currentDescentProfile.tod);

            if (tod) {
                const [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = tod;

                newPseudoWaypoints.push({
                    ident: PWP_IDENT_TOD,
                    sequencingType: PseudoWaypointSequencingAction.TOD_REACHED,
                    alongLegIndex,
                    distanceFromLegTermination,
                    efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent,
                    efisSymbolLla,
                    displayedOnMcdu: true,
                    stats: PseudoWaypoints.computePseudoWaypointStats(PWP_IDENT_TOD, geometry.legs.get(alongLegIndex), distanceFromLegTermination),
                });
            }
        }

        if (VnavConfig.VNAV_EMIT_DECEL) {
            const decel = PseudoWaypoints.pointFromEndOfPath(geometry, this.guidanceController.vnavDriver.currentApproachProfile.decel);

            if (decel) {
                const [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = decel;

                newPseudoWaypoints.push({
                    ident: PWP_IDENT_DECEL,
                    sequencingType: PseudoWaypointSequencingAction.APPROACH_PHASE_AUTO_ENGAGE,
                    alongLegIndex,
                    distanceFromLegTermination,
                    efisSymbolFlag: NdSymbolTypeFlags.PwpDecel,
                    efisSymbolLla,
                    displayedOnMcdu: true,
                    stats: PseudoWaypoints.computePseudoWaypointStats(PWP_IDENT_DECEL, geometry.legs.get(alongLegIndex), distanceFromLegTermination),
                });
            }
        }

        if (VnavConfig.VNAV_DESCENT_MODE === VnavDescentMode.CDA && VnavConfig.VNAV_EMIT_CDA_FLAP_PWP) {
            const flap1 = PseudoWaypoints.pointFromEndOfPath(geometry, this.guidanceController.vnavDriver.currentApproachProfile.flap1);

            if (flap1) {
                const [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = flap1;

                newPseudoWaypoints.push({
                    ident: PWP_IDENT_FLAP1,
                    alongLegIndex,
                    distanceFromLegTermination,
                    efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap1,
                    efisSymbolLla,
                    displayedOnMcdu: true,
                    stats: PseudoWaypoints.computePseudoWaypointStats(PWP_IDENT_FLAP1, geometry.legs.get(alongLegIndex), distanceFromLegTermination),
                });
            }

            const flap2 = PseudoWaypoints.pointFromEndOfPath(geometry, this.guidanceController.vnavDriver.currentApproachProfile.flap2);

            if (flap2) {
                const [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = flap2;

                newPseudoWaypoints.push({
                    ident: PWP_IDENT_FLAP2,
                    alongLegIndex,
                    distanceFromLegTermination,
                    efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap2,
                    efisSymbolLla,
                    displayedOnMcdu: true,
                    stats: PseudoWaypoints.computePseudoWaypointStats(PWP_IDENT_FLAP2, geometry.legs.get(alongLegIndex), distanceFromLegTermination),
                });
            }
        }

        this.pseudoWaypoints = newPseudoWaypoints;
    }

    init() {
        console.log('[FMGC/Guidance] PseudoWaypoints initialized!');
    }

    update(_deltaTime: number) {
        // Pass our pseudo waypoints to the GuidanceController
        this.guidanceController.currentPseudoWaypoints.length = 0;

        let idx = 0;
        for (const pseudoWaypoint of this.pseudoWaypoints) {
            const onActiveLeg = pseudoWaypoint.alongLegIndex === this.guidanceController.activeLegIndex;
            const afterActiveLeg = pseudoWaypoint.alongLegIndex > this.guidanceController.activeLegIndex;

            // We only want to add the pseudo waypoint if it's after the active leg or it isn't yet passed
            if (afterActiveLeg || (onActiveLeg && this.guidanceController.activeLegDtg > pseudoWaypoint.distanceFromLegTermination)) {
                this.guidanceController.currentPseudoWaypoints[++idx] = pseudoWaypoint;
            }
        }
    }

    /**
     * Notifies the FMS that a pseudo waypoint must be sequenced.
     *
     * This is to be sued by {@link GuidanceController} only.
     *
     * @param pseudoWaypoint the {@link PseudoWaypoint} to sequence.
     */
    public sequencePseudoWaypoint(pseudoWaypoint: PseudoWaypoint): void {
        if (DEBUG) {
            console.log(`[FMS/PseudoWaypoints] Pseudo-waypoint '${pseudoWaypoint.ident}' sequenced.`);
        }

        switch (pseudoWaypoint.sequencingType) {
        case PseudoWaypointSequencingAction.TOD_REACHED:
            // TODO EFIS message;
            break;
        case PseudoWaypointSequencingAction.APPROACH_PHASE_AUTO_ENGAGE:
            const apLateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number');
            const agl = Simplane.getAltitudeAboveGround();

            if (agl < 9500 && (apLateralMode === LateralMode.NAV || apLateralMode === LateralMode.LOC_CPT || apLateralMode === LateralMode.LOC_TRACK)) {
                // Request APPROACH phase engagement for 5 seconds
                SimVar.SetSimVarValue('L:A32NX_FM_ENABLE_APPROACH_PHASE', 'Bool', true).then(() => [
                    setTimeout(() => {
                        SimVar.SetSimVarValue('L:A32NX_FM_ENABLE_APPROACH_PHASE', 'Bool', false);
                    }, 5_000),
                ]);
            }
            break;
        default:
        }
    }

    /**
     * Computes a {@link WaypointStats} object for a pseudo waypoint
     *
     * @param ident             the text identifier to give to this pseudo waypoint, for display on the MCDU
     * @param leg               the leg along which this pseudo waypoint is situated
     * @param distanceAlongLeg  the distance from the termination of the leg to this pseudo waypoint
     *
     * @private
     */
    private static computePseudoWaypointStats(ident: string, leg: Leg, distanceAlongLeg: number): WaypointStats {
        // TODO use predictions store to find out altitude, speed and time
        return {
            ident,
            bearingInFp: 0,
            distanceInFP: leg.distance - distanceAlongLeg,
            distanceFromPpos: 0,
            timeFromPpos: 0,
            etaFromPpos: 0,
            magneticVariation: 0,
        };
    }

    private static pointFromEndOfPath(path: Geometry, distanceFromEnd: NauticalMiles): [lla: Coordinates, distanceFromLegTermination: number, legIndex: number] | undefined {
        let accumulator = 0;

        // FIXME take transitions into account on newer FMSs
        for (const [i, leg] of path.legs) {
            accumulator += leg.distance;

            if (accumulator > distanceFromEnd) {
                const distanceFromEndOfLeg = distanceFromEnd - (accumulator - leg.distance);

                const lla = leg.getPseudoWaypointLocation(distanceFromEndOfLeg);

                if (lla) {
                    return [lla, distanceFromEndOfLeg, i];
                }

                return undefined;
            }
        }

        if (DEBUG) {
            console.error(`[FMS/PseudoWaypoints] ${distanceFromEnd.toFixed(2)}nm is larger than the total lateral path.`);
        }

        return undefined;
    }
}
