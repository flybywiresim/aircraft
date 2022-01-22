// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ControlLaw, LateralMode, VerticalMode } from '@shared/autopilot';
import { MathUtils } from '@shared/MathUtils';
import { Geometry } from '@fmgc/guidance/Geometry';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { maxBank } from '@fmgc/guidance/lnav/CommonGeometry';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { PathCaptureTransition } from '@fmgc/guidance/lnav/transitions/PathCaptureTransition';
import { CourseCaptureTransition } from '@fmgc/guidance/lnav/transitions/CourseCaptureTransition';
import { TurnDirection } from '@fmgc/types/fstypes/FSEnums';
import { GuidanceConstants } from '@fmgc/guidance/GuidanceConstants';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceController } from '../GuidanceController';
import { GuidanceComponent } from '../GuidanceComponent';

/**
 * Represents the current turn state of the LNAV driver
 */
export enum LnavTurnState {
    /**
     * No turn direction is being forced
     */
    Normal,

    /**
     * A left turn is being forced using phi_command
     */
    ForceLeftTurn,

    /**
     * A right turn is being forced using phi_command
     */
    ForceRightTurn,
}

export class LnavDriver implements GuidanceComponent {
    private guidanceController: GuidanceController;

    private lastAvail: boolean;

    private lastLaw: ControlLaw;

    private lastXTE: number;

    private lastTAE: number;

    private lastPhi: number;

    public turnState = LnavTurnState.Normal;

    public ppos: LatLongAlt = new LatLongAlt();

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    constructor(guidanceController: GuidanceController) {
        this.guidanceController = guidanceController;
        this.lastAvail = null;
        this.lastLaw = null;
        this.lastXTE = null;
        this.lastTAE = null;
        this.lastPhi = null;
    }

    init(): void {
        console.log('[FMGC/Guidance] LnavDriver initialized!');
    }

