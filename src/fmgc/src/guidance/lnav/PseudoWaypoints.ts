// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceComponent } from '@fmgc/guidance/GuidanceComponent';
import { PseudoWaypoint, PseudoWaypointSequencingAction } from '@fmgc/guidance/PseudoWaypoint';
import { VnavConfig, VnavDescentMode } from '@fmgc/guidance/vnav/VnavConfig';
import { NdSymbolTypeFlags } from '@shared/NavigationDisplay';
import { Geometry } from '@fmgc/guidance/Geometry';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { LateralMode } from '@shared/autopilot';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { TimeUtils } from '@fmgc/utils/TimeUtils';

const PWP_IDENT_CLIMB_CONSTRAINT_LEVEL_OFF = 'Level off for climb constraint';
const PWP_IDENT_CONTINUE_CLIMB = 'Continue climb';
const PWP_SPEED_CHANGE = 'Speed change';
const PWP_IDENT_TOC = '(T/C)';
const PWP_IDENT_STEP_CLIMB = '(S/C)';
const PWP_IDENT_STEP_DESCENT = '(S/D)';
const PWP_IDENT_SPD_LIM = '(LIM)';
const PWP_IDENT_TOD = '(T/D)';
const PWP_IDENT_DECEL = '(DECEL)';
const PWP_IDENT_FLAP1 = '(FLAP1)';
const PWP_IDENT_FLAP2 = '(FLAP2)';

const CHECKPOINT_REASONS_BEFORE_FCU_ALT_FOR_PWP: VerticalCheckpointReason[] = [
    VerticalCheckpointReason.LevelOffForClimbConstraint,
    VerticalCheckpointReason.ContinueClimb,
    VerticalCheckpointReason.CrossingClimbSpeedLimit,
    VerticalCheckpointReason.CrossingFcuAltitudeClimb,
];

const CHECKPOINT_REASONS_FOR_PWP: VerticalCheckpointReason[] = [
    ...CHECKPOINT_REASONS_BEFORE_FCU_ALT_FOR_PWP,
    VerticalCheckpointReason.CrossingFcuAltitudeClimb,
    VerticalCheckpointReason.TopOfClimb,
    VerticalCheckpointReason.StepClimb,
    VerticalCheckpointReason.StepDescent,
    VerticalCheckpointReason.TopOfDescent,
    VerticalCheckpointReason.CrossingFcuAltitudeDescent,
    VerticalCheckpointReason.CrossingDescentSpeedLimit,
    VerticalCheckpointReason.LevelOffForDescentConstraint,
    VerticalCheckpointReason.InterceptDescentProfileManaged,
    VerticalCheckpointReason.InterceptDescentProfileSelected,
    VerticalCheckpointReason.Decel,
];

