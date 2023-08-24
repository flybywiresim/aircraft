/* eslint-disable jsx-a11y/label-has-associated-control */

import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { Fmgc } from '@fmgc/guidance/GuidanceController';

import { FlapConf } from '@fmgc/guidance/vnav/common';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmcWindVector, FmcWinds } from '@fmgc/guidance/vnav/wind/types';
import { Subject } from '@microsoft/msfs-sdk';
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
export class FmgcDataSubjects {
    public readonly zeroFuelWeight = Subject.create<number>(300_000); // in kg

    public readonly blockFuel = Subject.create<number>(100_000); // in kg

    public readonly tropopausePilotEntry = Subject.create<number>(undefined);

    public readonly tropopause = this.tropopausePilotEntry.map((tp) => (!tp ? 36_000 : tp)); // in ft

    public readonly tropopauseIsPilotEntered = this.tropopausePilotEntry.map((it) => it !== undefined);

    public readonly costIndex = Subject.create<number>(50);

    public readonly takeoffFlapsSetting = Subject.create<FlapConf>(FlapConf.CONF_1);

    public readonly approachSpeed = Subject.create<Knots>(136);

    public readonly approachWind = Subject.create<FmcWindVector>({ direction: 0, speed: 0 });

    public readonly approachQnh = Subject.create<number>(1013);

    public readonly approachTemperature = Subject.create<number>(15);

    public readonly flapRetractionSpeed = Subject.create<Knots>(141);

    public readonly slatRetractionSpeed = Subject.create<Knots>(159);

    public readonly cleanSpeed = Subject.create<Knots>(190);

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

    public readonly climbPreSelSpeed = Subject.create<Knots>(250);

    // TODO adapt computation for A380
    public readonly climbManagedSpeedFromCostIndex = this.costIndex.map((ci) => {
        const dCI = (ci / 999) ** 2;
        return 290 * (1 - dCI) + 330 * dCI;
    });

    public readonly climbManagedSpeedMach = this.climbManagedSpeedFromCostIndex.map((spd) => SimVar.GetGameVarValue('FROM KIAS TO MACH', 'number', spd) as number);

    public readonly climbSpeedLimit = Subject.create<SpeedLimit>({ speed: 250, underAltitude: 10_000 });

    public readonly cruisePreSelMach = Subject.create<Mach>(0.8);

    public readonly cruisePreSelSpeed = Subject.create<Knots>(280);

    // TODO adapt computation for A380
    public readonly cruiseManagedSpeedFromCostIndex = this.costIndex.map((ci) => {
        const dCI = (ci / 999) ** 2;
        return 290 * (1 - dCI) + 310 * dCI;
    });

    public readonly cruiseManagedSpeedMach = this.cruiseManagedSpeedFromCostIndex.map((spd) => SimVar.GetGameVarValue('FROM KIAS TO MACH', 'number', spd) as number);

    public readonly descentPreSelSpeed = Subject.create<Knots>(220);

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
export class FmgcData implements Fmgc {
    public subjects = new FmgcDataSubjects();

    constructor(
        private flightPlanService: FlightPlanService,
    ) {
    }

    getZeroFuelWeight(): number {
        return this.subjects.zeroFuelWeight.get();
    }

    getFOB(): number {
        return this.subjects.blockFuel.get();
    }

    getV2Speed(): Knots {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService.active.performanceData.v2.get() : 150;
    }

    getTropoPause(): Feet {
        return this.subjects.tropopause.get();
    }

    getManagedClimbSpeed(): Knots {
        return this.subjects.climbManagedSpeedFromCostIndex.get();
    }

    getManagedClimbSpeedMach(): Mach {
        return this.subjects.climbManagedSpeedMach.get();
    }

    getAccelerationAltitude(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.accelerationAltitude.get() : 1_500;
    }

    getThrustReductionAltitude(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.thrustReductionAltitude.get() : 1_500;
    }

    getOriginTransitionAltitude(): Feet | undefined {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.transitionAltitude.get() : 150;
    }

    getCruiseAltitude(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.cruiseFlightLevel.get() : 32_000;
    }

    getFlightPhase(): FmgcFlightPhase {
        return SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Enum');
    }

    getManagedCruiseSpeed(): Knots {
        return this.subjects.cruiseManagedSpeedFromCostIndex.get();
    }

    getManagedCruiseSpeedMach(): Mach {
        return this.subjects.cruiseManagedSpeedMach.get();
    }

    getClimbSpeedLimit(): SpeedLimit {
        return { speed: 250, underAltitude: 10_000 };
    }

    getDescentSpeedLimit(): SpeedLimit {
        return { speed: 250, underAltitude: 10_000 };
    }

    getPreSelectedClbSpeed(): Knots {
        return this.subjects.climbPreSelSpeed.get();
    }

    getPreSelectedCruiseSpeed(): Knots {
        return this.subjects.cruisePreSelSpeed.get();
    }

    getPreSelectedDescentSpeed(): Knots {
        return this.subjects.descentPreSelSpeed.get();
    }

    getTakeoffFlapsSetting(): FlapConf | undefined {
        return this.subjects.takeoffFlapsSetting.get();
    }

    getManagedDescentSpeed(): Knots {
        return this.subjects.descentManagedSpeedFromCostIndex.get();
    }

    getManagedDescentSpeedMach(): Mach {
        return this.subjects.descentManagedSpeedMach.get();
    }

    getApproachSpeed(): Knots {
        return this.subjects.approachSpeed.get();
    }

    getFlapRetractionSpeed(): Knots {
        return this.subjects.flapRetractionSpeed.get();
    }

    getSlatRetractionSpeed(): Knots {
        return this.subjects.slatRetractionSpeed.get();
    }

    getCleanSpeed(): Knots {
        return this.subjects.cleanSpeed.get();
    }

    getTripWind(): number {
        return 0;
    }

    getWinds(): FmcWinds {
        return { climb: [], cruise: [], des: [], alternate: null };
    }

    getApproachWind(): FmcWindVector {
        return this.subjects.approachWind.get();
    }

    getApproachQnh(): number {
        return this.subjects.approachQnh.get();
    }

    getApproachTemperature(): number {
        return this.subjects.approachTemperature.get();
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
}