    update(_: number): void {
        let available = false;

        this.ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        this.ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

        const geometry = this.guidanceController.activeGeometry;

        const activeLegIdx = this.guidanceController.activeLegIndex;

        if (geometry && geometry.legs.size > 0) {
            const dtg = geometry.getDistanceToGo(this.ppos);

            const inboundTrans = geometry.transitions.get(activeLegIdx - 1);
            const activeLeg = geometry.legs.get(activeLegIdx);
            const outboundTrans = geometry.transitions.get(activeLegIdx) ? geometry.transitions.get(activeLegIdx) : null;

            if (!activeLeg) {
                if (LnavConfig.DEBUG_GUIDANCE) {
                    console.log('[FMS/LNAV] No leg at activeLegIdx!');
                }

                return;
            }

            let completeDisplayLegPathDtg;
            if (inboundTrans instanceof FixedRadiusTransition && !inboundTrans.isNull) {
                if (inboundTrans.isAbeam(this.ppos)) {
                    const inboundHalfDistance = inboundTrans.distance / 2;
                    const inboundDtg = inboundTrans.getDistanceToGo(this.ppos);

                    if (inboundDtg > inboundHalfDistance) {
                        completeDisplayLegPathDtg = inboundDtg - inboundHalfDistance;
                    }
                }
            }

            const completeLegPathDtg = Geometry.completeLegPathDistanceToGo(
                this.ppos,
                activeLeg,
                inboundTrans,
                outboundTrans,
            );

            this.guidanceController.activeLegDtg = dtg;
            this.guidanceController.activeLegCompleteLegPathDtg = completeLegPathDtg;
            this.guidanceController.displayActiveLegCompleteLegPathDtg = completeDisplayLegPathDtg;

            // Update activeTransIndex in GuidanceController
            if (inboundTrans && inboundTrans.isAbeam(this.ppos)) {
                this.guidanceController.activeTransIndex = activeLegIdx - 1;
            } else if (outboundTrans && outboundTrans.isAbeam(this.ppos)) {
                this.guidanceController.activeTransIndex = activeLegIdx;
            }

            // Pseudo waypoint sequencing

            // FIXME when we have a path model, we don't have to do any of this business ?
            // FIXME see PseudoWaypoints.ts:153 for why we also allow the previous leg
            const pseudoWaypointsOnActiveLeg = this.guidanceController.currentPseudoWaypoints
                .filter((it) => it.alongLegIndex === activeLegIdx || it.alongLegIndex === activeLegIdx - 1);

            for (const pseudoWaypoint of pseudoWaypointsOnActiveLeg) {
            // FIXME as with the hack above, we use the dtg to the intermediate point of the transition instead of
            // completeLegPathDtg, since we are pretending the previous leg is still active
                let dtgToUse;
                if (inboundTrans instanceof FixedRadiusTransition && pseudoWaypoint.alongLegIndex === activeLegIdx - 1) {
                    const inboundHalfDistance = inboundTrans.distance / 2;
                    const inboundDtg = inboundTrans.getDistanceToGo(this.ppos);

                    if (inboundDtg > inboundHalfDistance) {
                        dtgToUse = inboundDtg - inboundHalfDistance;
                    } else {
                        dtgToUse = completeLegPathDtg;
                    }
                } else {
                    dtgToUse = completeLegPathDtg;
                }

                if (pseudoWaypoint.distanceFromLegTermination >= dtgToUse) {
                    this.guidanceController.sequencePseudoWaypoint(pseudoWaypoint);
                }
            }

            // Leg sequencing

            // TODO FIXME: Use FM position

            const trueTrack = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree');

            // this is not the correct groundspeed to use, but it will suffice for now
            const tas = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');
            const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

            const params = geometry.getGuidanceParameters(activeLegIdx, this.ppos, trueTrack, gs, tas);

            if (params) {
                if (this.lastLaw !== params.law) {
                    this.lastLaw = params.law;

                    SimVar.SetSimVarValue('L:A32NX_FG_CURRENT_LATERAL_LAW', 'number', params.law);
                }

                // Send bank limit to FG
                const bankLimit = maxBank(tas, /* FIXME */ true);

                SimVar.SetSimVarValue('L:A32NX_FG_PHI_LIMIT', 'Degrees', bankLimit);

                switch (params.law) {
                case ControlLaw.LATERAL_PATH:
                    let {
                        crossTrackError,
                        trackAngleError,
                        phiCommand,
                    } = params;

                    // Update and take into account turn state; only guide using phi during a forced turn

                    if (this.turnState !== LnavTurnState.Normal) {
                        if (Math.abs(trackAngleError) < GuidanceConstants.FORCED_TURN_TKAE_THRESHOLD) {
                            // Stop forcing turn
                            this.turnState = LnavTurnState.Normal;
                        }

                        const forcedTurnPhi = this.turnState === LnavTurnState.ForceLeftTurn ? -maxBank(tas, true) : maxBank(tas, true);

                        crossTrackError = 0;
                        trackAngleError = 0;
                        phiCommand = forcedTurnPhi;
                    }

                    // Set FG inputs

                    if (!this.lastAvail) {
                        SimVar.SetSimVarValue('L:A32NX_FG_AVAIL', 'Bool', true);
                        this.lastAvail = true;
                    }

                    if (crossTrackError !== this.lastXTE) {
                        SimVar.SetSimVarValue('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', crossTrackError);
                        this.lastXTE = crossTrackError;
                    }

                    if (trackAngleError !== this.lastTAE) {
                        SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', trackAngleError);
                        this.lastTAE = trackAngleError;
                    }

                    if (phiCommand !== this.lastPhi) {
                        SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', phiCommand);
                        this.lastPhi = phiCommand;
                    }

                    break;
                case ControlLaw.HEADING:
                    const { heading, phiCommand: forcedPhiHeading } = params;

                    if (!this.lastAvail) {
                        SimVar.SetSimVarValue('L:A32NX_FG_AVAIL', 'Bool', true);
                        this.lastAvail = true;
                    }

                    if (this.lastXTE !== 0) {
                        SimVar.SetSimVarValue('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', 0);
                        this.lastXTE = 0;
                    }

                    // Track Angle Error
                    const currentHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'Degrees');
                    const deltaHeading = MathUtils.diffAngle(currentHeading, heading);

                    // Update and take into account turn state; only guide using phi during a forced turn

                    if (this.turnState !== LnavTurnState.Normal) {
                        if (Math.abs(deltaHeading) < GuidanceConstants.FORCED_TURN_TKAE_THRESHOLD) {
                            // Stop forcing turn
                            this.turnState = LnavTurnState.Normal;
                        }

                        const forcedTurnPhi = this.turnState === LnavTurnState.ForceLeftTurn ? -maxBank(tas, true) : maxBank(tas, true);

                        if (forcedTurnPhi !== this.lastPhi) {
                            SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', forcedTurnPhi);
                            this.lastPhi = forcedTurnPhi;
                        }

                        if (this.lastTAE !== 0) {
                            SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', 0);
                            this.lastTAE = 0;
                        }
                    } else {
                        if (deltaHeading !== this.lastTAE) {
                            SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', deltaHeading);
                            this.lastTAE = deltaHeading;
                        }

                        if (forcedPhiHeading !== undefined) {
                            if (forcedPhiHeading !== this.lastPhi) {
                                SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', forcedPhiHeading);
                                this.lastPhi = forcedPhiHeading;
                            }
                        } else if (this.lastPhi !== 0) {
                            SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', 0);
                            this.lastPhi = 0;
                        }
                    }

                    break;
                case ControlLaw.TRACK:
                    const { course, phiCommand: forcedPhiCourse } = params;

                    if (!this.lastAvail) {
                        SimVar.SetSimVarValue('L:A32NX_FG_AVAIL', 'Bool', true);
                        this.lastAvail = true;
                    }

                    if (this.lastXTE !== 0) {
                        SimVar.SetSimVarValue('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', 0);
                        this.lastXTE = 0;
                    }

                    const deltaCourse = MathUtils.diffAngle(trueTrack, course);

                    if (this.turnState !== LnavTurnState.Normal) {
                        if (Math.abs(deltaCourse) < GuidanceConstants.FORCED_TURN_TKAE_THRESHOLD) {
                            // Stop forcing turn
                            this.turnState = LnavTurnState.Normal;
                        }

                        const forcedTurnPhi = this.turnState === LnavTurnState.ForceLeftTurn ? -maxBank(tas, true) : maxBank(tas, true);

                        if (forcedTurnPhi !== this.lastPhi) {
                            SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', forcedTurnPhi);
                            this.lastPhi = forcedTurnPhi;
                        }

                        if (this.lastTAE !== 0) {
                            SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', 0);
                            this.lastTAE = 0;
                        }
                    } else {
                        if (deltaCourse !== this.lastTAE) {
                            SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', deltaCourse);
                            this.lastTAE = deltaCourse;
                        }

                        if (forcedPhiCourse !== undefined) {
                            if (forcedPhiCourse !== this.lastPhi) {
                                SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', forcedPhiCourse);
                                this.lastPhi = forcedPhiCourse;
                            }
                        } else if (this.lastPhi !== 0) {
                            SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', 0);
                            this.lastPhi = 0;
                        }
                    }
                    break;
                default:
                    break;
                }

                available = true;
            } else if (DEBUG) {
                console.error('[FMS/LNAV] Guidance parameters from geometry are null.');
            }

            if (LnavConfig.DEBUG_GUIDANCE) {
                SimVar.SetSimVarValue('L:A32NX_FM_TURN_STATE', 'Enum', this.turnState);
            }

            SimVar.SetSimVarValue('L:A32NX_GPS_WP_DISTANCE', 'nautical miles', dtg ?? 0);

            // Update EFIS active waypoint info

            this.updateEfisData(activeLeg, gs);

            // Sequencing

            let canSequence = true;
            if (params.law === ControlLaw.LATERAL_PATH) {
                canSequence = Math.abs(params.crossTrackError) < 7 && Math.abs(params.trackAngleError) < 90;
            }

            if (!activeLeg.disableAutomaticSequencing && canSequence && geometry.shouldSequenceLeg(activeLegIdx, this.ppos)) {
                const currentLeg = activeLeg;
                const outboundTransition = geometry.transitions.get(activeLegIdx);
                const nextLeg = geometry.legs.get(activeLegIdx + 1);

                if (nextLeg) {
                    // FIXME we should stop relying on discos in the wpt objects, but for now it's fiiiiiine
                    // Hard-coded check for TF leg after the disco for now - only case where we don't wanna
                    // sequence this way is VM
                    if (currentLeg instanceof XFLeg && currentLeg.fix.endsInDiscontinuity) {
                        this.sequenceDiscontinuity(currentLeg);
                    } else {
                        this.sequenceLeg(currentLeg, outboundTransition);
                    }
                }
            }
        }

