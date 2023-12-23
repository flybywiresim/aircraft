/* eslint-disable jsx-a11y/label-has-associated-control */

import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { Fmgc, GuidanceController } from '@fmgc/guidance/GuidanceController';

import { FlapConf } from '@fmgc/guidance/vnav/common';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmcWindVector, FmcWinds } from '@fmgc/guidance/vnav/wind/types';
import { MappedSubject, Subject, UnitType } from '@microsoft/msfs-sdk';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { Arinc429Word, Knots, Runway, Units } from '@flybywiresim/fbw-sdk';
import { Feet } from 'msfs-geo';

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

type AltitudeValue = Feet | undefined;

/**
 * Temporary place for data which is found nowhere else. Not associated to flight plans right now, which should be the case for some of these values
 */
export class FmgcData {
    public readonly cpnyFplnAvailable = Subject.create(false);

    public readonly cpnyFplnUplinkInProgress = Subject.create(false);

    public readonly atcCallsign = Subject.create<string>('----------');

    public readonly tripWind = Subject.create<Knots>(undefined);

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

    public readonly tropopausePilotEntry = Subject.create<AltitudeValue>(undefined);

    public readonly tropopause = this.tropopausePilotEntry.map((tp) => (tp ?? 36_090)); // in ft

    public readonly tropopauseIsPilotEntered = this.tropopausePilotEntry.map((it) => it !== undefined);

    public readonly costIndex = Subject.create<number>(undefined);

    /**
     * For which departure runway the v speeds have been inserted
     */
    public readonly vSpeedsForRunway = Subject.create<string>(undefined);

    /**
     * V1 speed, to be confirmed after rwy change
     */
    readonly v1ToBeConfirmed = Subject.create<Knots>(undefined);

    /**
     * VR speed, to be confirmed after rwy change
     */
    readonly vrToBeConfirmed = Subject.create<Knots>(undefined);

    /**
     * V2 speed, to be confirmed after rwy change
     */
    readonly v2ToBeConfirmed = Subject.create<Knots>(undefined);

    public readonly takeoffFlapsSetting = Subject.create<FlapConf>(FlapConf.CONF_1);

    public readonly approachSpeed = Subject.create<Knots>(undefined);

    public readonly approachWind = Subject.create<FmcWindVector>({ direction: 0, speed: 0 });

    public readonly approachQnh = Subject.create<number>(undefined);

    public readonly approachTemperature = Subject.create<number>(undefined);

    public readonly flapRetractionSpeed = Subject.create<Knots>(141);

    public readonly slatRetractionSpeed = Subject.create<Knots>(159);

    public readonly greenDotSpeed = Subject.create<Knots>(190);

    public readonly takeoffShift = Subject.create<number>(undefined); // in meters

    public readonly takeoffPowerSetting = Subject.create<TakeoffPowerSetting>(TakeoffPowerSetting.TOGA);

    public readonly takeoffFlexTemp = Subject.create<number>(undefined);

    public readonly takeoffDeratedSetting = Subject.create<TakeoffDerated>(TakeoffDerated.D01);

    public readonly takeoffThsFor = Subject.create<number>(undefined);

    public readonly takeoffPacks = Subject.create<TakeoffPacks>(TakeoffPacks.ON);

    public readonly takeoffAntiIce = Subject.create<TakeoffAntiIce>(TakeoffAntiIce.OFF);

    public readonly noiseEnabled = Subject.create<boolean>(false);

    public readonly noiseN1 = Subject.create<number>(undefined);

    public readonly noiseSpeed = Subject.create<Knots>(undefined);

    public readonly noiseEndAltitude = Subject.create<AltitudeValue>(undefined);

    public readonly climbDerated = Subject.create<ClimbDerated>(ClimbDerated.NONE);

    public readonly climbPredictionsReferencePilotEntry = Subject.create<AltitudeValue>(undefined); // in ft

    public readonly climbPredictionsReferenceAutomatic = Subject.create<AltitudeValue>(undefined); // in ft

    public readonly climbPredictionsReference = MappedSubject.create(([calc, pe]) => (pe !== undefined ? pe : calc),
        this.climbPredictionsReferenceAutomatic,
        this.climbPredictionsReferencePilotEntry);

    public readonly climbPredictionsReferenceIsPilotEntered = this.climbPredictionsReferencePilotEntry.map((it) => it !== undefined);

    public readonly climbPreSelSpeed = Subject.create<Knots>(undefined);

    // TODO adapt computation for A380
    public readonly climbManagedSpeedFromCostIndex = this.costIndex.map((ci) => {
        const dCI = (ci / 999) ** 2;
        return 290 * (1 - dCI) + 330 * dCI;
    });

    public readonly climbManagedSpeedMach = this.climbManagedSpeedFromCostIndex.map((spd) => SimVar.GetGameVarValue('FROM KIAS TO MACH', 'number', spd) as number);

    public readonly climbSpeedLimit = Subject.create<SpeedLimit>({ speed: 250, underAltitude: 10_000 });

    public readonly cruisePreSelMach = Subject.create<number>(undefined);

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

