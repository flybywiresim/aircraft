import { GuidanceComponent } from '@fmgc/guidance/GuidanceComponent';
import { PseudoWaypoint } from '@fmgc/guidance/PsuedoWaypoint';
import { VnavConfig, VnavDescentMode } from '@fmgc/guidance/vnav/VnavConfig';
import { NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { Geometry } from '@fmgc/guidance/Geometry';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { NauticalMiles } from '../../../../../typings';

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
            const tod = PseudoWaypoints.findPointFromEndOfPath(geometry, this.guidanceController.vnavDriver.currentDescentProfile.tod);

            if (tod) {
                newPseudoWaypoints.push({
                    ident: PWP_IDENT_TOD,
                    alongLegIndex: tod[2],
                    distanceFromLegTermination: tod[1],
                    efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent,
                    efisSymbolLla: tod[0],
                    displayedOnMcdu: true,
                    stats: PseudoWaypoints.computePseudoWaypointStats(PWP_IDENT_TOD, geometry.legs.get(tod[2]), this.guidanceController.vnavDriver.currentDescentProfile.tod),
                });
            }
        }

        if (VnavConfig.VNAV_EMIT_DECEL) {
            const decel = PseudoWaypoints.findPointFromEndOfPath(geometry, this.guidanceController.vnavDriver.currentApproachProfile.decel);

            if (decel) {
                newPseudoWaypoints.push({
                    ident: PWP_IDENT_DECEL,
                    alongLegIndex: decel[2],
                    distanceFromLegTermination: decel[1],
                    efisSymbolFlag: NdSymbolTypeFlags.PwpDecel,
                    efisSymbolLla: decel[0],
                    displayedOnMcdu: true,
                    stats: PseudoWaypoints.computePseudoWaypointStats(PWP_IDENT_DECEL, geometry.legs.get(decel[2]), this.guidanceController.vnavDriver.currentApproachProfile.decel),
                });
            }
        }

        if (VnavConfig.VNAV_DESCENT_MODE === VnavDescentMode.CDA && VnavConfig.VNAV_EMIT_CDA_FLAP_PWP) {
            const flap1 = PseudoWaypoints.findPointFromEndOfPath(geometry, this.guidanceController.vnavDriver.currentApproachProfile.flap1);

            if (flap1) {
                newPseudoWaypoints.push({
                    ident: PWP_IDENT_FLAP1,
                    alongLegIndex: flap1[2],
                    distanceFromLegTermination: flap1[1],
                    efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap1,
                    efisSymbolLla: flap1[0],
                    displayedOnMcdu: true,
                    stats: PseudoWaypoints.computePseudoWaypointStats(PWP_IDENT_FLAP1, geometry.legs.get(flap1[2]), this.guidanceController.vnavDriver.currentApproachProfile.flap1),
                });
            }

            const flap2 = PseudoWaypoints.findPointFromEndOfPath(geometry, this.guidanceController.vnavDriver.currentApproachProfile.flap2);

            if (flap2) {
                newPseudoWaypoints.push({
                    ident: PWP_IDENT_FLAP2,
                    alongLegIndex: flap2[2],
                    distanceFromLegTermination: flap2[1],
                    efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap2,
                    efisSymbolLla: flap2[0],
                    displayedOnMcdu: true,
                    stats: PseudoWaypoints.computePseudoWaypointStats(PWP_IDENT_FLAP2, geometry.legs.get(flap2[2]), this.guidanceController.vnavDriver.currentApproachProfile.flap2),
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

    private static findPointFromEndOfPath(path: Geometry, distanceFromEnd: NauticalMiles): [lla: Coordinates, distanceFromLegTermination: number, legIndex: number] | undefined {
        let accumulator = 0;

        // FIXME take transitions into account on newer FMSs
        for (const [i, leg] of path.legs) {
            accumulator += leg.distance;

            if (accumulator > distanceFromEnd) {
                const distanceFromEndOfLeg = distanceFromEnd - (accumulator - leg.distance);

                return [leg.getPseudoWaypointLocation(distanceFromEndOfLeg), distanceFromEndOfLeg, i];
            }
        }

        if (DEBUG) {
            console.error(`[FMS/PseudoWaypoints] ${distanceFromEnd.toFixed(2)}nm is larger than the total lateral path.`);
        }

        return undefined;
    }
}
