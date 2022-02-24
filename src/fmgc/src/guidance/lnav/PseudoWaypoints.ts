import { GuidanceComponent } from '@fmgc/guidance/GuidanceComponent';
import { PseudoWaypoint, PseudoWaypointSequencingAction } from '@fmgc/guidance/PsuedoWaypoint';
import { VnavConfig, VnavDescentMode } from '@fmgc/guidance/vnav/VnavConfig';
import { NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { Geometry } from '@fmgc/guidance/Geometry';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { WaypointStats } from '@fmgc/flightplanning/data/flightplan';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { LateralMode } from '@shared/autopilot';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';

const PWP_IDENT_TOD = '(T/D)';
const PWP_IDENT_DECEL = '(DECEL)';
const PWP_IDENT_FLAP1 = '(FLAP1)';
const PWP_IDENT_FLAP2 = '(FLAP2)';

export class PseudoWaypoints implements GuidanceComponent {
    pseudoWaypoints: PseudoWaypoint[] = [];

    constructor(private guidanceController: GuidanceController) { }

    acceptVerticalProfile() {
        if (DEBUG) {
            console.log('[FMS/PWP] Computed new pseudo waypoints because of new vertical profile.');
        }
        this.recompute();
    }

    acceptMultipleLegGeometry(_geometry: Geometry) {
        if (DEBUG) {
            console.log('[FMS/PWP] Computed new pseudo waypoints because of new lateral geometry.');
        }
        this.recompute();
    }

    private recompute() {
        const geometry = this.guidanceController.activeGeometry;
        const wptCount = this.guidanceController.flightPlanManager.getWaypointsCount();

        if (!geometry || geometry.legs.size < 1) {
            this.pseudoWaypoints.length = 0;
            return;
        }

        const newPseudoWaypoints: PseudoWaypoint[] = [];

        if (VnavConfig.VNAV_EMIT_TOD) {
            const tod = PseudoWaypoints.pointFromEndOfPath(geometry, wptCount, this.guidanceController.vnavDriver.currentDescentProfile.tod, DEBUG && PWP_IDENT_TOD);

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
            const decel = PseudoWaypoints.pointFromEndOfPath(geometry, wptCount, this.guidanceController.vnavDriver.currentApproachProfile.decel, DEBUG && PWP_IDENT_DECEL);

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

            // for (let i = 0; i < 75; i++) {
            //     const point = PseudoWaypoints.pointFromEndOfPath(geometry, this.guidanceController.vnavDriver.currentApproachProfile.decel + i / 2, `(BRUH${i}`);
            //
            //     if (point) {
            //         const [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = point;
            //
            //         newPseudoWaypoints.push({
            //             ident: `(BRUH${i})`,
            //             sequencingType: PseudoWaypointSequencingAction.TOD_REACHED,
            //             alongLegIndex,
            //             distanceFromLegTermination,
            //             efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent,
            //             efisSymbolLla,
            //             displayedOnMcdu: true,
            //             stats: PseudoWaypoints.computePseudoWaypointStats(`(BRUH${i})`, geometry.legs.get(alongLegIndex), distanceFromLegTermination),
            //         });
            //     }
            // }
        }

        if (VnavConfig.VNAV_DESCENT_MODE === VnavDescentMode.CDA && VnavConfig.VNAV_EMIT_CDA_FLAP_PWP) {
            const flap1 = PseudoWaypoints.pointFromEndOfPath(geometry, wptCount, this.guidanceController.vnavDriver.currentApproachProfile.flap1, DEBUG && PWP_IDENT_FLAP1);

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

            const flap2 = PseudoWaypoints.pointFromEndOfPath(geometry, wptCount, this.guidanceController.vnavDriver.currentApproachProfile.flap2, DEBUG && PWP_IDENT_FLAP2);

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

    update(_: number) {
        // Pass our pseudo waypoints to the GuidanceController
        this.guidanceController.currentPseudoWaypoints.length = 0;

        let idx = 0;
        for (const pseudoWaypoint of this.pseudoWaypoints) {
            const onPreviousLeg = pseudoWaypoint.alongLegIndex === this.guidanceController.activeLegIndex - 1;
            const onActiveLeg = pseudoWaypoint.alongLegIndex === this.guidanceController.activeLegIndex;
            const afterActiveLeg = pseudoWaypoint.alongLegIndex > this.guidanceController.activeLegIndex;

            // TODO we also consider the previous leg as active because we sequence Type I transitions at the same point
            // for both guidance and legs list. IRL, the display sequences after the guidance, which means the pseudo-waypoints
            // on the first half of the transition are considered on the active leg, whereas without this hack they are
            // on the previous leg by the time we try to re-add them to the list.

            // We only want to add the pseudo waypoint if it's after the active leg or it isn't yet passed
            if (
                afterActiveLeg
                || (onPreviousLeg && this.guidanceController.displayActiveLegCompleteLegPathDtg > pseudoWaypoint.distanceFromLegTermination)
                || (onActiveLeg && this.guidanceController.activeLegCompleteLegPathDtg > pseudoWaypoint.distanceFromLegTermination)
            ) {
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
    sequencePseudoWaypoint(pseudoWaypoint: PseudoWaypoint): void {
        if (true) {
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

    private static pointFromEndOfPath(
        path: Geometry,
        wptCount: number,
        distanceFromEnd: NauticalMiles,
        debugString?: string,
    ): [lla: Coordinates, distanceFromLegTermination: number, legIndex: number] | undefined {
        if (distanceFromEnd < 0) {
            throw new Error('[FMS/PWP](pointFromEndOfPath) distanceFromEnd was negative');
        }

        let accumulator = 0;

        if (false) {
            console.log(`[FMS/PWP] Starting placement of PWP '${debugString}': dist: ${distanceFromEnd.toFixed(2)}nm`);
        }

        for (let i = wptCount - 1; i > 0; i--) {
            const leg = path.legs.get(i);

            if (!leg) {
                continue;
            }

            const inboundTrans = path.transitions.get(i - 1);
            const outboundTrans = path.transitions.get(i);

            const [inboundTransLength, legPartLength, outboundTransLength] = Geometry.completeLegPathLengths(
                leg,
                inboundTrans,
                (outboundTrans instanceof FixedRadiusTransition) ? outboundTrans : null,
            );

            const totalLegPathLength = inboundTransLength + legPartLength + outboundTransLength;
            accumulator += totalLegPathLength;

            if (DEBUG) {
                const inb = inboundTransLength.toFixed(2);
                const legd = legPartLength.toFixed(2);
                const outb = outboundTransLength.toFixed(2);
                const acc = accumulator.toFixed(2);

                console.log(`[FMS/PWP] Trying to place PWP '${debugString}' ${distanceFromEnd.toFixed(2)} along leg #${i}; inb: ${inb}, leg: ${legd}, outb: ${outb}, acc: ${acc}`);
            }

            if (accumulator > distanceFromEnd) {
                const distanceFromEndOfLeg = distanceFromEnd - (accumulator - totalLegPathLength);

                let lla;
                if (distanceFromEndOfLeg < outboundTransLength) {
                    // Point is in outbound transition segment
                    const distanceBeforeTerminator = (outboundTrans.distance / 2) + distanceFromEndOfLeg;

                    if (DEBUG) {
                        console.log(`[FMS/PWP] Placed PWP '${debugString}' on leg #${i} outbound segment (${distanceFromEndOfLeg.toFixed(2)}nm before end)`);
                    }

                    lla = outboundTrans.getPseudoWaypointLocation(distanceBeforeTerminator);
                } else if (distanceFromEndOfLeg >= outboundTransLength && distanceFromEndOfLeg < (outboundTransLength + legPartLength)) {
                    // Point is in leg segment
                    const distanceBeforeTerminator = distanceFromEndOfLeg - outboundTransLength;

                    if (DEBUG) {
                        console.log(`[FMS/PWP] Placed PWP '${debugString}' on leg #${i} leg segment (${distanceBeforeTerminator.toFixed(2)}nm before end)`);
                    }

                    lla = leg.getPseudoWaypointLocation(distanceBeforeTerminator);
                } else {
                    // Point is in inbound transition segment
                    const distanceBeforeTerminator = distanceFromEndOfLeg - outboundTransLength - legPartLength;

                    if (DEBUG) {
                        console.log(`[FMS/PWP] Placed PWP '${debugString}' on leg #${i} inbound segment (${distanceBeforeTerminator.toFixed(2)}nm before end)`);
                    }

                    lla = inboundTrans.getPseudoWaypointLocation(distanceBeforeTerminator);
                }

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
