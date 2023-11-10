/* eslint-disable jsx-a11y/label-has-associated-control */

import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { Fmgc } from '@fmgc/guidance/GuidanceController';

import { FlapConf } from '@fmgc/guidance/vnav/common';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmcWindVector, FmcWinds } from '@fmgc/guidance/vnav/wind/types';
import { MappedSubject, Subject } from '@microsoft/msfs-sdk';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';

export enum TakeoffPowerSetting {
    TOGA = 0,
    FLEX = 1,
    DERATED = 2,
}

export enum TakeoffDerated {
    D01 = 0,
    D02 = 1,
    D03 = 2,
    D04 = 3,
    D05 = 4,
}

export enum TakeoffPacks {
    OFF_APU = 0,
    ON = 1,
}

export enum TakeoffAntiIce {
    OFF = 0,
    ENG_ONLY = 1,
    ENG_WINGS = 2,
}

export enum ClimbDerated {
    NONE = 0,
    D01 = 1,
    D02 = 2,
    D03 = 3,
    D04 = 4,
    D05 = 5,
}

/**
 * Temporary place for data which is found nowhere else. Not associated to flight plans right now, which should be the case for some of these values
 */
export class FmgcData {
    public readonly cpnyFplnAvailable = Subject.create(false);

    public readonly cpnyFplnUplinkInProgress = Subject.create(false);

    public readonly atcCallsign = Subject.create<string>('----------');

    public readonly zeroFuelWeight = Subject.create<number>(undefined); // in kg

    public readonly zeroFuelWeightCenterOfGravity = Subject.create<number>(undefined); // in percent

    public readonly blockFuel = Subject.create<number>(undefined); // in kg

    public readonly taxiFuel = Subject.create<number>(undefined); // in kg

    public readonly routeReserveFuelWeightPilotEntry = Subject.create<number>(undefined); // in kg

    public readonly routeReserveFuelWeightCalculated = Subject.create<number>(undefined); // in kg

    public readonly routeReserveFuelWeight = MappedSubject.create(([calc, pe]) => (pe !== undefined ? pe : calc), this.routeReserveFuelWeightCalculated, this.routeReserveFuelWeightPilotEntry);

    public readonly routeReserveFuelPercentagePilotEntry = Subject.create<number>(undefined); // in percent

    public readonly routeReserveFuelPercentage = this.routeReserveFuelPercentagePilotEntry.map((it) => ((it === undefined) ? undefined : it)); // in percent

    public readonly routeReserveFuelIsPilotEntered = MappedSubject.create((
        [fuel, time],
    ) => fuel !== undefined || time !== undefined,
    this.routeReserveFuelWeightPilotEntry,
    this.routeReserveFuelPercentagePilotEntry);

    public readonly paxNumber = Subject.create<number>(undefined);

    public readonly jettisonGrossWeight = Subject.create<number>(undefined); // in kg

    public readonly alternateFuelPilotEntry = Subject.create<number>(undefined); // in kg

    public readonly alternateFuelCalculated = Subject.create<number>(undefined); // in kg

    public readonly alternateFuel = MappedSubject.create(([calc, pe]) => (pe !== undefined ? pe : calc), this.alternateFuelCalculated, this.alternateFuelPilotEntry); // in kg

    public readonly alternateFuelIsPilotEntered = this.alternateFuelPilotEntry.map((it) => it !== undefined);

    public readonly finalFuelWeightPilotEntry = Subject.create<number>(undefined); // in kg

    public readonly finalFuelWeightCalculated = Subject.create<number>(undefined); // in kg

    public readonly finalFuelWeight = MappedSubject.create(([calc, pe]) => (pe !== undefined ? pe : calc), this.finalFuelWeightCalculated, this.finalFuelWeightPilotEntry);

    public readonly finalFuelTimePilotEntry = Subject.create<number>(undefined); // in percent

    public readonly finalFuelTime = this.finalFuelTimePilotEntry.map((it) => ((it === undefined) ? 30 : it)); // in minutes

    public readonly finalFuelIsPilotEntered = MappedSubject.create((
        [fuel, time],
    ) => fuel !== undefined || time !== undefined,
    this.finalFuelWeightPilotEntry,
    this.finalFuelTimePilotEntry);

    public readonly minimumFuelAtDestinationPilotEntry = Subject.create<number>(undefined); // in kg

    public readonly minimumFuelAtDestination = MappedSubject.create(
        ([pe, ff, af]) => ((pe === undefined) ? (ff + af) : pe),
        this.minimumFuelAtDestinationPilotEntry,
        this.finalFuelWeight,
        this.alternateFuel,
    ); // in kg

