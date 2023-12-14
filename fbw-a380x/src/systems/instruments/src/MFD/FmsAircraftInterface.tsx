/* eslint-disable jsx-a11y/label-has-associated-control */

import { Arinc429SignStatusMatrix, Arinc429Word, KiloGram, Knots } from '@flybywiresim/fbw-sdk';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/new/plans/performance/FlightPlanPerformanceData';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { FlightPhaseManager, FlightPlanService } from '@fmgc/index';
import { MmrRadioTuningStatus } from '@fmgc/navigation/NavaidTuner';
import { maxZfw, minZfwCg } from '@shared/PerformanceConstants';
import { FmgcFlightPhase } from '@shared/flightphase';
import { MfdComponent } from 'instruments/src/MFD/MFD';
import { FmgcDataInterface } from 'instruments/src/MFD/fmgc';
import { ADIRS } from 'instruments/src/MFD/pages/FMS/legacy/Adirs';
import { NXSpeedsUtils } from 'instruments/src/MFD/pages/FMS/legacy/NXSpeeds';
import { NXSystemMessages } from 'instruments/src/MFD/pages/FMS/legacy/NXSystemMessages';
import { MfdFlightManagementService } from 'instruments/src/MFD/pages/common/FlightManagementService';
import { Feet } from 'msfs-geo';
import { A380OperatingSpeeds, A380OperatingSpeedsApproach } from '../../../shared/src/OperatingSpeeds';

/**
 * Interface between FMS and aircraft through SimVars and ARINC values (mostly data being sent here)
 * Essentially part of the FMC (-A/-B/-C)
 */
export class FmsAircraftInterface {
    constructor(
        private mfd: MfdComponent,
        private fmgc: FmgcDataInterface,
        private fmService: MfdFlightManagementService,
        private flightPlanService: FlightPlanService,
        private flightPhaseManager: FlightPhaseManager,
    ) {
    }

    // ARINC words
    // arinc bus output words
    public arincDiscreteWord2 = FmArinc429OutputWord.emptyFm("DISCRETE_WORD_2");
    public arincDiscreteWord3 = FmArinc429OutputWord.emptyFm("DISCRETE_WORD_3");
    public arincTakeoffPitchTrim = FmArinc429OutputWord.emptyFm("TO_PITCH_TRIM");
    public arincLandingElevation = FmArinc429OutputWord.emptyFm("LANDING_ELEVATION");
    public arincDestinationLatitude = FmArinc429OutputWord.emptyFm("DEST_LAT");
    public arincDestinationLongitude = FmArinc429OutputWord.emptyFm("DEST_LONG");
    public arincMDA = FmArinc429OutputWord.emptyFm("MINIMUM_DESCENT_ALTITUDE");
    public arincDH = FmArinc429OutputWord.emptyFm("DECISION_HEIGHT");
    public arincThrustReductionAltitude = FmArinc429OutputWord.emptyFm("THR_RED_ALT");
    public arincAccelerationAltitude = FmArinc429OutputWord.emptyFm("ACC_ALT");
    public arincEoAccelerationAltitude = FmArinc429OutputWord.emptyFm("EO_ACC_ALT");
    public arincMissedThrustReductionAltitude = FmArinc429OutputWord.emptyFm("MISSED_THR_RED_ALT");
    public arincMissedAccelerationAltitude = FmArinc429OutputWord.emptyFm("MISSED_ACC_ALT");
    public arincMissedEoAccelerationAltitude = FmArinc429OutputWord.emptyFm("MISSED_EO_ACC_ALT");
    public arincTransitionAltitude = FmArinc429OutputWord.emptyFm("TRANS_ALT");
    public arincTransitionLevel = FmArinc429OutputWord.emptyFm("TRANS_LVL");
    /** contains fm messages (not yet implemented) and nodh bit */
    public arincEisWord2 = FmArinc429OutputWord.emptyFm("EIS_DISCRETE_WORD_2");

    /** These arinc words will be automatically written to the bus, and automatically set to 0/NCD when the FMS resets */
    public arincBusOutputs = [
        this.arincDiscreteWord2,
        this.arincDiscreteWord3,
        this.arincTakeoffPitchTrim,
        this.arincLandingElevation,
        this.arincDestinationLatitude,
        this.arincDestinationLongitude,
        this.arincMDA,
        this.arincDH,
        this.arincThrustReductionAltitude,
        this.arincAccelerationAltitude,
        this.arincEoAccelerationAltitude,
        this.arincMissedThrustReductionAltitude,
        this.arincMissedAccelerationAltitude,
        this.arincMissedEoAccelerationAltitude,
        this.arincTransitionAltitude,
        this.arincTransitionLevel,
        this.arincEisWord2,
    ];