const CDA_CHECKPOINT_FOR_PWP: Set<VerticalCheckpointReason> = new Set([
    VerticalCheckpointReason.Flaps1,
    VerticalCheckpointReason.Flaps2,
]);

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
        const navGeometryProfile = this.guidanceController.vnavDriver.currentNavGeometryProfile;
        const ndGeometryProfile = this.guidanceController.vnavDriver.currentNdGeometryProfile;

        const totalDistance = navGeometryProfile.totalFlightPlanDistance;

        const shouldEmitCdaPwp = VnavConfig.VNAV_DESCENT_MODE === VnavDescentMode.CDA && VnavConfig.VNAV_EMIT_CDA_FLAP_PWP;

        // We do this so we only draw the first of each waypoint type
        const waypointsLeftToDraw = new Set(CHECKPOINT_REASONS_FOR_PWP);

        for (const checkpoint of [...navGeometryProfile.getCheckpointsInMcdu(), ...ndGeometryProfile.getCheckpointsToDrawOnNd()]) {
            if (!waypointsLeftToDraw.has(checkpoint.reason) && (!CDA_CHECKPOINT_FOR_PWP.has(checkpoint.reason) || !shouldEmitCdaPwp)) {
                continue;
            }

            // Do not draw climb PWP past the FCU altitude
            if (!waypointsLeftToDraw.has(VerticalCheckpointReason.CrossingFcuAltitudeClimb) && CHECKPOINT_REASONS_BEFORE_FCU_ALT_FOR_PWP.includes(checkpoint.reason)) {
                continue;
            }

            waypointsLeftToDraw.delete(checkpoint.reason);

            if (checkpoint.distanceFromStart < 0) {
                continue;
            }

            const pwp = this.createPseudoWaypointFromVerticalCheckpoint(geometry, wptCount, totalDistance, checkpoint);
            if (pwp) {
                newPseudoWaypoints.push(pwp);
            }
        }

        // Speed Changes
        const firstSpeedChange = ndGeometryProfile.findDistancesToSpeedChanges()[0];

        if (firstSpeedChange) {
            let [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = [undefined, undefined, undefined];
            if (this.guidanceController.vnavDriver.isInManagedNav()) {
                const pwp = PseudoWaypoints.pointFromEndOfPath(geometry, wptCount, totalDistance - firstSpeedChange);

                if (pwp) {
                    [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = pwp;
                }
            }

            newPseudoWaypoints.push({
                ident: PWP_SPEED_CHANGE,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpSpeedChange | NdSymbolTypeFlags.MagentaColor,
                efisSymbolLla,
                distanceFromStart: firstSpeedChange,
                displayedOnMcdu: false,
                displayedOnNd: true,
            });
        }

        // Time Markers
        for (const [time, prediction] of this.guidanceController.vnavDriver.timeMarkers.entries()) {
            if (!this.guidanceController.vnavDriver.isInManagedNav() || !prediction) {
                continue;
            }

            const position = PseudoWaypoints.pointFromEndOfPath(geometry, wptCount, totalDistance - prediction.distanceFromStart, `TIME ${time}`);

            if (position) {
                const [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = position;

                const ident = TimeUtils.formatSeconds(time);

                newPseudoWaypoints.push({
                    ident,
                    alongLegIndex,
                    distanceFromLegTermination,
                    efisSymbolFlag: NdSymbolTypeFlags.PwpTimeMarker,
                    efisSymbolLla,
                    distanceFromStart: prediction.distanceFromStart,
                    displayedOnMcdu: true,
                    mcduIdent: `(${TimeUtils.formatSeconds(time, false)})`,
                    mcduHeader: '{white}{big}(UTC){end}{end}',
                    flightPlanInfo: {
                        ...prediction,
                        distanceFromLastFix: PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination),
                    },
                    displayedOnNd: true,
                });
            }
        }

        if (VnavConfig.DEBUG_PROFILE) {
            const debugPoint = this.createDebugPwp(geometry, wptCount, totalDistance);
            if (debugPoint) {
                newPseudoWaypoints.push(debugPoint);
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
            const inSelectedHdg = !this.guidanceController.vnavDriver.isInManagedNav();

            // TODO we also consider the previous leg as active because we sequence Type I transitions at the same point
            // for both guidance and legs list. IRL, the display sequences after the guidance, which means the pseudo-waypoints
            // on the first half of the transition are considered on the active leg, whereas without this hack they are
            // on the previous leg by the time we try to re-add them to the list.

            // We only want to add the pseudo waypoint if it's after the active leg or it isn't yet passed
            if (
                inSelectedHdg
                || afterActiveLeg
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
        case PseudoWaypointSequencingAction.STEP_REACHED:
            // Since you cannot have steps behind you, the one getting sequenced should always be the first one
            this.guidanceController.vnavDriver.stepCoordinator.removeStep(0);
            break;
        default:
        }
    }

    /**
     * Computes a the distance between the fix before the PWP and the PWP
     *
     * @param leg               the leg along which this pseudo waypoint is situated
     * @param distanceAlongLeg  the distance from the termination of the leg to this pseudo waypoint
     *
     * @private
     */
    private static computePseudoWaypointDistanceFromFix(leg: Leg, distanceAlongLeg: number): NauticalMiles {
        return leg.distance - distanceAlongLeg;
    }

    private static pointFromEndOfPath(
        path: Geometry,
        wptCount: number,
        distanceFromEnd: NauticalMiles,
        debugString?: string,
    ): [lla: Coordinates, distanceFromLegTermination: number, legIndex: number] | undefined {
        if (!distanceFromEnd || distanceFromEnd < 0) {
            if (VnavConfig.DEBUG_PROFILE) {
                console.warn('[FMS/PWP](pointFromEndOfPath) distanceFromEnd was negative or undefined');
            }

            return undefined;
        }

        let accumulator = 0;

        if (DEBUG) {
            console.log(`[FMS/PWP] Starting placement of PWP '${debugString}': dist: ${distanceFromEnd.toFixed(2)}nm`);
        }

        for (let i = wptCount - 1; i > 0; i--) {
            const leg = path.legs.get(i);

            if (!leg || leg.isNull) {
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

                console.error(`[FMS/PseudoWaypoints] Tried to place PWP ${debugString} on ${leg.repr}, but failed`);
                return undefined;
            }
        }

        if (DEBUG) {
            console.error(`[FMS/PseudoWaypoints] ${distanceFromEnd.toFixed(2)}nm is larger than the total lateral path.`);
        }

        return undefined;
    }

    private createPseudoWaypointFromVerticalCheckpoint(geometry: Geometry, wptCount: number, totalDistance: number, checkpoint: VerticalCheckpoint): PseudoWaypoint | undefined {
        let [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = [undefined, undefined, undefined];
        if (this.guidanceController.vnavDriver.isInManagedNav()) {
            const pwp = PseudoWaypoints.pointFromEndOfPath(geometry, wptCount, totalDistance - checkpoint?.distanceFromStart);

            if (pwp) {
                [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = pwp;
            } else {
                console.warn('[FMS/VNAV] Could not find place checkpoint:', checkpoint.reason);
            }
        }

        switch (checkpoint.reason) {
        case VerticalCheckpointReason.LevelOffForClimbConstraint:
            return {
                ident: PWP_IDENT_CLIMB_CONSTRAINT_LEVEL_OFF,
                efisSymbolFlag: NdSymbolTypeFlags.PwpClimbLevelOff | NdSymbolTypeFlags.MagentaColor,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: false,
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.ContinueClimb:
            return {
                ident: PWP_IDENT_CONTINUE_CLIMB,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpStartOfClimb | NdSymbolTypeFlags.CyanColor,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: false,
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.CrossingClimbSpeedLimit:
            return {
                ident: PWP_IDENT_SPD_LIM,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: 0, // Since this is not shown on the ND, it does not need a symbol
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: true,
                mcduHeader: '(SPD)',
                flightPlanInfo: {
                    ...checkpoint,
                    distanceFromLastFix: Number.isFinite(alongLegIndex)
                        ? PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination)
                        : 0,
                },
                displayedOnNd: false,
            };
        case VerticalCheckpointReason.CrossingDescentSpeedLimit:
            return {
                ident: PWP_IDENT_SPD_LIM,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: 0, // Since this is not shown on the ND, it does not need a symbol
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: true,
                mcduHeader: '(SPD)',
                flightPlanInfo: {
                    ...checkpoint,
                    distanceFromLastFix: Number.isFinite(alongLegIndex)
                        ? PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination)
                        : 0,
                },
                displayedOnNd: false,
            };
        case VerticalCheckpointReason.CrossingFcuAltitudeClimb:
            return {
                ident: 'FCU alt',
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpClimbLevelOff | NdSymbolTypeFlags.CyanColor,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: false,
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.TopOfClimb:
            return {
                ident: PWP_IDENT_TOC,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: 0,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: true,
                flightPlanInfo: {
                    ...checkpoint,
                    distanceFromLastFix: Number.isFinite(alongLegIndex)
                        ? PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination)
                        : 0,
                },
                displayedOnNd: false,
            };
        case VerticalCheckpointReason.StepClimb:
            return {
                ident: PWP_IDENT_STEP_CLIMB,
                sequencingType: PseudoWaypointSequencingAction.STEP_REACHED,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpStartOfClimb,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: true,
                flightPlanInfo: {
                    ...checkpoint,
                    distanceFromLastFix: Number.isFinite(alongLegIndex)
                        ? PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination)
                        : 0,
                },
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.StepDescent:
            return {
                ident: PWP_IDENT_STEP_DESCENT,
                sequencingType: PseudoWaypointSequencingAction.STEP_REACHED,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: true,
                flightPlanInfo: {
                    ...checkpoint,
                    distanceFromLastFix: Number.isFinite(alongLegIndex)
                        ? PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination)
                        : 0,
                },
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.TopOfDescent:
            return {
                ident: PWP_IDENT_TOD,
                sequencingType: PseudoWaypointSequencingAction.TOD_REACHED,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpTopOfDescent,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: true,
                flightPlanInfo: {
                    ...checkpoint,
                    distanceFromLastFix: Number.isFinite(alongLegIndex)
                        ? PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination)
                        : 0,
                },
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.CrossingFcuAltitudeDescent:
            return {
                ident: 'FCU alt',
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpDescentLevelOff | NdSymbolTypeFlags.CyanColor,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: false,
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.InterceptDescentProfileSelected:
            return {
                ident: 'Intercept',
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpInterceptProfile,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: false,
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.InterceptDescentProfileManaged:
            return {
                ident: 'Intercept',
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpInterceptProfile | NdSymbolTypeFlags.CyanColor,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: false,
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.Decel:
            return {
                ident: PWP_IDENT_DECEL,
                sequencingType: PseudoWaypointSequencingAction.APPROACH_PHASE_AUTO_ENGAGE,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpDecel | NdSymbolTypeFlags.MagentaColor,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: true,
                flightPlanInfo: {
                    ...checkpoint,
                    distanceFromLastFix: Number.isFinite(alongLegIndex)
                        ? PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination)
                        : 0,
                },
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.Flaps1:
            return {
                ident: PWP_IDENT_FLAP1,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap1,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: true,
                flightPlanInfo: {
                    ...checkpoint,
                    distanceFromLastFix: Number.isFinite(alongLegIndex)
                        ? PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination)
                        : 0,
                },
                displayedOnNd: true,
            };
        case VerticalCheckpointReason.Flaps2:
            return {
                ident: PWP_IDENT_FLAP2,
                alongLegIndex,
                distanceFromLegTermination,
                efisSymbolFlag: NdSymbolTypeFlags.PwpCdaFlap2,
                efisSymbolLla,
                distanceFromStart: checkpoint.distanceFromStart,
                displayedOnMcdu: true,
                flightPlanInfo: {
                    ...checkpoint,
                    distanceFromLastFix: Number.isFinite(alongLegIndex)
                        ? PseudoWaypoints.computePseudoWaypointDistanceFromFix(geometry.legs.get(alongLegIndex), distanceFromLegTermination)
                        : 0,
                },
                displayedOnNd: true,
            };
        default:
            return undefined;
        }
    }

    private createDebugPwp(geometry: Geometry, wptCount: number, totalDistance: number): PseudoWaypoint | null {
        const debugPoint = SimVar.GetSimVarValue('L:A32NX_FM_VNAV_DEBUG_POINT', 'number');
        const position = PseudoWaypoints.pointFromEndOfPath(geometry, wptCount, totalDistance - debugPoint);
        if (!position) {
            return null;
        }

        const [efisSymbolLla, distanceFromLegTermination, alongLegIndex] = position;

        return {
            ident: 'DEBUG_POINT',
            alongLegIndex,
            distanceFromLegTermination,
            efisSymbolFlag: NdSymbolTypeFlags.PwpSpeedChange | NdSymbolTypeFlags.CyanColor,
            efisSymbolLla,
            distanceFromStart: debugPoint,
            displayedOnMcdu: false,
            displayedOnNd: true,
        };
    }
}