    public readonly minimumFuelAtDestinationIsPilotEntered = this.minimumFuelAtDestinationPilotEntry.map((it) => it !== undefined);

    public readonly tropopausePilotEntry = Subject.create<number>(undefined);

    public readonly tropopause = this.tropopausePilotEntry.map((tp) => (tp ?? 36_090)); // in ft

    public readonly tropopauseIsPilotEntered = this.tropopausePilotEntry.map((it) => it !== undefined);

    public readonly costIndex = Subject.create<number>(undefined);

    public readonly takeoffFlapsSetting = Subject.create<FlapConf>(FlapConf.CONF_1);

    public readonly approachSpeed = Subject.create<Knots>(undefined);

    public readonly approachWind = Subject.create<FmcWindVector>({ direction: 0, speed: 0 });

    public readonly approachQnh = Subject.create<number>(undefined);

    public readonly approachTemperature = Subject.create<number>(undefined);

    public readonly flapRetractionSpeed = Subject.create<Knots>(141);

    public readonly slatRetractionSpeed = Subject.create<Knots>(159);

    public readonly cleanSpeed = Subject.create<Knots>(190);

    public readonly takeoffShift = Subject.create<number>(undefined);

    public readonly takeoffPowerSetting = Subject.create<TakeoffPowerSetting>(TakeoffPowerSetting.TOGA);

    public readonly takeoffFlexTemp = Subject.create<number>(undefined);

    public readonly takeoffDeratedSetting = Subject.create<TakeoffDerated>(TakeoffDerated.D01);

    public readonly takeoffThsFor = Subject.create<number>(undefined);

    public readonly takeoffPacks = Subject.create<TakeoffPacks>(TakeoffPacks.ON);

    public readonly takeoffAntiIce = Subject.create<TakeoffAntiIce>(TakeoffAntiIce.OFF);

    public readonly noiseEnabled = Subject.create<boolean>(false);

    public readonly noiseN1 = Subject.create<number>(undefined);

    public readonly noiseSpeed = Subject.create<Knots>(undefined);

    public readonly noiseEndAltitude = Subject.create<number>(undefined);

    public readonly climbDerated = Subject.create<ClimbDerated>(ClimbDerated.NONE);

    public readonly climbPreSelSpeed = Subject.create<Knots>(undefined);

    // TODO adapt computation for A380
    public readonly climbManagedSpeedFromCostIndex = this.costIndex.map((ci) => {
        const dCI = (ci / 999) ** 2;
        return 290 * (1 - dCI) + 330 * dCI;
    });

    public readonly climbManagedSpeedMach = this.climbManagedSpeedFromCostIndex.map((spd) => SimVar.GetGameVarValue('FROM KIAS TO MACH', 'number', spd) as number);

    public readonly climbSpeedLimit = Subject.create<SpeedLimit>({ speed: 250, underAltitude: 10_000 });

    public readonly cruisePreSelMach = Subject.create<Mach>(undefined);

    public readonly cruisePreSelSpeed = Subject.create<Knots>(undefined);

    // TODO adapt computation for A380
    public readonly cruiseManagedSpeedFromCostIndex = this.costIndex.map((ci) => {
        const dCI = (ci / 999) ** 2;
        return 290 * (1 - dCI) + 310 * dCI;
    });

    public readonly cruiseManagedSpeedMach = this.cruiseManagedSpeedFromCostIndex.map((spd) => SimVar.GetGameVarValue('FROM KIAS TO MACH', 'number', spd) as number);

    public readonly descentPreSelSpeed = Subject.create<Knots>(undefined);

    // TODO adapt computation for A380
    public readonly descentManagedSpeedFromCostIndex = this.costIndex.map((ci) => {
        const dCI = ci / 999;
        return 288 * (1 - dCI) + 300 * dCI;
    });

    public readonly descentManagedSpeedMach = this.descentManagedSpeedFromCostIndex.map((spd) => SimVar.GetGameVarValue('FROM KIAS TO MACH', 'number', spd) as number);

    public readonly descentSpeedLimit = Subject.create<SpeedLimit>({ speed: 250, underAltitude: 10_000 });

    public readonly descentCabinRate = Subject.create<number>(-350);

    public readonly approachBaroMinimum = Subject.create<number>(undefined);

    public readonly approachRadioMinimum = Subject.create<number>(undefined);

    public readonly approachVref = Subject.create<Knots>(129);

