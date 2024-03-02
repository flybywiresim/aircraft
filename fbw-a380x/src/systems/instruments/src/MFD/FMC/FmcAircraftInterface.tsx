/* eslint-disable jsx-a11y/label-has-associated-control */

import { EventBus, SimVarValueType } from '@microsoft/msfs-sdk';
import { Arinc429SignStatusMatrix, Arinc429Word, MathUtils } from '@flybywiresim/fbw-sdk';
import { FmsOansData } from 'instruments/src/MsfsAvionicsCommon/providers/FmsOansPublisher';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { FlightPlanService } from '@fmgc/index';
import { MmrRadioTuningStatus } from '@fmgc/navigation/NavaidTuner';
import { Vmo, maxCertifiedAlt, maxGw, maxZfw } from '@shared/PerformanceConstants';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmgcDataService } from 'instruments/src/MFD/FMC/fmgc';
import { ADIRS } from 'instruments/src/MFD/shared/Adirs';
import { NXSystemMessages } from 'instruments/src/MFD/shared/NXSystemMessages';
import { A380OperatingSpeeds, A380OperatingSpeedsApproach, A380SpeedsUtils } from '@shared/OperatingSpeeds';
import { FmcInterface } from 'instruments/src/MFD/FMC/FmcInterface';
import { bearingTo, distanceTo, placeBearingDistance } from 'msfs-geo';

/**
 * Interface between FMS and rest of aircraft through SimVars and ARINC values (mostly data being sent here)
 * Essentially part of the FMC (-A/-B/-C)
 */
export class FmcAircraftInterface {
    constructor(
        private bus: EventBus,
        private fmc: FmcInterface,
        private fmgc: FmgcDataService,
        private flightPlanService: FlightPlanService,
    ) {
    }

    // ARINC words
    // arinc bus output words
    public arincDiscreteWord2 = FmArinc429OutputWord.emptyFm('DISCRETE_WORD_2');

    public arincDiscreteWord3 = FmArinc429OutputWord.emptyFm('DISCRETE_WORD_3');

    public arincTakeoffPitchTrim = FmArinc429OutputWord.emptyFm('TO_PITCH_TRIM');

    public arincLandingElevation = FmArinc429OutputWord.emptyFm('LANDING_ELEVATION');

    public arincDestinationLatitude = FmArinc429OutputWord.emptyFm('DEST_LAT');

    public arincDestinationLongitude = FmArinc429OutputWord.emptyFm('DEST_LONG');

    public arincMDA = FmArinc429OutputWord.emptyFm('MINIMUM_DESCENT_ALTITUDE');

    public arincDH = FmArinc429OutputWord.emptyFm('DECISION_HEIGHT');

    public arincThrustReductionAltitude = FmArinc429OutputWord.emptyFm('THR_RED_ALT');

    public arincAccelerationAltitude = FmArinc429OutputWord.emptyFm('ACC_ALT');

    public arincEoAccelerationAltitude = FmArinc429OutputWord.emptyFm('EO_ACC_ALT');

    public arincMissedThrustReductionAltitude = FmArinc429OutputWord.emptyFm('MISSED_THR_RED_ALT');

    public arincMissedAccelerationAltitude = FmArinc429OutputWord.emptyFm('MISSED_ACC_ALT');

    public arincMissedEoAccelerationAltitude = FmArinc429OutputWord.emptyFm('MISSED_EO_ACC_ALT');

    public arincTransitionAltitude = FmArinc429OutputWord.emptyFm('TRANS_ALT');

    public arincTransitionLevel = FmArinc429OutputWord.emptyFm('TRANS_LVL');

    /** contains fm messages (not yet implemented) and nodh bit */
    public arincEisWord2 = FmArinc429OutputWord.emptyFm('EIS_DISCRETE_WORD_2');

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

    thrustReductionAccelerationChecks() {
        // TODO port over (fms-v2)
        // const activePlan = this.flightPlanService.active;

        // if (activePlan.reconcileAccelerationWithConstraints()) {
        //     this.addMessageToQueue(NXSystemMessages.newAccAlt.getModifiedMessage(activePlan.accelerationAltitude.toFixed(0)));
        // }

        // if (activePlan.reconcileThrustReductionWithConstraints()) {
        //     this.addMessageToQueue(NXSystemMessages.newThrRedAlt.getModifiedMessage(activePlan.thrustReductionAltitude.toFixed(0)));
        // }
    }

