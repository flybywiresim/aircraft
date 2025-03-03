// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { Fmgc } from '@fmgc/guidance/GuidanceController';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { UnitType } from '@microsoft/msfs-sdk';
import { ArmedLateralMode, ArmedVerticalMode, LateralMode, VerticalMode } from '@shared/autopilot';
import { FmgcFlightPhase } from '@shared/flightphase';

export interface VerticalProfileComputationParameters {
  presentPosition: LatLongAlt;

  fcuAltitude: Feet;
  fcuVerticalMode: VerticalMode;
  fcuLateralMode: LateralMode;
  fcuVerticalSpeed: FeetPerMinute;
  fcuFlightPathAngle: Degrees;
  fcuSpeed: Knots | Mach;
  fcuSpeedManaged: boolean;
  fcuArmedLateralMode: ArmedLateralMode;
  fcuArmedVerticalMode: ArmedVerticalMode;
  fcuExpediteModeActive: boolean;
  qnhSettingMillibar: Millibar;

  managedClimbSpeed: Knots;
  managedClimbSpeedMach: Mach;
  managedCruiseSpeed: Knots;
  managedCruiseSpeedMach: Mach;
  managedDescentSpeed: Knots;
  managedDescentSpeedMach: Mach;

  zeroFuelWeight: Pounds;
  fuelOnBoard: Pounds;
  v2Speed: Knots;
  tropoPause: Feet;
  perfFactor: number;
  departureElevation: Feet;
  destinationElevation: Feet;
  accelerationAltitude: Feet;
  thrustReductionAltitude: Feet;
  originTransitionAltitude?: Feet;
  cruiseAltitude: Feet;
  climbSpeedLimit: SpeedLimit;
  descentSpeedLimit: SpeedLimit;
  flightPhase: FmgcFlightPhase;
  preselectedClbSpeed: Knots;
  preselectedCruiseSpeed: Knots;
  takeoffFlapsSetting?: FlapConf;
  estimatedDestinationFuel: Pounds;

  approachQnh: Millibar;
  approachTemperature: Celsius;
  approachSpeed: Knots;
  flapRetractionSpeed: Knots;
  slatRetractionSpeed: Knots;
  cleanSpeed: Knots;
}

export class VerticalProfileComputationParametersObserver {
  private parameters: VerticalProfileComputationParameters;

  constructor(
    private fmgc: Fmgc,
    private flightPlanService: FlightPlanService,
  ) {
    this.update();
  }