    public updateThrustReductionAcceleration() {
        if (!this.flightPlanService.hasActive) {
            return;
        }
        const activePerformanceData = this.flightPlanService.active.performanceData;

        this.arincThrustReductionAltitude.setBnrValue(
            activePerformanceData.thrustReductionAltitude.get() !== undefined ? activePerformanceData.thrustReductionAltitude.get() : 0,
            activePerformanceData.thrustReductionAltitude.get() !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincAccelerationAltitude.setBnrValue(
            activePerformanceData.accelerationAltitude.get() !== undefined ? activePerformanceData.accelerationAltitude.get() : 0,
            activePerformanceData.accelerationAltitude.get() !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincEoAccelerationAltitude.setBnrValue(
            activePerformanceData.engineOutAccelerationAltitude.get() !== undefined ? activePerformanceData.engineOutAccelerationAltitude.get() : 0,
            activePerformanceData.engineOutAccelerationAltitude.get() !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );

        this.arincMissedThrustReductionAltitude.setBnrValue(
            activePerformanceData.missedThrustReductionAltitude.get() !== undefined ? activePerformanceData.missedThrustReductionAltitude.get() : 0,
            activePerformanceData.missedThrustReductionAltitude.get() !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincMissedAccelerationAltitude.setBnrValue(
            activePerformanceData.missedAccelerationAltitude.get() !== undefined ? activePerformanceData.missedAccelerationAltitude.get() : 0,
            activePerformanceData.missedAccelerationAltitude.get() !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincMissedEoAccelerationAltitude.setBnrValue(
            activePerformanceData.missedEngineOutAccelerationAltitude.get() !== undefined ? activePerformanceData.missedEngineOutAccelerationAltitude.get() : 0,
            activePerformanceData.missedEngineOutAccelerationAltitude.get() !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
    }

    public updateTransitionAltitudeLevel(originTransitionAltitude: Feet, destinationTansitionLevel: Feet) {
        this.arincTransitionAltitude.setBnrValue(
            originTransitionAltitude !== undefined ? originTransitionAltitude : 0,
            originTransitionAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        )

        this.arincTransitionLevel.setBnrValue(
            destinationTansitionLevel !== undefined ? destinationTansitionLevel : 0,
            destinationTansitionLevel !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            9, 512, 0,
        )
    }

    public updatePerformanceData() {
        if (!this.flightPlanService.hasActive) {
            return;
        }

        SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", this.flightPlanService.active.performanceData.v1.get() ?? NaN);
        SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", this.flightPlanService.active.performanceData.v2.get() ?? NaN);
        SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", this.flightPlanService.active.performanceData.vr.get() ?? NaN);
    }

    getToSpeedsTooLow(activePerformanceData: FlightPlanPerformanceData) {
        if (this.fmgc.data.takeoffFlapsSetting.get() === null || this.fmService.getGrossWeight() === null) {
            return false;
        }

        const departureElevation = this.fmgc.getDepartureElevation();

        const zp = departureElevation !== null ? this.fmgc.getPressureAltAtElevation(departureElevation, this.fmgc.getBaroCorrection1()) : this.fmgc.getPressureAlt();
        if (zp === null) {
            return false;
        }

        const tow = this.fmService.getGrossWeight() - (this.fmgc.isAnEngineOn() || this.fmgc.data.taxiFuel.get() === undefined ? 0 : this.fmgc.data.taxiFuel.get());

        return activePerformanceData.v1.get() < Math.trunc(NXSpeedsUtils.getVmcg(zp))
            || activePerformanceData.vr.get() < Math.trunc(1.05 * NXSpeedsUtils.getVmca(zp))
            || activePerformanceData.v2.get() < Math.trunc(1.1 * NXSpeedsUtils.getVmca(zp))
            || (isFinite(tow) && activePerformanceData.v2.get() < Math.trunc(1.13 * NXSpeedsUtils.getVs1g(tow, this.fmgc.data.takeoffFlapsSetting.get(), true)));
    }

    private toSpeedsNotInserted = true;
    private toSpeedsTooLow = false;
    private vSpeedDisagree = false;

    private vSpeedsValid(activePerformanceData: FlightPlanPerformanceData) {
        const v1Speed = activePerformanceData.v1.get();
        const vRSpeed = activePerformanceData.vr.get();
        const v2Speed = activePerformanceData.v2.get();

        return (!!v1Speed && !!vRSpeed ? v1Speed <= vRSpeed : true)
            && (!!vRSpeed && !!v2Speed ? vRSpeed <= v2Speed : true)
            && (!!v1Speed && !!v2Speed ? v1Speed <= v2Speed : true);
    }

    public toSpeedsChecks(activePerformanceData: FlightPlanPerformanceData) {
        const toSpeedsNotInserted = !activePerformanceData.v1.get() || !activePerformanceData.vr.get() || !activePerformanceData.v2.get();
        if (toSpeedsNotInserted !== this.toSpeedsNotInserted) {
            this.toSpeedsNotInserted = toSpeedsNotInserted;
        }

        const toSpeedsTooLow = this.getToSpeedsTooLow(activePerformanceData);
        if (toSpeedsTooLow !== this.toSpeedsTooLow) {
            this.toSpeedsTooLow = toSpeedsTooLow;
            if (toSpeedsTooLow) {
                this.mfd.addMessageToQueue(NXSystemMessages.toSpeedTooLow, () => !this.getToSpeedsTooLow(activePerformanceData));
            }
        }

        const vSpeedDisagree = !this.vSpeedsValid(activePerformanceData);
        if (vSpeedDisagree !== this.vSpeedDisagree) {
            this.vSpeedDisagree = vSpeedDisagree;
            if (vSpeedDisagree) {
                this.mfd.addMessageToQueue(NXSystemMessages.vToDisagree, this.vSpeedsValid.bind(this, [activePerformanceData]));
            }
        }

        this.arincDiscreteWord3.setBitValue(16, vSpeedDisagree);
        this.arincDiscreteWord3.setBitValue(17, toSpeedsTooLow);
        this.arincDiscreteWord3.setBitValue(18, toSpeedsNotInserted);
        this.arincDiscreteWord3.ssm = Arinc429SignStatusMatrix.NormalOperation;
    }

    /**
     * Set the takeoff flap config
     * @param {0 | 1 | 2 | 3 | null} flaps
     */
    setTakeoffFlaps(flaps: FlapConf) {
        SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_FLAPS", "number", flaps !== null ? flaps : -1);

        this.arincDiscreteWord2.setBitValue(13, flaps === 0);
        this.arincDiscreteWord2.setBitValue(14, flaps === 1);
        this.arincDiscreteWord2.setBitValue(15, flaps === 2);
        this.arincDiscreteWord2.setBitValue(16, flaps === 3);
        this.arincDiscreteWord2.ssm = Arinc429SignStatusMatrix.NormalOperation;
    }

    /**
     * Set the takeoff trim config
     * @param {number | null} ths
     */
    setTakeoffTrim(ths: number) {
        // legacy vars
        SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_THS", "degree", ths ? ths : 0);
        SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_THS_ENTERED", "bool", ths !== null);

        const ssm = ths !== null ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

        this.arincTakeoffPitchTrim.setBnrValue(ths ? -ths : 0, ssm, 12, 180, -180);
    }

    updateMinimums(distanceToDestination: number) {
        const inRange = this.shouldTransmitMinimums(distanceToDestination);

        const mda = this.fmgc.data.approachBaroMinimum.get();
        const dh = this.fmgc.data.approachRadioMinimum.get();

        const mdaValid = inRange && mda !== null;
        const dhValid = !mdaValid && inRange && typeof dh === 'number';

        const mdaSsm = mdaValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;
        const dhSsm = dhValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

        this.arincMDA.setBnrValue(mdaValid ? mda : 0, mdaSsm, 17, 131072, 0);
        this.arincDH.setBnrValue(dhValid ? dh : 0, dhSsm, 16, 8192, 0);
        this.arincEisWord2.setBitValue(29, inRange && !dhValid);
        // FIXME we need to handle these better
        this.arincEisWord2.ssm = Arinc429SignStatusMatrix.NormalOperation;
    }

    shouldTransmitMinimums(distanceToDestination: number) {
        const phase = this.fmgc.getFlightPhase();
        const isCloseToDestination = Number.isFinite(distanceToDestination) ? distanceToDestination < 250 : true;

        return (phase > FmgcFlightPhase.Cruise || (phase === FmgcFlightPhase.Cruise && isCloseToDestination));
    }

    activatePreSelSpeedMach(preSel: number) {
        if (preSel) {
            if (preSel < 1) {
                SimVar.SetSimVarValue('H:A320_Neo_FCU_USE_PRE_SEL_MACH', 'number', 1);
            } else {
                SimVar.SetSimVarValue('H:A320_Neo_FCU_USE_PRE_SEL_SPEED', 'number', 1);
            }
        }
    }

    updatePreSelSpeedMach(preSel: number) {
        // The timeout is required to create a delay for the current value to be read and the new one to be set
        setTimeout(() => {
            if (preSel) {
                if (preSel > 1) {
                    SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', preSel);
                    SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
                } else {
                    SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);
                    SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', preSel);
                }
            } else {
                SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);
                SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
            }
        }, 200);
    }

    private managedSpeedTarget: number;
    private managedSpeedTargetIsMach: boolean;

    private holdDecelReached = false;
    private holdSpeedTarget = 0;
    private setHoldSpeedMessageActive = false;
    private takeoffEngineOutSpeed: Knots;

    updateManagedSpeed() {
        if (!this.flightPlanService.hasActive) {
            return;
        }
        const activePerformanceData = this.flightPlanService.active.performanceData;

        let vPfd = 0;
        let isMach = false;

        /* TODO port over
        this.updateHoldingSpeed();
        this.clearCheckSpeedModeMessage(); */

        if (SimVar.GetSimVarValue("L:A32NX_FMA_EXPEDITE_MODE", "number") === 1) {
            const verticalMode = SimVar.GetSimVarValue("L:A32NX_FMA_VERTICAL_MODE", "number");
            if (verticalMode === 12) {
                switch (SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number")) {
                    case 0: {
                        this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_SPEEDS_GD", "number");
                        break;
                    }
                    case 1: {
                        this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_SPEEDS_S", "number");
                        break;
                    }
                    default: {
                        this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_SPEEDS_F", "number");
                    }
                }
            } else if (verticalMode === 13) {
                this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number") === 0 ? Math.min(340, SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", 0.8)) : SimVar.GetSimVarValue("L:A32NX_SPEEDS_VMAX", "number") - 10;
            }
            vPfd = this.managedSpeedTarget;
        } else if (this.holdDecelReached) {
            vPfd = this.holdSpeedTarget;
            this.managedSpeedTarget = this.holdSpeedTarget;
        } else {
            if (this.setHoldSpeedMessageActive) {
                this.setHoldSpeedMessageActive = false;
                SimVar.SetSimVarValue("L:A32NX_PFD_MSG_SET_HOLD_SPEED", "bool", false);
                this.mfd.removeMessageFromQueue(NXSystemMessages.setHoldSpeed.text);
            }

            const engineOut = !this.fmgc.isAllEngineOn();

            switch (this.fmgc.getFlightPhase()) {
                case FmgcFlightPhase.Preflight: {
                    if (activePerformanceData.v2.get()) {
                        vPfd = activePerformanceData.v2.get();
                        this.managedSpeedTarget = activePerformanceData.v2.get() + 10;
                    }
                    break;
                }
                case FmgcFlightPhase.Takeoff: {
                    if (activePerformanceData.v2.get()) {
                        vPfd = activePerformanceData.v2.get();
                        this.managedSpeedTarget = engineOut
                            ? Math.min(activePerformanceData.v2.get() + 15, Math.max(activePerformanceData.v2.get(), this.takeoffEngineOutSpeed ? this.takeoffEngineOutSpeed : 0))
                            : activePerformanceData.v2.get() + 10;
                    }
                    break;
                }
                case FmgcFlightPhase.Climb: {
                    let speed = this.fmgc.getManagedClimbSpeed();

                    if (this.fmgc.getClimbSpeedLimit() !== undefined && SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet") < this.fmgc.getClimbSpeedLimit().underAltitude) {
                        speed = Math.min(speed, this.fmgc.getClimbSpeedLimit().speed);
                    }

                    speed = Math.min(speed, this.getSpeedConstraint());

                    [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.fmgc.getManagedClimbSpeedMach());
                    vPfd = this.managedSpeedTarget;
                    break;
                }
                case FmgcFlightPhase.Cruise: {
                    let speed = this.fmgc.getManagedCruiseSpeed();

                    if (this.fmgc.getClimbSpeedLimit() !== undefined && SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet") < this.fmgc.getClimbSpeedLimit().underAltitude) {
                        speed = Math.min(speed, this.fmgc.getClimbSpeedLimit().speed);
                    }

                    [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.fmgc.getManagedCruiseSpeedMach());
                    vPfd = this.managedSpeedTarget;
                    break;
                }
                case FmgcFlightPhase.Descent: {
                    // We fetch this data from VNAV
                    vPfd = SimVar.GetSimVarValue("L:A32NX_SPEEDS_MANAGED_PFD", "knots");
                    this.managedSpeedTarget = SimVar.GetSimVarValue("L:A32NX_SPEEDS_MANAGED_ATHR", "knots");

                    // Whether to use Mach or not should be based on the original managed speed, not whatever VNAV uses under the hood to vary it.
                    // Also, VNAV already does the conversion from Mach if necessary
                    isMach = this.getManagedTargets(this.fmgc.getManagedDescentSpeed(), this.fmgc.getManagedDescentSpeedMach())[1];
                    break;
                }
                case FmgcFlightPhase.Approach: {
                    // the displayed target is Vapp (with GSmini)
                    // the guidance target is lower limited by FAC manouvering speeds (O, S, F) unless in landing config
                    // constraints are not considered
                    const speed = this.getAppManagedSpeed();
                    vPfd = this.getVAppGsMini();

                    this.managedSpeedTarget = Math.max(speed, vPfd);
                    break;
                }
                case FmgcFlightPhase.GoAround: {
                    if (SimVar.GetSimVarValue("L:A32NX_FMA_VERTICAL_MODE", "number") === 41 /* SRS GA */) {
                        const speed = Math.min(
                            this.fmgc.data.approachVls.get() + (engineOut ? 15 : 25),
                            Math.max(
                                SimVar.GetSimVarValue("L:A32NX_GOAROUND_INIT_SPEED", "number"),
                                this.fmgc.data.approachSpeed.get(),
                            ),
                            SimVar.GetSimVarValue("L:A32NX_SPEEDS_VMAX", "number") - 5,
                        );

                        vPfd = speed;
                        this.managedSpeedTarget = speed;
                    } else {
                        const speedConstraint = this.getSpeedConstraint();
                        const speed = Math.min(this.fmgc.data.greenDotSpeed.get(), speedConstraint);

                        vPfd = speed;
                        this.managedSpeedTarget = speed;
                    }
                    break;
                }
            }
        }

        // Automatically change fcu mach/speed mode
        if (this.managedSpeedTargetIsMach !== isMach) {
            if (isMach) {
                SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_ON", "number", 1);
            } else {
                SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_OFF", "number", 1);
            }
            this.managedSpeedTargetIsMach = isMach;
        }

        // Overspeed protection
        const Vtap = Math.min(this.managedSpeedTarget, SimVar.GetSimVarValue("L:A32NX_SPEEDS_VMAX", "number"));

        SimVar.SetSimVarValue("L:A32NX_SPEEDS_MANAGED_PFD", "knots", vPfd);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_MANAGED_ATHR", "knots", Vtap);

        if (this.isAirspeedManaged()) {
            Coherent.call("AP_SPD_VAR_SET", 0, Vtap).catch(console.error);
        }
    }

    getAppManagedSpeed() {
        switch (SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Number")) {
            case 0: return this.fmgc.data.greenDotSpeed.get();
            case 1: return this.fmgc.data.slatRetractionSpeed.get();
            case 3: return this.fmgc.data.approachFlapConfig.get() === FlapConf.CONF_3 ? this.fmgc.data.approachSpeed.get() : this.fmgc.data.flapRetractionSpeed.get();
            case 4: return this.fmgc.data.approachSpeed.get();
            default: return this.fmgc.data.flapRetractionSpeed.get();
        }
    }

    getVAppGsMini() {
        let vAppTarget = this.fmgc.data.approachSpeed.get();
        let towerHeadwind = 0;
        if (isFinite(this.fmgc.data.approachWind.get().speed) && isFinite(this.fmgc.data.approachWind.get().direction)) {
            if (this.fmgc.getDestinationRunway()) {
                towerHeadwind = NXSpeedsUtils.getHeadwind(this.fmgc.data.approachWind.get().speed, this.fmgc.data.approachWind.get().direction, this.fmgc.getDestinationRunway().magneticBearing);
            }
            vAppTarget = NXSpeedsUtils.getVtargetGSMini(vAppTarget, NXSpeedsUtils.getHeadWindDiff(towerHeadwind));
        }
        return vAppTarget;
    }

    private _apMasterStatus: number;
    private _lastUpdateAPTime: number;
    private updateAutopilotCooldown: number = 0;
    private _apCooldown: number = 500;
    private _forceNextAltitudeUpdate: boolean;
    private activeWpIdx: number;
    private constraintAlt: Feet;
    private _lastRequestedFLCModeWaypointIndex: number;

    updateAutopilot(dt: number) {
        let apLogicOn = (this._apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1));
        this._lastUpdateAPTime = Date.now();
        if (isFinite(dt)) {
            this.updateAutopilotCooldown -= dt;
        }
        if (SimVar.GetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number") === 1) {
            SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 0);
            this.updateAutopilotCooldown = -1;
        }