    public readonly descentCabinRate = Subject.create<number>(-350); // ft/min

    public readonly approachBaroMinimum = Subject.create<AltitudeValue>(undefined);

    public readonly approachRadioMinimum = Subject.create<AltitudeValue>(undefined);

    public readonly approachVref = Subject.create<Knots>(129);

    public readonly approachFlapConfig = Subject.create<FlapConf>(FlapConf.CONF_FULL);

    public readonly approachVls = Subject.create<Knots>(134);

    /**
     * Estimated take-off time, in seconds. Displays as HH:mm:ss
     */
    public readonly estimatedTakeoffTime = Subject.create<number>(undefined);
}

/**
 * Implementation of Fmgc interface. Not associated to flight plans right now, which should be the case for some of these values
 */
export class FmgcDataInterface implements Fmgc {
    public data = new FmgcData();

    public guidanceController: GuidanceController;

    constructor(
        private flightPlanService: FlightPlanService,
    ) {
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
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService.active.performanceData.v2 : 150;
    }

    getTropoPause(): Feet {
        return this.data.tropopause.get();
    }

    getManagedClimbSpeed(): Knots {
        return this.data.climbManagedSpeedFromCostIndex.get();
    }

    getManagedClimbSpeedMach(): number {
        return this.data.climbManagedSpeedMach.get();
    }

    getAccelerationAltitude(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.accelerationAltitude : 1_500;
    }

    getThrustReductionAltitude(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.thrustReductionAltitude : 1_500;
    }

    getOriginTransitionAltitude(): Feet | undefined {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.transitionAltitude : 18_000;
    }

    getDestinationTransitionLevel(): Feet | undefined {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.transitionLevel : 18_000;
    }

    getCruiseAltitude(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active.performanceData.cruiseFlightLevel : 32_000;
    }

    getFlightPhase(): FmgcFlightPhase {
        return SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum');
    }

    getManagedCruiseSpeed(): Knots {
        return this.data.cruiseManagedSpeedFromCostIndex.get();
    }

    getManagedCruiseSpeedMach(): number {
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

    getManagedDescentSpeedMach(): number {
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
        return this.data.greenDotSpeed.get();
    }

    getTripWind(): number {
        return this.data.tripWind.get();
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
        const efob = this.guidanceController?.vnavDriver?.getDestinationPrediction()?.estimatedFuelOnBoard; // in Pounds
        if (useFob === true && efob !== undefined) {
            return Units.poundToKilogram(efob) / 1000.0;
        }
        return 0;
    }

    getAltEFOB(useFOB = false) {
        // TODO estimate alternate fuel
        return this.getDestEFOB(useFOB) - 1.0;
    }

    getDepartureElevation(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active?.originRunway?.thresholdLocation?.alt : undefined;
    }

    getDestinationElevation(): Feet {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active?.destinationRunway?.thresholdLocation?.alt : undefined;
    }

    getDestinationRunway(): Runway {
        return this.flightPlanService.has(FlightPlanIndex.Active) ? this.flightPlanService?.active?.destinationRunway : undefined;
    }

    getDistanceToDestination(): number {
        return this.guidanceController.vnavDriver.getDestinationPrediction().distanceFromAircraft;
    }

    /**
     * Generic function which returns true if engine(index) is ON (N2 > 20)
     * @returns {boolean}
     */
    public isEngineOn(index: number): boolean {
        return SimVar.GetSimVarValue(`L:A32NX_ENGINE_N2:${index}`, 'number') > 20;
    }
    /**
     * Returns true if any one engine is running (N2 > 20)
     */
    //TODO: can this be an util?
    public isAnEngineOn(): boolean {
        return this.isEngineOn(1) || this.isEngineOn(2) || this.isEngineOn(3) || this.isEngineOn(4);
    }

    /**
     * Returns true only if all engines are running (N2 > 20)
     */
    //TODO: can this be an util?
    isAllEngineOn(): boolean {
        return this.isEngineOn(1) && this.isEngineOn(2) && this.isEngineOn(3) && this.isEngineOn(4);
    }

    isOnGround() {
        return SimVar.GetSimVarValue("L:A32NX_LGCIU_1_NOSE_GEAR_COMPRESSED", "Number") === 1 || SimVar.GetSimVarValue("L:A32NX_LGCIU_2_NOSE_GEAR_COMPRESSED", "Number") === 1;
    }

    isFlying() {
        return this.getFlightPhase() >= FmgcFlightPhase.Takeoff && this.getFlightPhase() < FmgcFlightPhase.Done;
    }

    getPressureAltAtElevation(elev, qnh = 1013.2) {
        const p0 = qnh < 500 ? 29.92 : 1013.2;
        return elev + 145442.15 * (1 - Math.pow((qnh / p0), 0.190263));
    }

    getPressureAlt() {
        for (let n = 1; n <= 3; n++) {
            const zp = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_ADR_${n}_ALTITUDE`);
            if (zp.isNormalOperation()) {
                return zp.value;
            }
        }
        return null;
    }

    getBaroCorrection1() {
        // FIXME hook up to ADIRU or FCU
        return Simplane.getPressureValue("millibar");
    }
}