    public updateThrustReductionAcceleration() {
        if (!this.flightPlanService.hasActive) {
            return;
        }
        const activePerformanceData = this.flightPlanService.active.performanceData;

        this.arincThrustReductionAltitude.setBnrValue(
            activePerformanceData.thrustReductionAltitude !== undefined ? activePerformanceData.thrustReductionAltitude : 0,
            activePerformanceData.thrustReductionAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincAccelerationAltitude.setBnrValue(
            activePerformanceData.accelerationAltitude !== undefined ? activePerformanceData.accelerationAltitude : 0,
            activePerformanceData.accelerationAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincEoAccelerationAltitude.setBnrValue(
            activePerformanceData.engineOutAccelerationAltitude !== undefined ? activePerformanceData.engineOutAccelerationAltitude : 0,
            activePerformanceData.engineOutAccelerationAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );

        this.arincMissedThrustReductionAltitude.setBnrValue(
            activePerformanceData.missedThrustReductionAltitude !== undefined ? activePerformanceData.missedThrustReductionAltitude : 0,
            activePerformanceData.missedThrustReductionAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincMissedAccelerationAltitude.setBnrValue(
            activePerformanceData.missedAccelerationAltitude !== undefined ? activePerformanceData.missedAccelerationAltitude : 0,
            activePerformanceData.missedAccelerationAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
        this.arincMissedEoAccelerationAltitude.setBnrValue(
            activePerformanceData.missedEngineOutAccelerationAltitude !== undefined ? activePerformanceData.missedEngineOutAccelerationAltitude : 0,
            activePerformanceData.missedEngineOutAccelerationAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            17, 131072, 0,
        );
    }

    public updateTransitionAltitudeLevel(): void {
        if (!this.flightPlanService.hasActive) {
            return;
        }
        const originTransitionAltitude = this.flightPlanService.active.performanceData.transitionAltitude; // as altitude
        const destinationTransitionLevel = this.flightPlanService.active.performanceData.transitionLevel ?? 18_000; // as FL

        if (Number.isFinite(originTransitionAltitude)) {
            this.arincTransitionAltitude.setBnrValue(
                originTransitionAltitude !== undefined ? originTransitionAltitude : 0,
                originTransitionAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
                17, 131072, 0,
            );

            // Delete once new PFD is integrated
            SimVar.SetSimVarValue('L:AIRLINER_TRANS_ALT', 'Number', originTransitionAltitude ?? 0);
        }

        if (Number.isFinite(destinationTransitionLevel)) {
            this.arincTransitionLevel.setBnrValue(
                destinationTransitionLevel !== undefined ? destinationTransitionLevel : 0,
                destinationTransitionLevel !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
                9, 512, 0,
            );

            // Delete once new PFD is integrated
            SimVar.SetSimVarValue('L:AIRLINER_APPR_TRANS_ALT', 'Number', destinationTransitionLevel * 100 ?? 0);
        }
    }

    public updatePerformanceData() {
        if (!this.flightPlanService.hasActive) {
            return;
        }

        // If spawned after T/O, set reasonable V2
        if (this.fmgc.getFlightPhase() > FmgcFlightPhase.Preflight && !this.flightPlanService.active.performanceData.v2) {
            const fSpeed = SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number') as number;
            this.flightPlanService.setPerformanceData('v2', Math.round(fSpeed));
        }

        SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'Knots', this.flightPlanService.active.performanceData.v1 ?? NaN);
        SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'Knots', this.flightPlanService.active.performanceData.v2 ?? NaN);
        SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'Knots', this.flightPlanService.active.performanceData.vr ?? NaN);
    }

    public getToSpeedsTooLow(): boolean {
        if (!this.flightPlanService.hasActive) {
            return false;
        }

        if (this.fmgc.data.takeoffFlapsSetting === null || this.fmc.getGrossWeight() === null) {
            return false;
        }

        const departureElevation = this.fmgc.getDepartureElevation();

        const zp = departureElevation !== null ? this.fmgc.getPressureAltAtElevation(departureElevation, this.fmgc.getBaroCorrection1()) : this.fmgc.getPressureAlt();
        if (zp === null) {
            return false;
        }

        const taxiFuel = this.fmgc.data.taxiFuel.get() ?? 0;
        const tow = (this.fmc.getGrossWeight() ?? maxGw) - (this.fmgc.isAnEngineOn() ? 0 : taxiFuel);

        return this.flightPlanService.active.performanceData.v1 < Math.trunc(A380SpeedsUtils.getVmcg(zp))
            || this.flightPlanService.active.performanceData.vr < Math.trunc(1.05 * A380SpeedsUtils.getVmca(zp))
            || this.flightPlanService.active.performanceData.v2 < Math.trunc(1.1 * A380SpeedsUtils.getVmca(zp))
            || (Number.isFinite(tow) && this.flightPlanService.active.performanceData.v2 < Math.trunc(1.13 * A380SpeedsUtils.getVs1g(tow / 1000, this.fmgc.data.takeoffFlapsSetting.get())));
    }

    private toSpeedsNotInserted = true;

    private toSpeedsTooLow = false;

    private vSpeedDisagree = false;

    private vSpeedsValid(): boolean {
        if (!this.flightPlanService.hasActive) {
            return false;
        }

        const v1Speed = this.flightPlanService.active.performanceData.v1;
        const vRSpeed = this.flightPlanService.active.performanceData.vr;
        const v2Speed = this.flightPlanService.active.performanceData.v2;

        return (!!v1Speed && !!vRSpeed ? v1Speed <= vRSpeed : true)
            && (!!vRSpeed && !!v2Speed ? vRSpeed <= v2Speed : true)
            && (!!v1Speed && !!v2Speed ? v1Speed <= v2Speed : true);
    }

    public toSpeedsChecks() {
        if (!this.flightPlanService.hasActive) {
            return;
        }

        const toSpeedsNotInserted = !this.flightPlanService.active.performanceData.v1 || !this.flightPlanService.active.performanceData.vr || !this.flightPlanService.active.performanceData.v2;
        if (toSpeedsNotInserted !== this.toSpeedsNotInserted) {
            this.toSpeedsNotInserted = toSpeedsNotInserted;
        }

        const toSpeedsTooLow = this.getToSpeedsTooLow();
        if (toSpeedsTooLow !== this.toSpeedsTooLow) {
            this.toSpeedsTooLow = toSpeedsTooLow;
            if (toSpeedsTooLow) {
                this.fmc.addMessageToQueue(NXSystemMessages.toSpeedTooLow, () => !this.getToSpeedsTooLow(), undefined);
            }
        }

        const vSpeedDisagree = !this.vSpeedsValid();
        if (vSpeedDisagree !== this.vSpeedDisagree) {
            this.vSpeedDisagree = vSpeedDisagree;
            if (vSpeedDisagree) {
                this.fmc.addMessageToQueue(NXSystemMessages.vToDisagree, () => this.vSpeedsValid(), undefined);
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
        SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_FLAPS', 'number', flaps !== null ? flaps : -1);

        this.arincDiscreteWord2.setBitValue(13, flaps === 0);
        this.arincDiscreteWord2.setBitValue(14, flaps === 1);
        this.arincDiscreteWord2.setBitValue(15, flaps === 2);
        this.arincDiscreteWord2.setBitValue(16, flaps === 3);
        this.arincDiscreteWord2.ssm = Arinc429SignStatusMatrix.NormalOperation;
    }

    /**
     * Set the takeoff trim config
     * @param ths trimmable horizontal stabilizer
     */
    setTakeoffTrim(ths: number) {
        // legacy vars
        SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_THS', 'degree', ths || 0);
        SimVar.SetSimVarValue('L:A32NX_TO_CONFIG_THS_ENTERED', 'bool', ths !== null);

        const ssm = ths !== null ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

        this.arincTakeoffPitchTrim.setBnrValue(ths ? -ths : 0, ssm, 12, 180, -180);
    }

    private landingElevation: number | null = null;

    private destinationLatitude: number | null = null;

    private destinationLongitude: number | null = null;

    async updateDestinationData() {
        let landingElevation: number | null = null;
        let latitude: number | null = null;
        let longitude: number | null = null;

        const runway = this.flightPlanService.active.destinationRunway;

        if (runway) {
            landingElevation = runway.thresholdLocation.alt;
            latitude = runway.thresholdLocation.lat;
            longitude = runway.thresholdLocation.long;
        } else {
            const airport = this.flightPlanService.active.destinationAirport;

            if (airport) {
                const ele = airport.location.alt;

                landingElevation = Number.isFinite(ele) ? ele : null;
                latitude = airport.location.lat;
                longitude = airport.location.long;
            }
        }

        if (this.landingElevation !== landingElevation) {
            this.landingElevation = landingElevation;

            const ssm = landingElevation !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

            this.arincLandingElevation.setBnrValue(landingElevation || 0, ssm, 14, 16384, -2048);

            // FIXME CPCs should use the FM ARINC vars, and transmit their own vars as well
            SimVar.SetSimVarValue('L:A32NX_PRESS_AUTO_LANDING_ELEVATION', 'feet', landingElevation || 0);
        }

        if (this.destinationLatitude !== latitude) {
            this.destinationLatitude = latitude;

            const ssm = latitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

            this.arincDestinationLatitude.setBnrValue(latitude || 0, ssm, 18, 180, -180);
        }

        if (this.destinationLongitude !== longitude) {
            this.destinationLongitude = longitude;

            const ssm = longitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

            this.arincDestinationLongitude.setBnrValue(longitude || 0, ssm, 18, 180, -180);
        }
    }

    updateMinimums(distanceToDestination: number) {
        const inRange = this.shouldTransmitMinimums(distanceToDestination);

        const mda = this.fmgc.data.approachBaroMinimum.get();
        const dh = this.fmgc.data.approachRadioMinimum.get();

        const mdaValid = inRange && mda !== null;
        const dhValid = !mdaValid && inRange && typeof dh === 'number';

        const mdaSsm = mdaValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;
        const dhSsm = dhValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

        this.arincMDA.setBnrValue(mdaValid ? mda as number : 0, mdaSsm, 17, 131072, 0);
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

    updateOansAirports() {
        if (this.flightPlanService.hasActive) {
            const pub = this.bus.getPublisher<FmsOansData>();
            if (this.flightPlanService.active?.originAirport?.ident) {
                pub.pub('fmsOrigin', this.flightPlanService.active.originAirport.ident, true);
            }

            if (this.flightPlanService.active?.destinationAirport?.ident) {
                pub.pub('fmsDestination', this.flightPlanService.active.destinationAirport.ident, true);
            }

            if (this.flightPlanService.active?.alternateDestinationAirport?.ident) {
                pub.pub('fmsAlternate', this.flightPlanService.active.alternateDestinationAirport.ident, true);
            }
        }
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

    updatePreSelSpeedMach(preSel: number | null) {
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

    /** in knots or mach */
    private managedSpeedTarget: number | null = null;

    private managedSpeedTargetIsMach = false;

    private holdDecelReached = false;

    private holdSpeedTarget = 0;

    private setHoldSpeedMessageActive = false;

    /** in knots */
    private takeoffEngineOutSpeed: number | null = null;

    updateManagedSpeed() {
        if (!this.flightPlanService.hasActive) {
            return;
        }
        const activePerformanceData = this.flightPlanService.active.performanceData;

        let vPfd: number = 0;
        let isMach = false;

        /* TODO port over
        this.updateHoldingSpeed();
        this.clearCheckSpeedModeMessage(); */

        if (SimVar.GetSimVarValue('L:A32NX_FMA_EXPEDITE_MODE', 'number') === 1) {
            const verticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'number');
            if (verticalMode === 12) {
                switch (SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number')) {
                case 0: {
                    this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
                    break;
                }
                case 1: {
                    this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number');
                    break;
                }
                default: {
                    this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
                }
                }
            } else if (verticalMode === 13) {
                this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number') === 0
                    ? Math.min(340, SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', 0.8))
                    : SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number') - 10;
            }
            vPfd = this.managedSpeedTarget ?? 0;
        } else if (this.holdDecelReached) {
            vPfd = this.holdSpeedTarget;
            this.managedSpeedTarget = this.holdSpeedTarget;
        } else {
            if (this.setHoldSpeedMessageActive) {
                this.setHoldSpeedMessageActive = false;
                SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false);
                this.fmc.removeMessageFromQueue(NXSystemMessages.setHoldSpeed.text);
            }

            const engineOut = !this.fmgc.isAllEngineOn();

            switch (this.fmgc.getFlightPhase()) {
            case FmgcFlightPhase.Preflight: {
                if (activePerformanceData.v2) {
                    vPfd = activePerformanceData.v2;
                    this.managedSpeedTarget = activePerformanceData.v2 + 10;
                }
                break;
            }
            case FmgcFlightPhase.Takeoff: {
                if (activePerformanceData.v2) {
                    vPfd = activePerformanceData.v2;
                    this.managedSpeedTarget = engineOut
                        ? Math.min(activePerformanceData.v2 + 15, Math.max(activePerformanceData.v2, this.takeoffEngineOutSpeed ? this.takeoffEngineOutSpeed : 0))
                        : activePerformanceData.v2 + 10;
                }
                break;
            }
            case FmgcFlightPhase.Climb: {
                let speed = this.fmgc.getManagedClimbSpeed();

                if (this.fmgc.getClimbSpeedLimit() !== undefined && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < this.fmgc.getClimbSpeedLimit().underAltitude) {
                    speed = Math.min(speed, this.fmgc.getClimbSpeedLimit().speed);
                }

                speed = Math.min(speed, this.getSpeedConstraint());

                [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.fmgc.getManagedClimbSpeedMach());
                vPfd = this.managedSpeedTarget ?? speed;
                break;
            }
            case FmgcFlightPhase.Cruise: {
                let speed = this.fmgc.getManagedCruiseSpeed();

                if (this.fmgc.getClimbSpeedLimit() !== undefined && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < this.fmgc.getClimbSpeedLimit().underAltitude) {
                    speed = Math.min(speed, this.fmgc.getClimbSpeedLimit().speed);
                }

                [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.fmgc.getManagedCruiseSpeedMach());
                vPfd = this.managedSpeedTarget ?? speed;
                break;
            }
            case FmgcFlightPhase.Descent: {
                // We fetch this data from VNAV
                vPfd = SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots');
                this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots');

                // Whether to use Mach or not should be based on the original managed speed, not whatever VNAV uses under the hood to vary it.
                // Also, VNAV already does the conversion from Mach if necessary
                isMach = this.getManagedTargets(this.fmgc.getManagedDescentSpeed(), this.fmgc.getManagedDescentSpeedMach())[1];
                break;
            }
            case FmgcFlightPhase.Approach: {
                // the displayed target is Vapp (with GSmini)
                // the guidance target is lower limited by FAC manouvering speeds (O, S, F) unless in landing config
                // constraints are not considered
                const speed = this.getAppManagedSpeed() ?? 0;
                vPfd = this.getVAppGsMini() ?? speed;

                this.managedSpeedTarget = Math.max(speed, vPfd);
                break;
            }
            case FmgcFlightPhase.GoAround: {
                if (SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'number') === 41 /* SRS GA */) {
                    const speed = Math.min(
                        this.fmgc.data.approachVls.get() + (engineOut ? 15 : 25),
                        Math.max(
                            SimVar.GetSimVarValue('L:A32NX_GOAROUND_INIT_SPEED', 'number'),
                            this.fmgc.data.approachSpeed.get() ?? 0,
                        ),
                        SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number') - 5,
                    );

                    vPfd = speed;
                    this.managedSpeedTarget = speed;
                } else {
                    const speedConstraint = this.getSpeedConstraint();
                    const speed = Math.min(this.fmgc.data.greenDotSpeed.get() ?? Infinity, speedConstraint);

                    vPfd = speed;
                    this.managedSpeedTarget = speed;
                }
                break;
            }
            default:
                break;
            }
        }

        // Automatically change fcu mach/speed mode
        if (this.managedSpeedTargetIsMach !== isMach) {
            if (isMach) {
                SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_ON', 'number', 1);
            } else {
                SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_OFF', 'number', 1);
            }
            this.managedSpeedTargetIsMach = isMach;
        }

        // Overspeed protection
        const Vtap = Math.min(this.managedSpeedTarget ?? Vmo, SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number'));

        SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots', vPfd);
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots', Vtap);

        if (this.isAirspeedManaged()) {
            Coherent.call('AP_SPD_VAR_SET', 0, Vtap).catch(console.error);
        }
    }

    getAppManagedSpeed() {
        switch (SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number')) {
        case 0: return this.fmgc.data.greenDotSpeed.get();
        case 1: return this.fmgc.data.slatRetractionSpeed.get();
        case 3: return this.fmgc.data.approachFlapConfig.get() === FlapConf.CONF_3 ? this.fmgc.data.approachSpeed.get() : this.fmgc.data.flapRetractionSpeed.get();
        case 4: return this.fmgc.data.approachSpeed.get();
        default: return this.fmgc.data.flapRetractionSpeed.get();
        }
    }

    getVAppGsMini() {
        let vAppTarget = this.fmgc.data.approachSpeed.get() ?? SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
        let towerHeadwind = 0;
        const appWind = this.fmgc.data.approachWind.get();
        const destRwy = this.fmgc.getDestinationRunway();
        if (appWind && Number.isFinite(appWind.speed) && Number.isFinite(appWind.direction)) {
            if (destRwy) {
                towerHeadwind = A380SpeedsUtils.getHeadwind(
                    appWind.speed,
                    appWind.direction,
                    destRwy.magneticBearing,
                );
            }
            vAppTarget = A380SpeedsUtils.getVtargetGSMini(vAppTarget, A380SpeedsUtils.getHeadWindDiff(towerHeadwind));
        }
        return vAppTarget;
    }

    private speedLimitExceeded = false;

    checkSpeedLimit() {
        let speedLimit: number;
        let speedLimitAlt: number;
        switch (this.fmgc.getFlightPhase()) {
        case FmgcFlightPhase.Climb:
        case FmgcFlightPhase.Cruise:
            speedLimit = this.fmgc.getClimbSpeedLimit().speed;
            speedLimitAlt = this.fmgc.getClimbSpeedLimit().underAltitude;
            break;
        case FmgcFlightPhase.Descent:
            speedLimit = this.fmgc.getDescentSpeedLimit().speed;
            speedLimitAlt = this.fmgc.getDescentSpeedLimit().underAltitude;
            break;
        default:
            // no speed limit in other phases
            this.speedLimitExceeded = false;
            return;
        }

        if (speedLimit === undefined) {
            this.speedLimitExceeded = false;
            return;
        }

        const cas = ADIRS.getCalibratedAirspeed();
        const alt = ADIRS.getBaroCorrectedAltitude();

        if (this.speedLimitExceeded && cas && alt) {
            const resetLimitExceeded = !cas.isNormalOperation() || !alt.isNormalOperation() || alt.value > speedLimitAlt || cas.value <= (speedLimit + 5);
            if (resetLimitExceeded) {
                this.speedLimitExceeded = false;
                this.fmc.removeMessageFromQueue(NXSystemMessages.spdLimExceeded.text);
            }
        } else if (cas && alt && cas.isNormalOperation() && alt.isNormalOperation()) {
            const setLimitExceeded = alt.value < (speedLimitAlt - 150) && cas.value > (speedLimit + 10);
            if (setLimitExceeded) {
                this.speedLimitExceeded = true;
                this.fmc.addMessageToQueue(NXSystemMessages.spdLimExceeded, () => !this.speedLimitExceeded, undefined);
            }
        }
    }

    private apMasterStatus: boolean = false;

    private lastUpdateAPTime: number = 0;

    private updateAutopilotCooldown: number = 0;

    private apCooldown: number = 500;

    private forceNextAltitudeUpdate: boolean = true;

    private activeWpIdx: number = 0;

    /** in feet */
    private constraintAlt: number | null = null;

    private lastRequestedFLCModeWaypointIndex: number | null = null;

    updateAutopilot(dt: number) {
        let apLogicOn = (this.apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1));
        this.lastUpdateAPTime = Date.now();
        if (Number.isFinite(dt)) {
            this.updateAutopilotCooldown -= dt;
        }
        if (SimVar.GetSimVarValue('L:AIRLINER_FMC_FORCE_NEXT_UPDATE', 'number') === 1) {
            SimVar.SetSimVarValue('L:AIRLINER_FMC_FORCE_NEXT_UPDATE', 'number', 0);
            this.updateAutopilotCooldown = -1;
        }

        if (this.fmgc.getFlightPhase() === FmgcFlightPhase.Takeoff && !this.fmgc.isAllEngineOn() && this.takeoffEngineOutSpeed === undefined) {
            const casWord = ADIRS.getCalibratedAirspeed();
            this.takeoffEngineOutSpeed = casWord && casWord.isNormalOperation() ? casWord.value : null;
        }

        if (this.updateAutopilotCooldown < 0) {
            this.updatePerfSpeeds();
            this.updateConstraints();
            this.updateManagedSpeed();
            const currentApMasterStatus = SimVar.GetSimVarValue('AUTOPILOT MASTER', 'boolean');
            if (currentApMasterStatus !== this.apMasterStatus) {
                this.apMasterStatus = currentApMasterStatus;
                apLogicOn = (this.apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1));
                this.forceNextAltitudeUpdate = true;
                console.log('Enforce AP in Altitude Lock mode. Cause : AP Master Status has changed.');
                SimVar.SetSimVarValue('L:A320_NEO_FCU_FORCE_IDLE_VS', 'Number', 1);
                if (this.apMasterStatus) {
                    if (this.flightPlanService.hasActive && this.flightPlanService.active.legCount === 0) {
                        this.onModeSelectedAltitude();
                        this.onModeSelectedHeading();
                    }
                }
            }
            if (apLogicOn) {
                if (!Simplane.getAutoPilotFLCActive() && !SimVar.GetSimVarValue('AUTOPILOT AIRSPEED HOLD', 'Boolean')) {
                    SimVar.SetSimVarValue('K:AP_PANEL_SPEED_HOLD', 'Number', 1);
                }
                if (!SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'Boolean')) {
                    if (!SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'Boolean')) {
                        SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'Number', 1);
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
                        Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, this.constraintAlt, this.forceNextAltitudeUpdate).catch(console.error);
                        this.forceNextAltitudeUpdate = false;
                    } else {
                        const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue('feet');
                        if (Number.isFinite(altitude)) {
                            Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, altitude, this.forceNextAltitudeUpdate).catch(console.error);
                            this.forceNextAltitudeUpdate = false;
                        }
                    }
                } else {
                    const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue('feet');
                    if (Number.isFinite(altitude)) {
                        SimVar.SetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet', 0);
                        Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, altitude, this.forceNextAltitudeUpdate).catch(console.error);
                        this.forceNextAltitudeUpdate = false;
                    }
                }
            }

            if (Simplane.getAutoPilotAltitudeManaged() && this.flightPlanService.hasActive && SimVar.GetSimVarValue('L:A320_NEO_FCU_STATE', 'number') !== 1) {
                const currentWaypointIndex = this.flightPlanService.active.activeLegIndex;
                if (currentWaypointIndex !== this.lastRequestedFLCModeWaypointIndex) {
                    this.lastRequestedFLCModeWaypointIndex = currentWaypointIndex;
                    setTimeout(() => {
                        if (Simplane.getAutoPilotAltitudeManaged()) {
                            this.onModeManagedAltitude();
                        }
                    }, 1000);
                }
            }

            if (this.fmgc.getFlightPhase() === FmgcFlightPhase.GoAround && apLogicOn) {
                // depending if on HDR/TRK or NAV mode, select appropriate Alt Mode (WIP)
                // this._onModeManagedAltitude();
                this.onModeSelectedAltitude();
            }
            this.updateAutopilotCooldown = this.apCooldown;
        }
    }

    /**
     * Tries to estimate the landing weight at destination
     * NaN on failure
     */
    tryEstimateLandingWeight() {
        const altActive = false;
        const landingWeight = this.fmgc.data.zeroFuelWeight.get() ?? maxZfw + (altActive ? this.fmgc.getAltEFOB(true) : this.fmgc.getDestEFOB(true));

        return Number.isFinite(landingWeight) ? landingWeight : NaN;
    }

    /**
     * Updates performance speeds such as GD, F, S, Vls and approach speeds. Write to SimVars
     */
    updatePerfSpeeds() {
        /** in kg */
        let weight: number | null = this.tryEstimateLandingWeight();
        const gw = this.fmc.getGrossWeight() ?? maxGw;
        const vnavPrediction = this.fmc.guidanceController?.vnavDriver?.getDestinationPrediction();
        // Actual weight is used during approach phase (FCOM bulletin 46/2), and we also assume during go-around
        // Fallback gross weight set to MZFW, which is replaced by FMGW once input in FMS to avoid function returning undefined results.
        if (this.fmgc.getFlightPhase() >= FmgcFlightPhase.Approach || !Number.isFinite(weight)) {
            weight = gw;
        } else if (vnavPrediction && Number.isFinite(vnavPrediction.estimatedFuelOnBoard)) {
            weight = (this.fmgc.data.zeroFuelWeight.get() ?? maxZfw) + Math.max(0, vnavPrediction.estimatedFuelOnBoard * 0.4535934);
        }

        if (!weight) {
            weight = maxGw;
        }

        // if pilot has set approach wind in MCDU we use it, otherwise fall back to current measured wind
        const appWind = this.fmgc.data.approachWind.get();
        let towerHeadwind = 0;
        if (appWind && Number.isFinite(appWind.speed) && Number.isFinite(appWind.direction)) {
            if (this.flightPlanService.active.destinationRunway) {
                towerHeadwind = A380SpeedsUtils.getHeadwind(
                    appWind.speed,
                    appWind.direction,
                    this.flightPlanService.active.destinationRunway.magneticBearing,
                );
            }
        }
        const approachSpeeds = new A380OperatingSpeedsApproach(weight / 1000, this.fmgc.data.approachFlapConfig.get() === FlapConf.CONF_3, towerHeadwind);
        this.fmgc.data.approachSpeed.set(Math.ceil(approachSpeeds.vapp));
        this.fmgc.data.approachVls.set(Math.ceil(approachSpeeds.vls));
        this.fmgc.data.approachVref.set(Math.ceil(approachSpeeds.vref));

        const flaps = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Enum');
        const gearPos = Math.round(SimVar.GetSimVarValue('GEAR POSITION:0', 'Enum'));
        const speeds = new A380OperatingSpeeds(gw / 1000, flaps, gearPos);
        speeds.compensateForMachEffect(Math.round(Simplane.getAltitude() ?? 0));

        SimVar.SetSimVarValue('L:A32NX_SPEEDS_VS', 'number', speeds.vs);
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_VLS', 'number', speeds.vls);
        if (this.fmgc.data.takeoffFlapsSetting.get() && this.fmgc.data.takeoffFlapsSetting.get() === FlapConf.CONF_3) {
            SimVar.SetSimVarValue('L:A32NX_SPEEDS_F', 'number', speeds.f3);
            this.fmgc.data.flapRetractionSpeed.set(Math.ceil(speeds.f3));
        } else {
            SimVar.SetSimVarValue('L:A32NX_SPEEDS_F', 'number', speeds.f2);
            this.fmgc.data.greenDotSpeed.set(Math.ceil(speeds.f2));
        }
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_S', 'number', speeds.s);
        this.fmgc.data.slatRetractionSpeed.set(Math.ceil(speeds.s));
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_GD', 'number', speeds.gd);
        this.fmgc.data.greenDotSpeed.set(Math.ceil(speeds.gd));
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', 'boolean', this.fmgc.data.approachFlapConfig.get() === FlapConf.CONF_3);
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number', speeds.vmax);
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_VFEN', 'number', speeds.vfeN);
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC', 'number', speeds.vs * 1.1);
        SimVar.SetSimVarValue('L:A32NX_SPEEDS_ALPHA_MAX_CALC', 'number', speeds.vs * 1.03);
    }

    /** Write gross weight to SimVar */
    updateWeights() {
        const gw = this.fmc.getGrossWeight();
        SimVar.SetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number', gw);

        if (this.fmc.enginesWereStarted.get() === true) {
            this.fmc.fmgc.data.blockFuel.set(this.fmc.fmgc.getFOB() * 1_000);
        }
    }

    /**
     * Update pax number to be used by air conditioning system (to regulate air flow)
     * @param paxNumber Number of passengers, 0-999
     */
    // FIXME AFDX candidate
    updatePaxNumber(paxNumber: number) {
        SimVar.SetSimVarValue('L:A32NX_FMS_PAX_NUMBER', 'number', paxNumber);
    }

    updateConstraints() {
        const activeFpIndex = this.flightPlanService.activeLegIndex;
        const constraints = this.managedProfile.get(activeFpIndex);
        const fcuSelAlt = Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') ?? 0;

        let constraintAlt = 0;
        if (constraints) {
            const phase = this.fmgc.getFlightPhase();
            if ((phase < FmgcFlightPhase.Cruise || phase === FmgcFlightPhase.GoAround) && Number.isFinite(constraints.climbAltitude) && constraints.climbAltitude < fcuSelAlt) {
                constraintAlt = constraints.climbAltitude;
            }

            if ((phase > FmgcFlightPhase.Cruise && phase < FmgcFlightPhase.GoAround) && Number.isFinite(constraints.descentAltitude) && constraints.descentAltitude > fcuSelAlt) {
                constraintAlt = constraints.descentAltitude;
            }
        }

        if (constraintAlt !== this.constraintAlt) {
            this.constraintAlt = constraintAlt;
            SimVar.SetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet', this.constraintAlt);
        }
    }

    /**
     * FIXME: Placeholder for BTV data, as long as we don't have the OANS UI
     * Uses chosen landing runway from FMS, and transmits overall length, desired stopping distance,
     * and remaining distance until desired stop.
     */
    updateBtvData() {
        if (!this.flightPlanService.hasActive) {
            return;
        }

        const rwy = this.flightPlanService?.active?.destinationRunway;

        // Only compute if FMS runway is set and aircraft in approach mode
        if (rwy) {
            const fwcFlightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', SimVarValueType.Enum);
            this.bus.getPublisher<FmsOansData>().pub('fmsLandingRunway', rwy.ident, true);
            SimVar.SetSimVarValue('L:A32NX_OANS_BTV_RWY_LENGTH', SimVarValueType.Meters, rwy.length);

            if (fwcFlightPhase >= 7 && fwcFlightPhase < 10) {
                const reqDistance = SimVar.GetSimVarValue('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE', SimVarValueType.Meters);
                // If no stopping distance requested, stop within 75% of runway length
                const desiredStoppingDistance = (reqDistance > 0 && reqDistance <= rwy.length) ? reqDistance : (0.75 * rwy.length);
                const stopPoint = placeBearingDistance(rwy.startLocation, rwy.bearing, desiredStoppingDistance / MathUtils.METRES_TO_NAUTICAL_MILES);
                const rwyEndPoint = placeBearingDistance(rwy.startLocation, rwy.bearing, rwy.length / MathUtils.METRES_TO_NAUTICAL_MILES);

                const ppos = this.fmc.navigation.getPpos();
                if (ppos) {
                    const distanceToRwyEnd = distanceTo(ppos, rwyEndPoint) * MathUtils.METRES_TO_NAUTICAL_MILES;
                    const isBehindRwyEnd = Math.abs(bearingTo(ppos, rwyEndPoint) - rwy.bearing) > 135;
                    SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END', SimVarValueType.Meters, Math.min(rwy.length, isBehindRwyEnd ? -distanceToRwyEnd : distanceToRwyEnd));

                    const distanceToExit = distanceTo(ppos, stopPoint) * MathUtils.METRES_TO_NAUTICAL_MILES;
                    const isBehindExit = Math.abs(bearingTo(ppos, stopPoint) - rwy.bearing) > 135;
                    SimVar.SetSimVarValue('L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT', SimVarValueType.Meters, Math.min(rwy.length, isBehindExit ? -distanceToExit : distanceToExit));
                }
            }
        }
    }

    public onEvent(event: string): void {
        if (event === 'MODE_SELECTED_HEADING' || event === 'A320_Neo_CDU_MODE_SELECTED_HEADING') {
            if (Simplane.getAutoPilotHeadingManaged()) {
                if (SimVar.GetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number') === 0) {
                    const currentHeading = Simplane.getHeadingMagnetic();

                    Coherent.call('HEADING_BUG_SET', 1, currentHeading).catch(console.error);
                }
            }
            this.onModeSelectedHeading();
        }
        if (event === 'MODE_MANAGED_HEADING' || event === 'A320_Neo_CDU_MODE_MANAGED_HEADING') {
            if (this.flightPlanService.active.legCount === 0) {
                return;
            }

            this.onModeManagedHeading();
        }
        if (event === 'MODE_SELECTED_ALTITUDE' || event === 'A320_Neo_CDU_MODE_SELECTED_ALTITUDE') {
            const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
            if (dist) {
                this.fmc.handleFcuAltKnobPushPull(dist);
            }
            this.onModeSelectedAltitude();
            this.onStepClimbDescent();
        }
        if (event === 'MODE_MANAGED_ALTITUDE' || event === 'A320_Neo_CDU_MODE_MANAGED_ALTITUDE') {
            const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
            if (dist) {
                this.fmc.handleFcuAltKnobPushPull(dist);
            }
            this.onModeManagedAltitude();
            this.onStepClimbDescent();
        }
        if (event === 'AP_DEC_ALT' || event === 'AP_INC_ALT' || event === 'A320_Neo_CDU_AP_DEC_ALT' || event === 'A320_Neo_CDU_AP_INC_ALT') {
            const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
            if (dist) {
                this.fmc.handleFcuAltKnobTurn(dist);
            }
            this.onTrySetCruiseFlightLevel();
        }
        if (event === 'AP_DEC_HEADING' || event === 'AP_INC_HEADING' || event === 'A320_Neo_CDU_AP_DEC_HEADING' || event === 'A320_Neo_CDU_AP_INC_HEADING') {
            if (SimVar.GetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number') === 0) {
                const currentHeading = Simplane.getHeadingMagnetic();
                Coherent.call('HEADING_BUG_SET', 1, currentHeading).catch(console.error);
            }
            SimVar.SetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number', 1);
        }
        if (event === 'VS' || event === 'A320_Neo_CDU_VS') {
            const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
            if (dist) {
                this.fmc.handleFcuVSKnob(dist, this.onStepClimbDescent.bind(this));
            }
        }
    }

    onModeSelectedHeading() {
        if (SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'boolean')) {
            return;
        }
        if (!SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'Boolean')) {
            SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'Number', 1);
        }
        SimVar.SetSimVarValue('K:HEADING_SLOT_INDEX_SET', 'number', 1);
    }

    onModeManagedHeading() {
        if (SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'boolean')) {
            return;
        }
        if (!SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'Boolean')) {
            SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'Number', 1);
        }
        SimVar.SetSimVarValue('K:HEADING_SLOT_INDEX_SET', 'number', 2);
        SimVar.SetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number', 0);
    }

    onModeSelectedAltitude() {
        if (!Simplane.getAutoPilotGlideslopeHold()) {
            SimVar.SetSimVarValue('L:A320_NEO_FCU_FORCE_IDLE_VS', 'Number', 1);
        }
        SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 1);
        Coherent.call('AP_ALT_VAR_SET_ENGLISH', 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this.forceNextAltitudeUpdate).catch(console.error);
    }

    onModeManagedAltitude() {
        SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 2);
        Coherent.call('AP_ALT_VAR_SET_ENGLISH', 1, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this.forceNextAltitudeUpdate).catch(console.error);
        Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, Simplane.getAutoPilotDisplayedAltitudeLockValue(), this.forceNextAltitudeUpdate).catch(console.error);
        if (!Simplane.getAutoPilotGlideslopeHold()) {
            SimVar.SetSimVarValue('L:A320_NEO_FCU_FORCE_IDLE_VS', 'Number', 1);
        }
    }

    onStepClimbDescent() {
        if (!(this.fmgc.getFlightPhase() === FmgcFlightPhase.Climb || this.fmgc.getFlightPhase() === FmgcFlightPhase.Cruise)) {
            return;
        }

        const targetFl = (Simplane.getAutoPilotDisplayedAltitudeLockValue() ?? 0) / 100;

        if (
            (this.fmgc.getFlightPhase() === FmgcFlightPhase.Climb && targetFl > this.flightPlanService.active.performanceData.cruiseFlightLevel)
            || (this.fmgc.getFlightPhase() === FmgcFlightPhase.Cruise && targetFl !== this.flightPlanService.active.performanceData.cruiseFlightLevel)
        ) {
            this.deleteOutdatedCruiseSteps(this.flightPlanService.active.performanceData.cruiseFlightLevel, targetFl);
            this.fmc.addMessageToQueue(NXSystemMessages.newCrzAlt.getModifiedMessage((targetFl * 100).toFixed(0)), undefined, undefined);
            this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', targetFl);
            SimVar.SetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number', targetFl * 100);
        }
    }

    deleteOutdatedCruiseSteps(oldCruiseLevel: number, newCruiseLevel: number) {
        const isClimbVsDescent = newCruiseLevel > oldCruiseLevel;

        const activePlan = this.flightPlanService.active;

        for (let i = activePlan.activeLegIndex; i < activePlan.legCount; i++) {
            const element = activePlan.elementAt(i);

            if (!element || element.isDiscontinuity === true || !element.cruiseStep) {
                continue;
            }

            const stepLevel = Math.round(element.cruiseStep.toAltitude / 100);

            if (isClimbVsDescent && stepLevel >= oldCruiseLevel && stepLevel <= newCruiseLevel
                    || !isClimbVsDescent && stepLevel <= oldCruiseLevel && stepLevel >= newCruiseLevel
            ) {
                element.cruiseStep = undefined; // TODO call a method on FPS so that we sync this (fms-v2)
                this.fmc.removeMessageFromQueue(NXSystemMessages.stepAhead.text);
            }
        }
    }

    private cruiseFlightLevelTimeOut: number | null = null;

    /**
     * Executed on every alt knob turn, checks whether or not the crz fl can be changed to the newly selected fcu altitude
     * It creates a timeout to simulate real life delay which resets every time the fcu knob alt increases or decreases.
     * @private
     */
    private onTrySetCruiseFlightLevel() {
        if (!(this.fmgc.getFlightPhase() === FmgcFlightPhase.Climb || this.fmgc.getFlightPhase() === FmgcFlightPhase.Cruise)) {
            return;
        }

        const activeVerticalMode = SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'enum');

        if ((activeVerticalMode >= 11 && activeVerticalMode <= 15) || (activeVerticalMode >= 21 && activeVerticalMode <= 23)) {
            const fcuFl = (Simplane.getAutoPilotDisplayedAltitudeLockValue() ?? 0) / 100;

            if (this.fmgc.getFlightPhase() === FmgcFlightPhase.Climb && fcuFl > this.flightPlanService.active.performanceData.cruiseFlightLevel
            || this.fmgc.getFlightPhase() === FmgcFlightPhase.Cruise && fcuFl !== this.flightPlanService.active.performanceData.cruiseFlightLevel
            ) {
                if (this.cruiseFlightLevelTimeOut) {
                    clearTimeout(this.cruiseFlightLevelTimeOut);
                    this.cruiseFlightLevelTimeOut = null;
                }

                this.cruiseFlightLevelTimeOut = setTimeout(() => {
                    if (fcuFl === ((Simplane.getAutoPilotDisplayedAltitudeLockValue() ?? 0) / 100)
                        && (
                            this.fmgc.getFlightPhase() === FmgcFlightPhase.Climb && fcuFl > this.flightPlanService.active.performanceData.cruiseFlightLevel
                            || this.fmgc.getFlightPhase() === FmgcFlightPhase.Cruise && fcuFl !== this.flightPlanService.active.performanceData.cruiseFlightLevel
                        )
                    ) {
                        this.fmc.addMessageToQueue(NXSystemMessages.newCrzAlt.getModifiedMessage((fcuFl * 100).toFixed(0)), undefined, undefined);
                        this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', fcuFl);
                        // used by FlightPhaseManager
                        SimVar.SetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number', fcuFl * 100);
                    }
                }, 3000);
            }
        }
    }

    /**
     * Sets new Cruise FL if all conditions good
     * @param fl Altitude or FL
     * @returns input passed checks
     */
    private trySetCruiseFl(fl: number): boolean {
        if (!this.flightPlanService.hasActive) {
            return false;
        }

        if (!Number.isFinite(fl)) {
            this.fmc.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
            return false;
        }
        if (fl > (this.fmc.getRecMaxFlightLevel() ?? (maxCertifiedAlt / 100))) {
            this.fmc.addMessageToQueue(NXSystemMessages.entryOutOfRange, undefined, undefined);
            return false;
        }
        const phase = this.fmgc.getFlightPhase();
        const selFl = Math.floor(Math.max(0, Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') ?? 0) / 100);
        if (fl < selFl && (phase === FmgcFlightPhase.Climb || phase === FmgcFlightPhase.Approach || phase === FmgcFlightPhase.GoAround)) {
            this.fmc.addMessageToQueue(NXSystemMessages.entryOutOfRange, undefined, undefined);
            return false;
        }

        if (fl <= 0 || fl > (this.fmc.getRecMaxFlightLevel() ?? (maxCertifiedAlt / 100))) {
            this.fmc.addMessageToQueue(NXSystemMessages.entryOutOfRange, undefined, undefined);
            return false;
        }

        this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', fl);
        this.onUpdateCruiseLevel(fl);

        return true;
    }

    /**
     *
     * @param newFl FL in 100 increments (e.g. 240 for 24000ft)
     */
    public setCruiseFl(newFl: number) {
        const ret = this.trySetCruiseFl(newFl);
        if (ret) {
            if (SimVar.GetSimVarValue('L:A32NX_CRZ_ALT_SET_INITIAL', 'bool') === 1 && SimVar.GetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool') === 1) {
                SimVar.SetSimVarValue('L:A32NX_NEW_CRZ_ALT', 'number', this.flightPlanService.active.performanceData.cruiseFlightLevel);
            } else {
                SimVar.SetSimVarValue('L:A32NX_CRZ_ALT_SET_INITIAL', 'bool', 1);
            }
        }
    }

    /**
     * called when cruise FL is updated through FMS
     * @param newCruiseLevel as flight level
     */
    onUpdateCruiseLevel(newCruiseLevel: number) {
        SimVar.SetSimVarValue('L:AIRLINER_CRUISE_ALTITUDE', 'number', newCruiseLevel * 100);
        this.updateConstraints();

        this.fmc.handleNewCruiseAltitudeEntered(newCruiseLevel);
    }

    navModeEngaged() {
        const lateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number');
        switch (lateralMode) {
        case 20: // NAV
        case 30: // LOC*
        case 31: // LOC
        case 32: // LAND
        case 33: // FLARE
        case 34: // ROLL OUT
            return true;
        default: return false;
        }
    }

    // TODO: make this util or local var?
    isAirspeedManaged() {
        return SimVar.GetSimVarValue('AUTOPILOT SPEED SLOT INDEX', 'number') === 2;
    }

    // TODO: make this util or local var?
    isHeadingManaged() {
        return SimVar.GetSimVarValue('AUTOPILOT HEADING SLOT INDEX', 'number') === 2;
    }

    // TODO: make this util or local var?
    isAltitudeManaged() {
        return SimVar.GetSimVarValue('AUTOPILOT ALTITUDE SLOT INDEX', 'number') === 2;
    }

    getManagedTargets(v: number, m: number) {
        const alt = ADIRS.getBaroCorrectedAltitude();
        const vM = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', m);
        return (alt && alt.isNormalOperation() && alt.value > 20_000 && v > vM) ? [vM, true] : [v, false];
    }

    // TODO/VNAV: Speed constraint
    getSpeedConstraint() {
        if (!this.navModeEngaged()) {
            return Infinity;
        }

        return this.getNavModeSpeedConstraint();
    }

    // TODO better decel distance calc
    calculateDecelDist(fromSpeed: number, toSpeed: number) {
        return Math.min(20, Math.max(3, (fromSpeed - toSpeed) * 0.15));
    }

    getNavModeSpeedConstraint() {
        const transIndex = this.fmgc.guidanceController?.activeTransIndex ?? 0;
        const activeLegIndex = (transIndex >= 0 ? transIndex : this.fmgc.guidanceController?.activeLegIndex) ?? 0;
        const constraints = this.managedProfile.get(activeLegIndex);
        if (constraints) {
            if (this.fmgc.getFlightPhase() < FmgcFlightPhase.Cruise || this.fmgc.getFlightPhase() === FmgcFlightPhase.GoAround) {
                return constraints.climbSpeed;
            }

            if (this.fmgc.getFlightPhase() > FmgcFlightPhase.Cruise && this.fmgc.getFlightPhase() < FmgcFlightPhase.GoAround) {
                // FIXME proper decel calc
                // eslint-disable-next-line max-len
                if ((this.fmgc.guidanceController?.activeLegDtg ?? 0) < this.calculateDecelDist(Math.min(constraints.previousDescentSpeed, this.fmgc.getManagedDescentSpeed()), constraints.descentSpeed)) {
                    return constraints.descentSpeed;
                }
                return constraints.previousDescentSpeed;
            }
        }

        return Infinity;
    }

    private managedProfile = new Map();

    updateManagedProfile() {
        this.managedProfile.clear();

        const plan = this.flightPlanService.active;

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

            if (leg.constraintType === 2 /** DES */ && leg.speedConstraint?.speed) {
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
                if (speedConstraint?.speed) {
                    currentSpeedConstraint = Math.min(currentSpeedConstraint, Math.round(speedConstraint.speed));
                }

                if (altConstraint?.altitude1) {
                    switch (altConstraint.altitudeDescriptor) {
                    case '@': // at alt 1
                    case '-': // at or below alt 1
                    case 'B': // between alt 1 and alt 2
                        currentClbConstraint = Math.min(currentClbConstraint, Math.round(altConstraint.altitude1));
                        break;
                    default:
                            // not constraining
                    }
                }
            } else if (leg.constraintType === 2 /** DES */) {
                if (altConstraint?.altitude1) {
                    switch (altConstraint.altitudeDescriptor) {
                    case '@': // at alt 1
                    case '+': // at or above alt 1
                        currentDesConstraint = Math.max(currentDesConstraint, Math.round(altConstraint.altitude1));
                        break;
                    case 'B': // between alt 1 and alt 2
                        currentDesConstraint = Math.max(currentDesConstraint, Math.round(altConstraint.altitude2 ?? altConstraint.altitude1));
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
        // eslint-disable-next-line no-underscore-dangle
        return this._value;
    }

    set value(value) {
        // eslint-disable-next-line no-underscore-dangle
        if (this._value !== value) {
            this.dirty = true;
        }
        // eslint-disable-next-line no-underscore-dangle
        this._value = value;
    }

    // @ts-ignore
    get ssm() {
        // eslint-disable-next-line no-underscore-dangle
        return this._ssm;
    }

    set ssm(ssm) {
        // eslint-disable-next-line no-underscore-dangle
        if (this._ssm !== ssm) {
            this.dirty = true;
        }
        // eslint-disable-next-line no-underscore-dangle
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