    public readonly approachFlapConfig = Subject.create<FlapConf>(FlapConf.CONF_FULL);

    public readonly approachVls = Subject.create<Knots>(134);
}

/**
 * Implementation of Fmgc interface. Not associated to flight plans right now, which should be the case for some of these values
 */
export class FmgcDataInterface implements Fmgc {
    public data = new FmgcData();

    constructor(
        private flightPlanService: FlightPlanService,
    ) {
    }

    updateFromSimVars() {
        /* this.data.cleanSpeed.set(SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number'));
        this.data.flapRetractionSpeed.set(SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number'));
        this.data.slatRetractionSpeed.set(SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number'));
        this.data.approachVls.set(SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number')); */
    }

    getZeroFuelWeight(): number {
        return this.data.zeroFuelWeight.get();
    }

    getFOB(): number {
        if (this.getFlightPhase() >= FmgcFlightPhase.Takeoff) {
            const bf = SimVar.GetSimVarValue('FUEL TOTAL QUANTITY', 'gallons') * SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'kilograms') / 1_000;
            this.data.blockFuel.set(bf);
            return bf;
        }
        return this.data.blockFuel.get() / 1_000; // Needs to be returned in tonnes
    }

    getV2Speed(): Knots {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService.active.performanceData.v2.get() : 150;
    }

    getTropoPause(): Feet {
        return this.data.tropopause.get();
    }

    getManagedClimbSpeed(): Knots {
        return this.data.climbManagedSpeedFromCostIndex.get();
    }

    getManagedClimbSpeedMach(): Mach {
        return this.data.climbManagedSpeedMach.get();
    }

    getAccelerationAltitude(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.accelerationAltitude.get() : 1_500;
    }

    getThrustReductionAltitude(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.thrustReductionAltitude.get() : 1_500;
    }

    getOriginTransitionAltitude(): Feet | undefined {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.transitionAltitude.get() : 18_000;
    }

    getCruiseAltitude(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.cruiseFlightLevel.get() : 32_000;
    }

    getFlightPhase(): FmgcFlightPhase {
        return SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum');
    }

    getManagedCruiseSpeed(): Knots {
        return this.data.cruiseManagedSpeedFromCostIndex.get();
    }

    getManagedCruiseSpeedMach(): Mach {
        return this.data.cruiseManagedSpeedMach.get();
    }

    getClimbSpeedLimit(): SpeedLimit {
        return { speed: 250, underAltitude: 10_000 };
    }

    getDescentSpeedLimit(): SpeedLimit {
        return { speed: 250, underAltitude: 10_000 };
    }

    getPreSelectedClbSpeed(): Knots {
        return this.data.climbPreSelSpeed.get();
    }

    getPreSelectedCruiseSpeed(): Knots {
        return this.data.cruisePreSelSpeed.get();
    }

    getPreSelectedDescentSpeed(): Knots {
        return this.data.descentPreSelSpeed.get();
    }

    getTakeoffFlapsSetting(): FlapConf | undefined {
        return this.data.takeoffFlapsSetting.get();
    }

    getManagedDescentSpeed(): Knots {
        return this.data.descentManagedSpeedFromCostIndex.get();
    }

    getManagedDescentSpeedMach(): Mach {
        return this.data.descentManagedSpeedMach.get();
    }

    getApproachSpeed(): Knots {
        return this.data.approachSpeed.get();
    }

    getFlapRetractionSpeed(): Knots {
        return this.data.flapRetractionSpeed.get();
    }

    getSlatRetractionSpeed(): Knots {
        return this.data.slatRetractionSpeed.get();
    }

    getCleanSpeed(): Knots {
        return this.data.cleanSpeed.get();
    }

    getTripWind(): number {
        return 0;
    }

    getWinds(): FmcWinds {
        return { climb: [{ direction: 0, speed: 0 }], cruise: [{ direction: 0, speed: 0 }], des: [{ direction: 0, speed: 0 }], alternate: null };
    }

    getApproachWind(): FmcWindVector {
        return this.data.approachWind.get();
    }

    getApproachQnh(): number {
        return this.data.approachQnh.get();
    }

    getApproachTemperature(): number {
        return this.data.approachTemperature.get();
    }

    getDestEFOB(useFob: boolean): number { // Metric tons
        return useFob ? 12 : 11;
    }

    getDepartureElevation(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active?.originRunway?.thresholdLocation?.alt : undefined;
    }

    getDestinationElevation(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active?.destinationRunway?.thresholdLocation?.alt : undefined;
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
}
