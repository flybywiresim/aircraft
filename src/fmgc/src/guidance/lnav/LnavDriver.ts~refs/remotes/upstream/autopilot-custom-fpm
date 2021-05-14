import { LateralMode, VerticalMode } from '@shared/autopilot';
import { GuidanceComponent } from '../GuidanceComponent';
import { ControlLaw } from '../ControlLaws';
import { Leg, TFLeg } from '../Geometry';
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

        const geometry = this.guidanceController.guidanceManager.getActiveLegPathGeometry();

        if (geometry !== null) {
            this.ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
            this.ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

            const trueTrack = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree');

            const params = geometry.getGuidanceParameters(this.ppos, trueTrack);

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
                default:
                    throw new Error(`Invalid control law: ${params.law}`);
                }

                available = true;
            }

            if (geometry.shouldSequenceLeg(this.ppos)) {
                const currentLeg = geometry.legs.get(1);

                if (currentLeg instanceof TFLeg && currentLeg.to.endsInDiscontinuity) {
                    this.sequenceDiscontinuity(currentLeg);
                } else {
                    this.sequenceLeg(currentLeg);
                }
            }
        }

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
        console.log('[FMGC/Guidance] LNAV - sequencing leg');

        let wpIndex = this.guidanceController.flightPlanManager.getActiveWaypointIndex();

        this.guidanceController.flightPlanManager.setActiveWaypointIndex(++wpIndex);
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