  update() {
    this.parameters = {
      presentPosition: this.getPresentPosition(),

      fcuAltitude: Simplane.getAutoPilotDisplayedAltitudeLockValue(),
      fcuVerticalMode: SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_MODE', 'Enum'),
      fcuLateralMode: SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Enum'),
      fcuVerticalSpeed: SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_VS_SELECTED', 'Feet per minute'),
      fcuFlightPathAngle: SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_FPA_SELECTED', 'Degrees'),
      fcuSpeedManaged: SimVar.GetSimVarValue('L:A32NX_FCU_SPD_MANAGED_DOT', 'number'),
      fcuSpeed: SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_SPEED_SELECTED', 'number'),
      fcuArmedLateralMode: SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_ARMED', 'number'),
      fcuArmedVerticalMode: SimVar.GetSimVarValue('L:A32NX_FMA_VERTICAL_ARMED', 'number'),
      fcuExpediteModeActive: SimVar.GetSimVarValue('L:A32NX_FMA_EXPEDITE_MODE', 'number'),
      qnhSettingMillibar: Simplane.getPressureValue('millibar'),

      managedClimbSpeed: this.fmgc.getManagedClimbSpeed(),
      managedClimbSpeedMach: this.fmgc.getManagedClimbSpeedMach(),
      managedCruiseSpeed: this.fmgc.getManagedCruiseSpeed(),
      managedCruiseSpeedMach: this.fmgc.getManagedCruiseSpeedMach(),
      managedDescentSpeed: this.fmgc.getManagedDescentSpeed(),
      managedDescentSpeedMach: this.fmgc.getManagedDescentSpeedMach(),

      zeroFuelWeight: this.getZeroFuelWeight(),
      fuelOnBoard: this.getFuelOnBoard(),
      v2Speed: this.getV2Speed(),
      tropoPause: this.fmgc.getTropoPause(),
      perfFactor: 0, // FIXME: Use actual value,
      departureElevation: this.fmgc.getDepartureElevation() ?? DefaultVerticalProfileParameters.departureElevation,
      /**
       * This differs from the altitude I use to start building the descent profile.
       * This one one is the altitude of the destination airport, the other one is the final procedure altitude.
       */
      destinationElevation: this.fmgc.getDestinationElevation(),
      accelerationAltitude:
        this.fmgc.getAccelerationAltitude() ?? DefaultVerticalProfileParameters.accelerationAltitude,
      thrustReductionAltitude:
        this.fmgc.getThrustReductionAltitude() ?? DefaultVerticalProfileParameters.thrustReductionAltitude,
      originTransitionAltitude: this.fmgc.getOriginTransitionAltitude(),
      // We do it this way because the cruise altitude is cleared in the MCDU once you start the descent
      cruiseAltitude: this.flightPlanService.active.performanceData.cruiseFlightLevel
        ? this.flightPlanService.active.performanceData.cruiseFlightLevel * 100
        : this.parameters?.cruiseAltitude,
      climbSpeedLimit: this.fmgc.getClimbSpeedLimit(),
      descentSpeedLimit: this.fmgc.getDescentSpeedLimit(),
      flightPhase: this.fmgc.getFlightPhase(),
      preselectedClbSpeed: this.fmgc.getPreSelectedClbSpeed(),
      preselectedCruiseSpeed: this.fmgc.getPreSelectedCruiseSpeed(),
      takeoffFlapsSetting: this.fmgc.getTakeoffFlapsSetting() ?? DefaultVerticalProfileParameters.flapsSetting,
      estimatedDestinationFuel: UnitType.TONNE.convertTo(this.fmgc.getDestEFOB(), UnitType.POUND),

      approachQnh: this.fmgc.getApproachQnh(),
      approachTemperature: this.fmgc.getApproachTemperature(),
      approachSpeed: this.fmgc.getApproachSpeed(),
      /**
       * F speed in knots based on estimated landing weight, or 0 if not available
       */
      flapRetractionSpeed: this.fmgc.getFlapRetractionSpeed(),
      /**
       * S speed in knots based on estimated landing weight, or 0 if not available
       */
      slatRetractionSpeed: this.fmgc.getSlatRetractionSpeed(),
      /**
       * Green dot speed in knots based on esimated landing weight, or 0 if not available
       */
      cleanSpeed: this.fmgc.getCleanSpeed(),
    };

    if (VnavConfig.ALLOW_DEBUG_PARAMETER_INJECTION) {
      this.parameters.flightPhase = FmgcFlightPhase.Descent;
      this.parameters.presentPosition.alt = SimVar.GetSimVarValue('L:A32NX_FM_VNAV_DEBUG_ALTITUDE', 'feet');
      this.parameters.fcuVerticalMode = VerticalMode.DES;
      this.parameters.fcuLateralMode = LateralMode.NAV;
      this.parameters.zeroFuelWeight = 134400;
      this.parameters.v2Speed = 126;
    }
  }

  private getPresentPosition(): LatLongAlt {
    return new LatLongAlt(
      SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
      SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
      SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet'),
    );
  }

  private getV2Speed(): Knots {
    const fmV2 = this.fmgc.getV2Speed();
    if (Number.isFinite(fmV2)) {
      return fmV2;
    }

    const fmGw = this.fmgc.getGrossWeight();
    const flaps = this.fmgc.getTakeoffFlapsSetting() ?? DefaultVerticalProfileParameters.flapsSetting;
    const departureElevation = this.fmgc.getDepartureElevation() ?? DefaultVerticalProfileParameters.departureElevation;

    if (Number.isFinite(fmGw)) {
      return DefaultVerticalProfileParameters.getV2Speed(flaps, fmGw, departureElevation);
    }

    return null;
  }