        /* Set FG parameters */

        if (!available && this.lastAvail !== false) {
            SimVar.SetSimVarValue('L:A32NX_FG_AVAIL', 'Bool', false);
            SimVar.SetSimVarValue('L:A32NX_FG_CROSS_TRACK_ERROR', 'nautical miles', 0);
            SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', 0);
            SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', 0);

            this.lastAvail = false;
            this.lastTAE = null;
            this.lastXTE = null;
            this.lastPhi = null;
            this.turnState = LnavTurnState.Normal;
        }
    }

    /**
     * Updates the EFIS TO WPT data
     *
     * @param activeLeg currently active display leg
     * @param gs        current ground speed in knots
     *
     * @private
     */
    private updateEfisData(activeLeg: Leg, gs: Knots) {
        const termination = activeLeg instanceof XFLeg ? activeLeg.fix.infos.coordinates : activeLeg.getPathEndPoint();

        const efisBearing = Avionics.Utils.computeGreatCircleHeading(this.ppos, termination);

        // Don't compute distance and ETA for XM legs
        const efisDistance = activeLeg instanceof VMLeg ? null : Avionics.Utils.computeGreatCircleDistance(this.ppos, termination);
        const efisEta = activeLeg instanceof VMLeg ? null : LnavDriver.legEta(this.ppos, gs, termination);

        // FIXME should be NCD if no FM position

        SimVar.SetSimVarValue('L:A32NX_EFIS_L_TO_WPT_BEARING', 'Degrees', efisBearing);
        SimVar.SetSimVarValue('L:A32NX_EFIS_L_TO_WPT_DISTANCE', 'Number', efisDistance);
        SimVar.SetSimVarValue('L:A32NX_EFIS_L_TO_WPT_ETA', 'Seconds', efisEta);

        SimVar.SetSimVarValue('L:A32NX_EFIS_R_TO_WPT_BEARING', 'Degrees', efisBearing);
        SimVar.SetSimVarValue('L:A32NX_EFIS_R_TO_WPT_DISTANCE', 'Number', efisDistance);
        SimVar.SetSimVarValue('L:A32NX_EFIS_R_TO_WPT_ETA', 'Seconds', efisEta);
    }

    private static legEta(ppos: Coordinates, gs: Knots, termination: Coordinates): number {
        // FIXME use a more accurate estimate, calculate in predictions

        const UTC_SECONDS = Math.floor(SimVar.GetGlobalVarValue('ZULU TIME', 'seconds'));

        const nauticalMilesToGo = Avionics.Utils.computeGreatCircleDistance(ppos, termination);
        const secondsToGo = (nauticalMilesToGo / Math.max(LnavConfig.DEFAULT_MIN_PREDICTED_TAS, gs)) * 3600;

        const eta = (UTC_SECONDS + secondsToGo) % (3600 * 24);

        return eta;
    }

    sequenceLeg(_leg?: Leg, outboundTransition?: Transition): void {
        let wpIndex = this.guidanceController.flightPlanManager.getActiveWaypointIndex(false, false, 0);
        const wp = this.guidanceController.flightPlanManager.getActiveWaypoint(false, false, 0);
        console.log(`[FMGC/Guidance] LNAV - sequencing leg. [WP: ${wp.ident} Active WP Index: ${wpIndex}]`);
        wp.waypointReachedAt = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

        this.guidanceController.flightPlanManager.setActiveWaypointIndex(++wpIndex, () => {}, 0);

        outboundTransition?.freeze();

        // Set turn state based on turn direction
        if (outboundTransition && (outboundTransition instanceof PathCaptureTransition || outboundTransition instanceof CourseCaptureTransition)) {
            if (outboundTransition.turnDirection === TurnDirection.Left) {
                this.turnState = LnavTurnState.ForceLeftTurn;
            } else if (outboundTransition.turnDirection === TurnDirection.Right) {
                this.turnState = LnavTurnState.ForceRightTurn;
            } else {
                // Just to be safe
                this.turnState = LnavTurnState.Normal;
            }
        } else {
            this.turnState = LnavTurnState.Normal;
        }
    }

    sequenceDiscontinuity(_leg?: Leg): void {
        console.log('[FMGC/Guidance] LNAV - sequencing discontinuity');

        // Lateral mode is NAV
        const lateralModel = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Enum');
        const verticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum');

        if (lateralModel === LateralMode.NAV) {
            // Set HDG (current heading)
            SimVar.SetSimVarValue('H:A320_Neo_FCU_HDG_PULL', 'number', 0);
            SimVar.SetSimVarValue('L:A32NX_AUTOPILOT_HEADING_SELECTED', 'number', Simplane.getHeadingMagnetic());
        }

        // Vertical mode is DES, OP DES, CLB or OP CLB
        if (verticalMode === VerticalMode.DES || verticalMode === VerticalMode.OP_DES
            || verticalMode === VerticalMode.CLB || verticalMode === VerticalMode.OP_CLB
        ) {
            // Set V/S
            SimVar.SetSimVarValue('H:A320_Neo_FCU_VS_PULL', 'number', 0);
        }

        // Triple click
        Coherent.call('PLAY_INSTRUMENT_SOUND', '3click').catch(console.error);

        this.sequenceLeg(_leg, null);
    }

    sequenceManual(_leg?: Leg): void {
        console.log('[FMGC/Guidance] LNAV - sequencing MANUAL');
    }
}