        if (this.fmgc.getFlightPhase() === FmgcFlightPhase.Takeoff && !this.fmgc.isAllEngineOn() && this.takeoffEngineOutSpeed === undefined) {
            const casWord = ADIRS.getCalibratedAirspeed();
            this.takeoffEngineOutSpeed = casWord.isNormalOperation() ? casWord.value : undefined;
        }

        if (this.updateAutopilotCooldown < 0) {
            this.updatePerfSpeeds();
            this.updateConstraints();
            this.updateManagedSpeed();
            const currentApMasterStatus = SimVar.GetSimVarValue("AUTOPILOT MASTER", "boolean");
            if (currentApMasterStatus !== this._apMasterStatus) {
                this._apMasterStatus = currentApMasterStatus;
                apLogicOn = (this._apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1));
                this._forceNextAltitudeUpdate = true;
                console.log("Enforce AP in Altitude Lock mode. Cause : AP Master Status has changed.");
                SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 1);
                if (this._apMasterStatus) {
                    if (this.flightPlanService.hasActive && this.flightPlanService.active.legCount === 0) {
                        this._onModeSelectedAltitude();
                        this._onModeSelectedHeading();
                    }
                }
            }
            if (apLogicOn) {
                if (!Simplane.getAutoPilotFLCActive() && !SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD", "Boolean")) {
                    SimVar.SetSimVarValue("K:AP_PANEL_SPEED_HOLD", "Number", 1);
                }
                if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
                    if (!SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
                        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "Number", 1);
                    }
                }
            }

            if (this.isAltitudeManaged()) {
                const plan = this.flightPlanService.active;

                const prevWaypoint = plan.hasElement(plan.activeLegIndex - 1);
                const nextWaypoint = plan.hasElement(plan.activeLegIndex + 1);

                if (prevWaypoint && nextWaypoint) {
                    const activeWpIdx = plan.activeLegIndex;

                    if (activeWpIdx !== this.activeWpIdx) {
                        this.activeWpIdx = activeWpIdx;
                        this.updateConstraints();
                    }
                    if (this.constraintAlt) {
                        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, this.constraintAlt, this._forceNextAltitudeUpdate).catch(console.error);
                        this._forceNextAltitudeUpdate = false;
                    } else {
                        const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue("feet");
                        if (isFinite(altitude)) {
                            Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, altitude, this._forceNextAltitudeUpdate).catch(console.error);
                            this._forceNextAltitudeUpdate = false;
                        }
                    }
                } else {
                    const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue("feet");
                    if (isFinite(altitude)) {
                        SimVar.SetSimVarValue("L:A32NX_FG_ALTITUDE_CONSTRAINT", "feet", 0);
                        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, altitude, this._forceNextAltitudeUpdate).catch(console.error);
                        this._forceNextAltitudeUpdate = false;
                    }
                }
            }

            if (Simplane.getAutoPilotAltitudeManaged() && this.flightPlanService.hasActive && SimVar.GetSimVarValue("L:A320_NEO_FCU_STATE", "number") !== 1) {
                const currentWaypointIndex = this.flightPlanService.active.activeLegIndex;
                if (currentWaypointIndex !== this._lastRequestedFLCModeWaypointIndex) {
                    this._lastRequestedFLCModeWaypointIndex = currentWaypointIndex;
                    setTimeout(() => {
                        if (Simplane.getAutoPilotAltitudeManaged()) {
                            this._onModeManagedAltitude();
                        }
                    }, 1000);
                }
            }

            if (this.fmgc.getFlightPhase() === FmgcFlightPhase.GoAround && apLogicOn) {
                //depending if on HDR/TRK or NAV mode, select appropriate Alt Mode (WIP)
                //this._onModeManagedAltitude();
                this._onModeSelectedAltitude();
            }
            this.updateAutopilotCooldown = this._apCooldown;
        }
    }

    /**
     * Tries to estimate the landing weight at destination
     * NaN on failure
     */
    tryEstimateLandingWeight() {
        const altActive = false;
        const landingWeight = this.fmgc.data.zeroFuelWeight.get() + (altActive ? this.fmgc.getAltEFOB(true) : this.fmgc.getDestEFOB(true));
        // Workaround for fake a320 weights
        if (landingWeight < 100) {
            return this.fmService.getGrossWeight();
        }
        return isFinite(landingWeight) ? landingWeight : NaN;
    }

    calculateAndUpdateSpeeds() {
        // Calculate all speeds and write to SimVars
    }

    /**
     * Updates performance speeds such as GD, F, S, Vls and approach speeds. Write to SimVars
     */
    updatePerfSpeeds() {
        let weight = this.tryEstimateLandingWeight();
        const vnavPrediction = this.fmService.guidanceController?.vnavDriver?.getDestinationPrediction();
        // Actual weight is used during approach phase (FCOM bulletin 46/2), and we also assume during go-around
        // Fallback gross weight set to 64.3T (MZFW), which is replaced by FMGW once input in FMS to avoid function returning undefined results.
        if (this.flightPhaseManager.phase >= FmgcFlightPhase.Approach || !isFinite(weight)) {
            weight = (this.fmService.getGrossWeight() == 0) ? maxZfw : this.fmService.getGrossWeight();
        } else if (vnavPrediction && Number.isFinite(vnavPrediction.estimatedFuelOnBoard)) {
            weight = this.fmgc.data.zeroFuelWeight.get() + Math.max(0, vnavPrediction.estimatedFuelOnBoard * 0.4535934 / 1000);
        }
        // Workaround for fake a320 weights
        if (weight < 100_000) {
            weight = this.fmService.getGrossWeight();
        }
        // if pilot has set approach wind in MCDU we use it, otherwise fall back to current measured wind
        if (this.fmgc.data.approachWind.get() && isFinite(this.fmgc.data.approachWind.get().speed) && isFinite(this.fmgc.data.approachWind.get().direction)) {
            let towerHeadwind = 0;
            if (this.flightPlanService.active.destinationRunway) {
                towerHeadwind = NXSpeedsUtils.getHeadwind(this.fmgc.data.approachWind.get().speed, this.fmgc.data.approachWind.get().direction, this.flightPlanService.active.destinationRunway.magneticBearing);
            }
            const approachSpeeds = new A380OperatingSpeedsApproach(weight / 1000, this.fmgc.data.approachFlapConfig.get() === FlapConf.CONF_3, towerHeadwind);
            this.fmgc.data.approachSpeed.set(Math.ceil(approachSpeeds.vapp));
            this.fmgc.data.approachVls.set(Math.ceil(approachSpeeds.vls));
            this.fmgc.data.approachVref.set(Math.ceil(approachSpeeds.vref));
        } else {
            const approachSpeeds = new A380OperatingSpeedsApproach(weight / 1000, this.fmgc.data.approachFlapConfig.get() === FlapConf.CONF_3);
            this.fmgc.data.approachSpeed.set(Math.ceil(approachSpeeds.vapp));
            this.fmgc.data.approachVls.set(Math.ceil(approachSpeeds.vls));
            this.fmgc.data.approachVref.set(Math.ceil(approachSpeeds.vref));
        }

        const flaps = SimVar.GetSimVarValue("L:A32NX_FLAPS_HANDLE_INDEX", "Enum");
        const gearPos = Math.round(SimVar.GetSimVarValue("GEAR POSITION:0", "Enum"));
        const speeds = new A380OperatingSpeeds(this.fmService.getGrossWeight() / 1000, flaps, gearPos);
        speeds.compensateForMachEffect(Math.round(Simplane.getAltitude()));

        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VS", "number", speeds.vs);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VLS", "number", speeds.vls);
        if (this.fmgc.data.takeoffFlapsSetting.get() && this.fmgc.data.takeoffFlapsSetting.get() == FlapConf.CONF_3) {
            SimVar.SetSimVarValue("L:A32NX_SPEEDS_F", "number", speeds.f3);
            this.fmgc.data.flapRetractionSpeed.set(Math.ceil(speeds.f3));
        } else {
            SimVar.SetSimVarValue("L:A32NX_SPEEDS_F", "number", speeds.f2);
            this.fmgc.data.greenDotSpeed.set(Math.ceil(speeds.f2));
        }
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_S", "number", speeds.s);
        this.fmgc.data.slatRetractionSpeed.set(Math.ceil(speeds.s));
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_GD", "number", speeds.gd);
        this.fmgc.data.greenDotSpeed.set(Math.ceil(speeds.gd));
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_LANDING_CONF3", "boolean", this.fmgc.data.approachFlapConfig.get() === FlapConf.CONF_3);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VMAX", "number", speeds.vmax);
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_VFEN", "number", speeds.vfeN);
        // SimVar.SetSimVarValue("L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC", "number", 0);
        // SimVar.SetSimVarValue("L:A32NX_SPEEDS_ALPHA_MAX_CALC", "number", 0);
    }

    updateConstraints() {
        const activeFpIndex = this.flightPlanService.activeLegIndex;
        const constraints = this.managedProfile.get(activeFpIndex);
        const fcuSelAlt = Simplane.getAutoPilotDisplayedAltitudeLockValue("feet");

        let constraintAlt = 0;
        if (constraints) {
            const phase = this.fmgc.getFlightPhase();
            if ((phase < FmgcFlightPhase.Cruise || phase === FmgcFlightPhase.GoAround) && isFinite(constraints.climbAltitude) && constraints.climbAltitude < fcuSelAlt) {
                constraintAlt = constraints.climbAltitude;
            }

            if ((phase > FmgcFlightPhase.Cruise && phase < FmgcFlightPhase.GoAround) && isFinite(constraints.descentAltitude) && constraints.descentAltitude > fcuSelAlt) {
                constraintAlt = constraints.descentAltitude;
            }
        }

        if (constraintAlt !== this.constraintAlt) {
            this.constraintAlt = constraintAlt;
            SimVar.SetSimVarValue("L:A32NX_FG_ALTITUDE_CONSTRAINT", "feet", this.constraintAlt);
        }
    }

    public onEvent(_event: string): void {
        if (_event === "MODE_SELECTED_HEADING") {
            if (Simplane.getAutoPilotHeadingManaged()) {
                if (SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number") === 0) {
                    const currentHeading = Simplane.getHeadingMagnetic();

                    Coherent.call("HEADING_BUG_SET", 1, currentHeading).catch(console.error);
                }
            }
            this._onModeSelectedHeading();
        }
        if (_event === "MODE_MANAGED_HEADING") {
            if (this.flightPlanService.active.legCount === 0) {
                return;
            }

            this._onModeManagedHeading();
        }
        if (_event === "MODE_SELECTED_ALTITUDE") {
            const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
            this.flightPhaseManager.handleFcuAltKnobPushPull(dist);
            this._onModeSelectedAltitude();
            this._onStepClimbDescent();
        }
        if (_event === "MODE_MANAGED_ALTITUDE") {
            const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
            this.flightPhaseManager.handleFcuAltKnobPushPull(dist);
            this._onModeManagedAltitude();
            this._onStepClimbDescent();
        }
        if (_event === "AP_DEC_ALT" || _event === "AP_INC_ALT") {
            const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
            this.flightPhaseManager.handleFcuAltKnobTurn(dist);
            this._onTrySetCruiseFlightLevel();
        }
        if (_event === "AP_DEC_HEADING" || _event === "AP_INC_HEADING") {
            if (SimVar.GetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number") === 0) {
                const currentHeading = Simplane.getHeadingMagnetic();
                Coherent.call("HEADING_BUG_SET", 1, currentHeading).catch(console.error);
            }
            SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number", 1);
        }
        if (_event === "VS") {
            const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
            this.flightPhaseManager.handleFcuVSKnob(dist, this._onStepClimbDescent.bind(this));
        }
    }

    _onModeSelectedHeading() {
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean")) {
            return;
        }
        if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "Number", 1);
        }
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
    }

    _onModeManagedHeading() {
        if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean")) {
            return;
        }
        if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "Number", 1);
        }
        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 2);
        SimVar.SetSimVarValue("L:A320_FCU_SHOW_SELECTED_HEADING", "number", 0);
    }

    _onModeSelectedAltitude() {
        if (!Simplane.getAutoPilotGlideslopeHold()) {
            SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 1);
        }
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 1);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate).catch(console.error);
    }

    _onModeManagedAltitude() {
        SimVar.SetSimVarValue("K:ALTITUDE_SLOT_INDEX_SET", "number", 2);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate).catch(console.error);
        Coherent.call("AP_ALT_VAR_SET_ENGLISH", 2, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this._forceNextAltitudeUpdate).catch(console.error);
        if (!Simplane.getAutoPilotGlideslopeHold()) {
            SimVar.SetSimVarValue("L:A320_NEO_FCU_FORCE_IDLE_VS", "Number", 1);
        }
    }

    _onStepClimbDescent() {
        if (!(this.fmgc.getFlightPhase() === FmgcFlightPhase.Climb || this.fmgc.getFlightPhase() === FmgcFlightPhase.Cruise)) {
            return;
        }

        const _targetFl = Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100;

        if (
            (this.fmgc.getFlightPhase() === FmgcFlightPhase.Climb && _targetFl > this.flightPlanService.active.performanceData.cruiseFlightLevel.get()) ||
            (this.fmgc.getFlightPhase() === FmgcFlightPhase.Cruise && _targetFl !== this.flightPlanService.active.performanceData.cruiseFlightLevel.get())
        ) {
            this.deleteOutdatedCruiseSteps(this.flightPlanService.active.performanceData.cruiseFlightLevel.get(), _targetFl);
            this.mfd.addMessageToQueue(NXSystemMessages.newCrzAlt.getModifiedMessage((_targetFl * 100).toFixed(0)));
            this.flightPlanService.active.performanceData.cruiseFlightLevel.set(_targetFl);
            this._cruiseFlightLevel = _targetFl;
        }
    }

    deleteOutdatedCruiseSteps(oldCruiseLevel, newCruiseLevel) {
        const isClimbVsDescent = newCruiseLevel > oldCruiseLevel;

        const activePlan = this.flightPlanService.active;

        for (let i = activePlan.activeLegIndex; i < activePlan.legCount; i++) {
            const element = activePlan.elementAt(i);

            if (!element || element.isDiscontinuity === true || !element.cruiseStep) {
                continue;
            }

            const stepLevel = Math.round(element.cruiseStep.toAltitude / 100);

            if (isClimbVsDescent && stepLevel >= oldCruiseLevel && stepLevel <= newCruiseLevel ||
                    !isClimbVsDescent && stepLevel <= oldCruiseLevel && stepLevel >= newCruiseLevel
            ) {
                element.cruiseStep = undefined; // TODO call a method on FPS so that we sync this (fms-v2)
                this.mfd.removeMessageFromQueue(NXSystemMessages.stepAhead.text);
            }
        }
    }

    /***
     * Executed on every alt knob turn, checks whether or not the crz fl can be changed to the newly selected fcu altitude
     * It creates a timeout to simulate real life delay which resets every time the fcu knob alt increases or decreases.
     * @private
     */
    private _cruiseFlightLevel: number;
    private cruiseFlightLevelTimeOut: number;

    _onTrySetCruiseFlightLevel() {
        if (!(this.flightPhaseManager.phase === FmgcFlightPhase.Climb || this.flightPhaseManager.phase === FmgcFlightPhase.Cruise)) {
            return;
        }

        const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'enum');

        if ((activeVerticalMode >= 11 && activeVerticalMode <= 15) || (activeVerticalMode >= 21 && activeVerticalMode <= 23)) {
            const fcuFl = Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100;

            if (this.fmgc.getFlightPhase() === FmgcFlightPhase.Climb && fcuFl > this.flightPlanService.active.performanceData.cruiseFlightLevel.get() ||
            this.fmgc.getFlightPhase() === FmgcFlightPhase.Cruise && fcuFl !== this.flightPlanService.active.performanceData.cruiseFlightLevel.get()
            ) {
                if (this.cruiseFlightLevelTimeOut) {
                    clearTimeout(this.cruiseFlightLevelTimeOut);
                    this.cruiseFlightLevelTimeOut = undefined;
                }

                this.cruiseFlightLevelTimeOut = setTimeout(() => {
                    if (fcuFl === Simplane.getAutoPilotDisplayedAltitudeLockValue() / 100 &&
                        (
                            this.fmgc.getFlightPhase() === FmgcFlightPhase.Climb && fcuFl > this.flightPlanService.active.performanceData.cruiseFlightLevel.get() ||
                            this.fmgc.getFlightPhase() === FmgcFlightPhase.Cruise && fcuFl !== this.flightPlanService.active.performanceData.cruiseFlightLevel.get()
                        )
                    ) {
                        this.mfd.addMessageToQueue(NXSystemMessages.newCrzAlt.getModifiedMessage((fcuFl * 100).toFixed(0)));
                        this.flightPlanService.active.performanceData.cruiseFlightLevel.set(fcuFl);
                        this._cruiseFlightLevel = fcuFl;
                    }
                }, 3000);
            }
        }
    }

    navModeEngaged() {
        const lateralMode = SimVar.GetSimVarValue("L:A32NX_FMA_LATERAL_MODE", "Number");
        switch (lateralMode) {
            case 20: // NAV
            case 30: // LOC*
            case 31: // LOC
            case 32: // LAND
            case 33: // FLARE
            case 34: // ROLL OUT
                return true;
        }
        return false;
    }

    //TODO: make this util or local var?
    isAirspeedManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT SPEED SLOT INDEX", "number") === 2;
    }

    //TODO: make this util or local var?
    isHeadingManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT HEADING SLOT INDEX", "number") === 2;
    }

    //TODO: make this util or local var?
    isAltitudeManaged() {
        return SimVar.GetSimVarValue("AUTOPILOT ALTITUDE SLOT INDEX", "number") === 2;
    }

    getManagedTargets(v: number, m: number) {
        //const vM = _convertMachToKCas(m, _convertCtoK(Simplane.getAmbientTemperature()), SimVar.GetSimVarValue("AMBIENT PRESSURE", "millibar"));
        const vM = SimVar.GetGameVarValue("FROM MACH TO KIAS", "number", m);
        return v > vM ? [vM, true] : [v, false];
    }

    // TODO/VNAV: Speed constraint
    getSpeedConstraint() {
        if (!this.navModeEngaged()) {
            return Infinity;
        }

        return this.getNavModeSpeedConstraint();
    }

    // TODO better decel distance calc
    calculateDecelDist(fromSpeed, toSpeed) {
        return Math.min(20, Math.max(3, (fromSpeed - toSpeed) * 0.15));
    }

    getNavModeSpeedConstraint() {
        const activeLegIndex = this.fmgc.guidanceController.activeTransIndex >= 0 ? this.fmgc.guidanceController.activeTransIndex : this.fmgc.guidanceController.activeLegIndex;
        const constraints = this.managedProfile.get(activeLegIndex);
        if (constraints) {
            if (this.flightPhaseManager.phase < FmgcFlightPhase.Cruise || this.flightPhaseManager.phase === FmgcFlightPhase.GoAround) {
                return constraints.climbSpeed;
            }

            if (this.flightPhaseManager.phase > FmgcFlightPhase.Cruise && this.flightPhaseManager.phase < FmgcFlightPhase.GoAround) {
                // FIXME proper decel calc
                if (this.fmgc.guidanceController.activeLegDtg < this.calculateDecelDist(Math.min(constraints.previousDescentSpeed, this.fmgc.getManagedDescentSpeed()), constraints.descentSpeed)) {
                    return constraints.descentSpeed;
                } else {
                    return constraints.previousDescentSpeed;
                }
            }
        }

        return Infinity;
    }

    private managedProfile = new Map();

    updateManagedProfile() {
        this.managedProfile.clear();

        const plan = this.flightPlanService.active;

        const origin = plan.originAirport;
        const destination = plan.destinationAirport;
        const destinationElevation = destination ? destination.location.alt : 0;

        // TODO should we save a constraint already propagated to the current leg?

        // propagate descent speed constraints forward
        let currentSpeedConstraint = Infinity;
        let previousSpeedConstraint = Infinity;
        for (let index = 0; index < Math.min(plan.firstMissedApproachLegIndex, plan.legCount); index++) {
            const leg = plan.elementAt(index);

            if (leg.isDiscontinuity === true) {
                continue;
            }

            if (leg.constraintType === 2 /** DES */) {
                if (leg.speedConstraint) {
                    currentSpeedConstraint = Math.min(currentSpeedConstraint, Math.round(leg.speedConstraint.speed));
                }
            }

            this.managedProfile.set(index, {
                descentSpeed: currentSpeedConstraint,
                previousDescentSpeed: previousSpeedConstraint,
                climbSpeed: Infinity,
                previousClimbSpeed: Infinity,
                climbAltitude: Infinity,
                descentAltitude: -Infinity,
            });

            previousSpeedConstraint = currentSpeedConstraint;
        }

        // propagate climb speed constraints backward
        // propagate alt constraints backward
        currentSpeedConstraint = Infinity;
        previousSpeedConstraint = Infinity;
        let currentDesConstraint = -Infinity;
        let currentClbConstraint = Infinity;

        for (let index = Math.min(plan.firstMissedApproachLegIndex, plan.legCount) - 1; index >= 0; index--) {
            const leg = plan.elementAt(index);

            if (leg.isDiscontinuity === true) {
                continue;
            }

            const altConstraint = leg.altitudeConstraint;
            const speedConstraint = leg.speedConstraint;

            if (leg.constraintType === 1 /** CLB */) {
                if (speedConstraint) {
                    currentSpeedConstraint = Math.min(currentSpeedConstraint, Math.round(speedConstraint.speed));
                }


                if (altConstraint) {
                    switch (altConstraint.type) {
                        case "@": // at alt 1
                        case "-": // at or below alt 1
                        case "B": // between alt 1 and alt 2
                        currentClbConstraint = Math.min(currentClbConstraint, Math.round(altConstraint.altitude1));
                        break;
                        default:
                            // not constraining
                    }
                }
            } else if (leg.constraintType === 2 /** DES */) {
                if (altConstraint) {
                    switch (altConstraint.type) {
                        case "@": // at alt 1
                        case "+": // at or above alt 1
                        currentDesConstraint = Math.max(currentDesConstraint, Math.round(altConstraint.altitude1));
                        break;
                        case "B": // between alt 1 and alt 2
                        currentDesConstraint = Math.max(currentDesConstraint, Math.round(altConstraint.altitude2));
                        break;
                        default:
                            // not constraining
                    }
                }
            }

            const profilePoint = this.managedProfile.get(index);
            profilePoint.climbSpeed = currentSpeedConstraint;
            profilePoint.previousClimbSpeed = previousSpeedConstraint;
            profilePoint.climbAltitude = currentClbConstraint;
            profilePoint.descentAltitude = Math.max(destinationElevation, currentDesConstraint);
            previousSpeedConstraint = currentSpeedConstraint;

            // TODO to be replaced with bbk vnav
            // set some data for LNAV to use for coarse predictions while we lack vnav
            // if (wp.additionalData.constraintType === 1 /* CLB */) {
            //     wp.additionalData.predictedSpeed = Math.min(profilePoint.climbSpeed, this.managedSpeedClimb);
            //     if (this.climbSpeedLimitAlt && profilePoint.climbAltitude < this.climbSpeedLimitAlt) {
            //         wp.additionalData.predictedSpeed = Math.min(wp.additionalData.predictedSpeed, this.climbSpeedLimit);
            //     }
            //     wp.additionalData.predictedAltitude = Math.min(profilePoint.climbAltitude, this._cruiseFlightLevel * 100);
            // } else if (wp.additionalData.constraintType === 2 /* DES */) {
            //     wp.additionalData.predictedSpeed = Math.min(profilePoint.descentSpeed, this.getManagedDescentSpeed());
            //     if (this.descentSpeedLimitAlt && profilePoint.climbAltitude < this.descentSpeedLimitAlt) {
            //         wp.additionalData.predictedSpeed = Math.min(wp.additionalData.predictedSpeed, this.descentSpeedLimit);
            //     }
            //     wp.additionalData.predictedAltitude = Math.min(profilePoint.descentAltitude, this._cruiseFlightLevel * 100); ;
            // } else {
            //     wp.additionalData.predictedSpeed = this.managedSpeedCruise;
            //     wp.additionalData.predictedAltitude = this._cruiseFlightLevel * 100;
            // }
            // // small hack to ensure the terminal procedures and transitions to/from enroute look nice despite lack of altitude predictions
            // if (index <= this.flightPlanManager.getEnRouteWaypointsFirstIndex(FlightPlans.Active)) {
            //     wp.additionalData.predictedAltitude = Math.min(originElevation + 10000, wp.additionalData.predictedAltitude);
            //     wp.additionalData.predictedSpeed = Math.min(250, wp.additionalData.predictedSpeed);
            // } else if (index >= this.flightPlanManager.getEnRouteWaypointsLastIndex(FlightPlans.Active)) {
            //     wp.additionalData.predictedAltitude = Math.min(destinationElevation + 10000, wp.additionalData.predictedAltitude);
            //     wp.additionalData.predictedSpeed = Math.min(250, wp.additionalData.predictedSpeed);
            // }
        }
    }

    //-----------------------------------------------------------------------------------
    // TODO:FPM REWRITE: Start of functions to refactor
    //-----------------------------------------------------------------------------------

    // FIXME remove A32NX_FM_LS_COURSE
    async updateIlsCourse(mmr: MmrRadioTuningStatus) {
        let course = -1;
        if (mmr.course !== null) {
            course = mmr.course;
        } else if (mmr.frequency !== null && SimVar.GetSimVarValue('L:A32NX_RADIO_RECEIVER_LOC_IS_VALID', 'number') === 1) {
            course = SimVar.GetSimVarValue('NAV LOCALIZER:3', 'degrees');
        }

        return SimVar.SetSimVarValue('L:A32NX_FM_LS_COURSE', 'number', course);
    }
}

