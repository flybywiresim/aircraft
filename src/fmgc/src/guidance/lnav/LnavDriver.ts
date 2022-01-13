import { LateralMode, VerticalMode } from '@shared/autopilot';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { MathUtils } from '@shared/MathUtils';
import { Geometry } from '@fmgc/guidance/Geometry';
import { Type1Transition } from '@fmgc/guidance/lnav/transitions/Type1';
import { GuidanceComponent } from '../GuidanceComponent';
import { ControlLaw } from '../ControlLaws';
import { GuidanceController } from '../GuidanceController';

export class LnavDriver implements GuidanceComponent {
    private guidanceController: GuidanceController;

    private lastAvail: boolean;

    private lastLaw: ControlLaw;

    private lastXTE: number;

    private lastTAE: number;

    private lastPhi: number;

    private ppos: LatLongAlt = new LatLongAlt();

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

        const geometry = this.guidanceController.currentActiveLegPathGeometry;

        if (geometry !== null) {
            const dtg = geometry.getDistanceToGo(this.ppos);

            const inboundTrans = geometry.transitions.get(0);
            const activeLeg = geometry.legs.get(1);
            const outboundTrans = geometry.transitions.get(1) instanceof Type1Transition ? geometry.transitions.get(1) as Type1Transition : null;

            let completeDisplayLegPathDtg;
            if (inboundTrans instanceof Type1Transition) {
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

            this.guidanceController.activeLegIndex = activeLeg.indexInFullPath;
            this.guidanceController.activeLegDtg = dtg;
            this.guidanceController.activeLegCompleteLegPathDtg = completeLegPathDtg;
            this.guidanceController.displayActiveLegCompleteLegPathDtg = completeDisplayLegPathDtg;

            // Pseudo waypoint sequencing

            // FIXME when we have a path model, we don't have to do any of this business ?
            // FIXME see PseudoWaypoints.ts:153 for why we also allow the previous leg
            const pseudoWaypointsOnActiveLeg = this.guidanceController.currentPseudoWaypoints
                .filter((it) => it.alongLegIndex === activeLeg.indexInFullPath || it.alongLegIndex === activeLeg.indexInFullPath - 1);

            for (const pseudoWaypoint of pseudoWaypointsOnActiveLeg) {
            // FIXME as with the hack above, we use the dtg to the intermediate point of the transition instead of
            // completeLegPathDtg, since we are pretending the previous leg is still active
                let dtgToUse;
                if (inboundTrans instanceof Type1Transition && pseudoWaypoint.alongLegIndex === activeLeg.indexInFullPath - 1) {
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
            const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

            const params = geometry.getGuidanceParameters(this.ppos, trueTrack, gs);

            if (this.lastLaw !== params.law) {
                this.lastLaw = params.law;

                SimVar.SetSimVarValue('L:A32NX_FG_CURRENT_LATERAL_LAW', 'number', params.law);
            }

            if (params) {
                switch (params.law) {
                case ControlLaw.LATERAL_PATH:
                    const {
                        crossTrackError,
                        trackAngleError,
                        phiCommand,
                    } = params;

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
                    const { heading } = params;

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

                    if (deltaHeading !== this.lastTAE) {
                        SimVar.SetSimVarValue('L:A32NX_FG_TRACK_ANGLE_ERROR', 'degree', deltaHeading);
                        this.lastTAE = deltaHeading;
                    }

                    if (this.lastPhi !== 0) {
                        SimVar.SetSimVarValue('L:A32NX_FG_PHI_COMMAND', 'degree', 0);
                        this.lastPhi = 0;
                    }

                    break;
                default:
                    throw new Error(`Invalid control law: ${params.law}`);
                }

                available = true;
            }

            SimVar.SetSimVarValue('L:A32NX_GPS_WP_DISTANCE', 'nautical miles', dtg);

            if (!this.guidanceController.flightPlanManager.isActiveWaypointAtEnd(false, false, 0) && geometry.shouldSequenceLeg(this.ppos)) {
                const currentLeg = activeLeg;
                const nextLeg = geometry.legs.get(2);

                // FIXME we should stop relying on discos in the wpt objects, but for now it's fiiiiiine
                // Hard-coded check for TF leg after the disco for now - only case where we don't wanna
                // sequence this way is VM
                if (currentLeg instanceof TFLeg && currentLeg.to.endsInDiscontinuity && nextLeg instanceof TFLeg) {
                    this.sequenceDiscontinuity(currentLeg);
                } else {
                    this.sequenceLeg(currentLeg);
                    SimVar.SetSimVarValue('L:A32NX_FG_RAD', 'number', -1);
                    SimVar.SetSimVarValue('L:A32NX_FG_DTG', 'number', -1);
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
        }
    }

    sequenceLeg(_leg?: Leg): void {
        let wpIndex = this.guidanceController.flightPlanManager.getActiveWaypointIndex(false, false, 0);
        const wp = this.guidanceController.flightPlanManager.getActiveWaypoint(false, false, 0);
        console.log(`[FMGC/Guidance] LNAV - sequencing leg. [WP: ${wp.ident} Active WP Index: ${wpIndex}]`);
        wp.waypointReachedAt = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

        this.guidanceController.flightPlanManager.setActiveWaypointIndex(++wpIndex, () => {}, 0);
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

        this.sequenceLeg(_leg);
    }

    sequenceManual(_leg?: Leg): void {
        console.log('[FMGC/Guidance] LNAV - sequencing MANUAL');
    }
}
