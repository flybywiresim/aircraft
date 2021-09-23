import { LateralMode, VerticalMode } from '@shared/autopilot';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { Leg } from '@fmgc/guidance/lnav/legs';
import { MathUtils } from '@shared/MathUtils';
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

    update(_deltaTime: number): void {
        let available = false;

        /* Run sequencing */

        const geometry = this.guidanceController.guidanceManager.getActiveLegPathGeometry();

        if (geometry !== null) {
            // TODO FIXME: Use ADIRS
            this.ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
            this.ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

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

            SimVar.SetSimVarValue('L:A32NX_GPS_WP_DISTANCE', 'nautical miles', geometry.getDistanceToGo(this.ppos));

            if (!this.guidanceController.flightPlanManager.isActiveWaypointAtEnd(false, false, 0) && geometry.shouldSequenceLeg(this.ppos)) {
                const currentLeg = geometry.legs.get(1);
                const nextLeg = geometry.legs.get(2);

                // FIXME we should stop relying on discos in the wpt objects, but for now it's fiiiiiine
                // Hard-coded check for TF leg after the disco for now - only case where we don't wanna
                // sequence this way is VM
                if (currentLeg instanceof TFLeg && currentLeg.to.endsInDiscontinuity && nextLeg instanceof TFLeg) {
                    this.sequenceDiscontinuity(currentLeg);
                } else {
                    this.sequenceLeg(currentLeg);
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
        Coherent.call('PLAY_INSTRUMENT_SOUND', '3click');

        this.sequenceLeg(_leg);
    }

    sequenceManual(_leg?: Leg): void {
        console.log('[FMGC/Guidance] LNAV - sequencing MANUAL');
    }
}