class FmArinc429OutputWord extends Arinc429Word {
    private dirty = true;

    private _ssm = 0;

    constructor(private name: string, private _value: number = 0) {
        super(0);
    }

    // @ts-ignore
    get value() {
        return this._value;
    }

    set value(value) {
        if (this._value !== value) {
            this.dirty = true;
        }
        this._value = value;
    }

    // @ts-ignore
    get ssm() {
        return this._ssm;
    }

    set ssm(ssm) {
        if (this._ssm !== ssm) {
            this.dirty = true;
        }
        this._ssm = ssm;
    }

    static emptyFm(name: string) {
        return new FmArinc429OutputWord(name, 0);
    }

    async writeToSimVarIfDirty() {
        if (this.dirty) {
            this.dirty = false;
            return Promise.all([
                Arinc429Word.toSimVarValue(`L:A32NX_FM1_${this.name}`, this.value, this.ssm),
                Arinc429Word.toSimVarValue(`L:A32NX_FM2_${this.name}`, this.value, this.ssm),
            ]);
        }
        return Promise.resolve();
    }

    setBnrValue(value: number, ssm: number, bits: number, rangeMax: number, rangeMin = 0) {
        const quantum = Math.max(Math.abs(rangeMin), rangeMax) / 2 ** bits;
        const data = Math.max(rangeMin, Math.min(rangeMax, Math.round(value / quantum) * quantum));

        this.value = data;
        this.ssm = ssm;
    }
}