  get(): VerticalProfileComputationParameters {
    return this.parameters;
  }

  canComputeProfile(): boolean {
    const areApproachSpeedsValid =
      this.parameters.cleanSpeed > 100 &&
      this.parameters.slatRetractionSpeed > 100 &&
      this.parameters.flapRetractionSpeed > 100 &&
      this.parameters.approachSpeed > 100;

    const hasZeroFuelWeight = Number.isFinite(this.parameters.zeroFuelWeight);
    const hasGrossWeight = Number.isFinite(this.fmgc.getGrossWeight());
    const hasCruiseAltitude = Number.isFinite(this.parameters.cruiseAltitude);
    const hasTakeoffParameters =
      this.parameters.thrustReductionAltitude > 0 && this.parameters.accelerationAltitude > 0;

    return (
      (this.parameters.flightPhase > FmgcFlightPhase.Takeoff || hasTakeoffParameters) &&
      areApproachSpeedsValid &&
      hasZeroFuelWeight &&
      hasGrossWeight &&
      hasCruiseAltitude
    );
  }

  getZeroFuelWeight(): Pounds {
    const fmZfw = this.fmgc.getZeroFuelWeight();

    return Number.isFinite(fmZfw) ? UnitType.TONNE.convertTo(fmZfw, UnitType.POUND) : undefined;
  }

  getFuelOnBoard(): Pounds {
    const fmFuelOnBoard = this.fmgc.getFOB();

    return Number.isFinite(fmFuelOnBoard) ? UnitType.TONNE.convertTo(fmFuelOnBoard, UnitType.POUND) : undefined;
  }
}

class DefaultVerticalProfileParameters {
  static readonly accelerationAltitude = 1500;

  static readonly thrustReductionAltitude = 1500;

  static readonly v2Speeds: Record<number, ((m: number) => number)[]> = {
    1: [
      () => 126,
      () => 126,
      () => 126,
      (m: number) => 126 + 0.2 * (m - 50),
      (m: number) => 127 + m - 55,
      (m: number) => 132 + m - 60,
      (m: number) => 137 + m - 65,
      (m: number) => 142 + m - 70,
      (m: number) => 147 + m - 75,
      () => 151,
    ], // Conf 1 + F
    2: [
      () => 126,
      () => 126,
      () => 126,
      () => 126,
      (m: number) => 126 + 0.2 * (m - 55),
      (m: number) => 127 + m - 60,
      (m: number) => 132 + m - 65,
      (m: number) => 137 + 0.8 * (m - 70),
      (m: number) => 141 + m - 75,
      () => 146,
    ], // Conf 2
    3: [
      () => 125,
      () => 125,
      () => 125,
      () => 125,
      () => 125,
      (m: number) => 125 + 0.6 * (m - 60),
      (m: number) => 128 + 0.8 * (m - 65),
      (m: number) => 132 + m - 70,
      (m: number) => 137 + 0.8 * (m - 75),
      () => 141,
    ], // Conf 3
  };

  static readonly flapsSetting = 1;

  static readonly departureElevation = 0;

  static readonly destinationElevation = 0;

  /**
   * Gives the minimal V2 speed for a given configuration, gross weight and elevation.
   * @param conf flap configuration
   * @param fmGw gross weight in tonnes
   * @param elevation departure elevation in feet
   * @returns
   */
  static getV2Speed(conf: number, fmGw: number, elevation: number): number {
    const massIndex = Math.ceil((Math.min(fmGw, 80) - 40) / 5);

    return Math.floor(
      DefaultVerticalProfileParameters.v2Speeds[conf][massIndex](fmGw) +
        (conf === 2 ? Math.abs(elevation * 0.0002) : 0),
    );
  }
}
