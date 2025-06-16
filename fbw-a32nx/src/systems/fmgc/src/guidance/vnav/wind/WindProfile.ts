// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlan } from '../../../flightplanning/plans/FlightPlan';
import { isDiscontinuity } from '../../../flightplanning/legs/FlightPlanLeg';
import { EventBus, Vec2Math } from '@microsoft/msfs-sdk';
import { PropagatedWindEntry, TailwindComponent, WindVector } from '../../../flightplanning/data/wind';
import { Common } from '../common';
import { FlightPlanIndex } from '../../../flightplanning/FlightPlanManager';
import { FlightPlanService } from '../../../flightplanning/FlightPlanService';
import { Arinc429Register, MathUtils } from '@flybywiresim/fbw-sdk';
import { ProfilePhase } from '../profile/NavGeometryProfile';
import { FlightPlanTrackProfile } from './FlightPlanTrackProfile';
import { WindMeasurement, WindObserver } from './WindObserver';
import { WindUtils } from './WindUtils';

export class WindProfile implements WindInterface {
  private static readonly VectorCache = [Vec2Math.create(), Vec2Math.create()] as const;

  private static readonly WindMeasurementCache: WindMeasurement = { altitude: NaN, vector: Vec2Math.create() };

  private readonly tracks: FlightPlanTrackProfile = new FlightPlanTrackProfile(this.plan);

  private readonly measurementDevice: WindObserver = new WindObserver(this.bus);

  private readonly legWinds: LegWinds = new LegWinds(this.flightPlanService, this.index);

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanService: FlightPlanService,
    private readonly index: FlightPlanIndex,
  ) {}

  private get plan(): FlightPlan {
    return this.flightPlanService.get(this.index);
  }

  getClimbTailwind(distanceFromStart: NauticalMiles, altitude: Feet): TailwindComponent {
    const windPrediction = this.getClimbWind(distanceFromStart, altitude, WindProfile.VectorCache[0]);

    return this.computeTailwindComponent(distanceFromStart, windPrediction);
  }

  getClimbWind(distanceFromStart: NauticalMiles, altitude: Feet, result: WindVector): WindVector {
    const windForecast = this.getClimbWindVectorForecast(distanceFromStart, altitude, WindProfile.VectorCache[0]);

    return this.blendWithMeasurement(windForecast, altitude, result);
  }

  getClimbWindVectorForecast(distanceFromStart: NauticalMiles, altitude: Feet, result: WindVector): WindVector {
    const windForecast = this.getClimbWindForecast(altitude, result);

    return typeof windForecast === 'number' ? this.makeVectorAt(distanceFromStart, windForecast, result) : result;
  }

  getClimbWindForecast(altitude: Feet, result: WindVector): WindVector | TailwindComponent {
    const climbWindEntries = this.plan.performanceData.climbWindEntries;
    const hasClimbWindEntry = climbWindEntries.length > 0;

    // TODO winds trip wind from performance data
    const tripWind: TailwindComponent | null = null;
    const hasTripWindEntry = tripWind !== null;

    const originAlt = this.plan.originRunway?.thresholdLocation.alt ?? this.plan.originAirport?.location.alt ?? 0;

    if (hasClimbWindEntry) {
      const lowestAltitude = climbWindEntries[0].altitude;

      if (altitude < lowestAltitude) {
        // We use 1e-14 instead of 0 to preserve the direction of the vector when scaling it down to zero
        const scaling = Math.max(
          1e-14,
          Common.interpolate(MathUtils.clamp(altitude, originAlt, lowestAltitude), originAlt, lowestAltitude, 0, 1),
        );

        return Vec2Math.multScalar(climbWindEntries[0].vector, scaling, result);
      }

      return WindUtils.interpolateWindEntries(climbWindEntries, altitude, result);
    } else if (hasTripWindEntry) {
      return (
        tripWind * MathUtils.clamp(Common.interpolate(altitude, originAlt, WindConfig.TripWindMaxAltitude, 0, 1), 0, 1)
      );
    }

    return Vec2Math.set(0, 0, result);
  }

  getDescentTailwind(distanceFromStart: NauticalMiles, altitude: Feet): TailwindComponent {
    const windPrediction = this.getDescentWind(distanceFromStart, altitude, WindProfile.VectorCache[0]);

    return this.computeTailwindComponent(distanceFromStart, windPrediction);
  }

  getDescentWind(distanceFromStart: NauticalMiles, altitude: Feet, result: WindVector): WindVector {
    const windForecast = this.getDescentWindVectorForecast(distanceFromStart, altitude, WindProfile.VectorCache[0]);

    return this.blendWithMeasurement(windForecast, altitude, result);
  }

  getDescentWindVectorForecast(distanceFromStart: NauticalMiles, altitude: Feet, result: WindVector): WindVector {
    const windForecast = this.getDescentWindForecast(altitude, result);

    return typeof windForecast === 'number' ? this.makeVectorAt(distanceFromStart, windForecast, result) : result;
  }

  getDescentWindForecast(altitude: Feet, result: WindVector): WindVector | TailwindComponent {
    const descentWindEntries = this.plan.performanceData.descentWindEntries;
    const hasDescentWindEntry = descentWindEntries.length > 0;

    // TODO winds trip wind from performance data
    const tripWind: TailwindComponent | null = null;
    const hasTripWindEntry = tripWind !== null;

    // TODO winds perf appr wind from performance data
    const perfApprWindMag = 0; // TODO correct with magvar
    const perfApprWindDir = 0;

    const perfPageWind = Vec2Math.setFromPolar(
      perfApprWindMag,
      perfApprWindDir * MathUtils.DEGREES_TO_RADIANS,
      WindProfile.VectorCache[0],
    );

    const destinationAlt =
      this.plan.destinationRunway?.thresholdLocation.alt ?? this.plan.destinationAirport?.location.alt ?? 0;

    if (hasDescentWindEntry) {
      const lowestAltitude = descentWindEntries[descentWindEntries.length - 1].altitude;

      if (altitude < lowestAltitude) {
        return WindUtils.interpolateVectors(
          altitude,
          destinationAlt,
          lowestAltitude,
          perfPageWind,
          descentWindEntries[descentWindEntries.length - 1].vector,
          result,
        );
      } else {
        return WindUtils.interpolateWindEntries(descentWindEntries, altitude, result);
      }
    } else if (hasTripWindEntry) {
      return (
        tripWind *
        MathUtils.clamp(Common.interpolate(altitude, destinationAlt, WindConfig.TripWindMaxAltitude, 0, 1), 0, 1)
      );
    }

    return Vec2Math.set(0, 0, result);
  }

  getCruiseTailwind(distanceFromStart: NauticalMiles, distanceFromAircraft: number, altitude: Feet): TailwindComponent {
    const windPrediction = this.getCruiseWind(
      distanceFromStart,
      distanceFromAircraft,
      altitude,
      WindProfile.VectorCache[0],
    );

    return this.computeTailwindComponent(distanceFromStart, windPrediction);
  }

  getCruiseWind(
    distanceFromStart: NauticalMiles,
    distanceFromAircraft: number,
    altitude: Feet,
    result: WindVector,
  ): WindVector {
    const forecast = this.getCruiseWindVectorForecast(distanceFromStart, altitude, WindProfile.VectorCache[0]);

    const measurement = this.measurementDevice.get(WindProfile.WindMeasurementCache);

    if (measurement === null) {
      return Vec2Math.copy(forecast, result);
    }

    const forecastAtCurrentAlt = this.getCruiseWindVectorForecast(
      distanceFromStart,
      measurement.altitude,
      WindProfile.VectorCache[0],
    );

    // Blend the measurement at the current altitude with the forecast at the current altitude
    const predictionAtCurrentAlt = WindUtils.interpolateVectors(
      MathUtils.clamp(Math.abs(distanceFromAircraft), 0, WindConfig.MaxCruiseWindBlendDistance),
      0,
      WindConfig.MaxCruiseWindBlendDistance,
      measurement.vector,
      forecastAtCurrentAlt,
      WindProfile.VectorCache[1],
    );

    // Blend the prediction at the current altitude with the forecast at the target altitude
    return WindUtils.interpolateVectors(
      MathUtils.clamp(Math.abs(altitude - measurement.altitude), 0, WindConfig.MaxWindBlendAltitude),
      0,
      WindConfig.MaxWindBlendAltitude,
      predictionAtCurrentAlt,
      forecast,
      result,
    );
  }

  getCruiseWindVectorForecast(distanceFromStart: NauticalMiles, altitude: Feet, result: WindVector): WindVector {
    const windForecast = this.getCruiseWindForecast(distanceFromStart, altitude, result);

    return typeof windForecast === 'number' ? this.makeVectorAt(distanceFromStart, windForecast, result) : result;
  }

  getCruiseWindForecast(
    distanceFromStart: NauticalMiles,
    altitude: Feet,
    result: WindVector,
  ): WindVector | TailwindComponent {
    const hasCruiseWindEntry = this.plan.allLegs.some(
      (leg, i) =>
        i >= 0 &&
        i < this.plan.firstMissedApproachLegIndex &&
        !isDiscontinuity(leg) &&
        leg.cruiseWindEntries.length > 0,
    );

    // TODO winds trip wind from performance data
    const tripWind: TailwindComponent | null = null;
    const hasTripWindEntry = tripWind !== null;

    const legIndex = this.tracks.getLegIndex(distanceFromStart);
    const prevLegIndex = this.findLegIndexBefore(legIndex);

    if (legIndex < 0 || prevLegIndex < 0) {
      return 0;
    }

    const leg = this.plan.legElementAt(legIndex);

    if (hasCruiseWindEntry) {
      const legWind = this.legWinds.getCruiseWindVectorForecast(legIndex, altitude, WindProfile.VectorCache[0]);
      const prevLegWind = this.legWinds.getCruiseWindVectorForecast(prevLegIndex, altitude, WindProfile.VectorCache[1]);

      const prevLeg = this.plan.legElementAt(prevLegIndex);

      return WindUtils.interpolateVectors(
        distanceFromStart,
        prevLeg.calculated.cumulativeDistanceWithTransitions,
        leg.calculated.cumulativeDistanceWithTransitions,
        prevLegWind,
        legWind,
        result,
      );
    } else if (hasTripWindEntry) {
      return tripWind;
    }

    return Vec2Math.set(0, 0, result);
  }

  getWindForecast(
    distanceFromStart: number,
    altitude: Feet,
    phase: ProfilePhase,
    result: WindVector,
  ): WindVector | TailwindComponent {
    switch (phase) {
      case ProfilePhase.Climb:
        return this.getClimbWindForecast(altitude, result);
      case ProfilePhase.Cruise:
        return this.getCruiseWindForecast(distanceFromStart, altitude, result);
      case ProfilePhase.Descent:
        return this.getDescentWindForecast(altitude, result);
      default:
        return 0;
    }
  }

  getWindForecastAtLeg(
    index: number,
    altitude: Feet,
    phase: ProfilePhase,
    result: WindVector,
  ): WindVector | TailwindComponent {
    switch (phase) {
      case ProfilePhase.Climb:
        return this.getClimbWindForecast(altitude, result);
      case ProfilePhase.Cruise:
        return this.legWinds.getCruiseWindForecast(index, altitude, result);
      case ProfilePhase.Descent:
        return this.getDescentWindForecast(altitude, result);
      default:
        return 0;
    }
  }

  private computeTailwindComponent(distanceFromStart: number, vector: WindVector): TailwindComponent {
    const trueTrack = this.tracks.get(distanceFromStart);

    if (trueTrack === null) {
      return 0;
    }

    const trueTrackVector = Vec2Math.setFromPolar(
      1,
      trueTrack * MathUtils.DEGREES_TO_RADIANS,
      WindProfile.VectorCache[1],
    );

    // We need a minus here because the wind vector points in the direction that the wind is coming from,
    // whereas the true track vector points in the direction that the aircraft is going. So if they are pointing in the same direction,
    // the wind is actually a headwind.
    return -Vec2Math.dot(vector, trueTrackVector);
  }

  private blendWithMeasurement(forecast: WindVector, altitude: Feet, result: WindVector): WindVector {
    const measurement = this.measurementDevice.get(WindProfile.WindMeasurementCache);

    if (measurement === null) {
      return Vec2Math.copy(forecast, result);
    }

    return WindUtils.interpolateVectors(
      MathUtils.clamp(Math.abs(altitude - measurement.altitude), 0, WindConfig.MaxWindBlendAltitude),
      0,
      WindConfig.MaxWindBlendAltitude,
      measurement.vector,
      forecast,
      result,
    );
  }

  private findLegIndexBefore(beforeIndex: number): number {
    for (let i = beforeIndex - 1; i >= 0; i--) {
      if (this.plan.hasLegAt(i)) {
        return i;
      }
    }

    return -1;
  }

  private makeVectorAt(distanceFromStart: number, tailwind: TailwindComponent, result: WindVector): WindVector {
    const leg = this.tracks.getLeg(distanceFromStart);

    if (leg?.calculated?.trueTrack === undefined) {
      return Vec2Math.set(0, 0, result);
    }

    // The minus is needed because the wind vector points in the direction that the wind is coming from, whereas the leg's
    // true track points in the direction that the aircraft is going.
    return Vec2Math.set(-tailwind, leg.calculated.trueTrack * MathUtils.DEGREES_TO_RADIANS, result);
  }
}

export class ConstantWindProfile implements WindInterface {
  private static readonly VectorCache = [Vec2Math.create(), Vec2Math.create()] as const;

  private static readonly WindMeasurementCache: WindMeasurement = { altitude: NaN, vector: Vec2Math.create() };

  private readonly measurementDevice: WindObserver = new WindObserver(this.bus);

  private readonly register = Arinc429Register.empty();

  constructor(
    private readonly bus: EventBus,
    private readonly plan: FlightPlan,
  ) {}

  private getTrueTrack(): number | null {
    for (let i = 1; i <= 3; i++) {
      this.register.setFromSimVar(`L:A32NX_ADIRS_IR_${i}_TRUE_TRACK`);
      if (this.register.isNoComputedData() || this.register.isFailureWarning()) continue;

      return this.register.value;
    }

    return null;
  }

  getClimbWind(distanceFromStart: NauticalMiles, altitude: Feet, result: WindVector): WindVector {
    const windForecast = this.getClimbWindForecast(distanceFromStart, altitude, ConstantWindProfile.VectorCache[0]);

    return this.blendWithMeasurement(windForecast, altitude, result);
  }

  getClimbWindForecast(_distanceFromStart: NauticalMiles, altitude: Feet, result: WindVector): WindVector {
    const climbWindEntries = this.plan.performanceData.climbWindEntries;
    const hasClimbWindEntry = climbWindEntries.length > 0;

    const originAlt = this.plan.originRunway?.thresholdLocation.alt ?? this.plan.originAirport?.location.alt ?? 0;

    if (hasClimbWindEntry) {
      const lowestAltitude = climbWindEntries[climbWindEntries.length - 1].altitude;

      if (altitude < lowestAltitude) {
        // We use 1e-14 instead of 0 to preserve the direction of the vector when scaling it down to zero
        const scaling = Math.max(
          1e-14,
          Common.interpolate(MathUtils.clamp(altitude, originAlt, lowestAltitude), originAlt, lowestAltitude, 0, 1),
        );

        return Vec2Math.multScalar(climbWindEntries[climbWindEntries.length - 1].vector, scaling, result);
      }

      return WindUtils.interpolateWindEntries(climbWindEntries, altitude, result);
    }

    return Vec2Math.set(0, 0, result);
  }

  getClimbTailwind(distanceFromStart: NauticalMiles, altitude: Feet): TailwindComponent {
    const windPrediction = this.getClimbWind(distanceFromStart, altitude, ConstantWindProfile.VectorCache[0]);

    return this.computeTailwindComponent(distanceFromStart, windPrediction);
  }

  getDescentWind(distanceFromStart: NauticalMiles, altitude: Feet, result: WindVector): WindVector {
    const windForecast = this.getDescentWindForecast(distanceFromStart, altitude, ConstantWindProfile.VectorCache[0]);

    return this.blendWithMeasurement(windForecast, altitude, result);
  }

  getDescentWindForecast(_distanceFromStart: NauticalMiles, altitude: Feet, result: WindVector): WindVector {
    const descentWindEntries = this.plan.performanceData.descentWindEntries;
    const hasDescentWindEntry = descentWindEntries.length > 0;

    // TODO winds perf appr wind from performance data
    const perfApprWindMag = 0; // TODO winds correct with magvar
    const perfApprWindDir = 0;

    const perfPageWind = Vec2Math.setFromPolar(
      perfApprWindMag * MathUtils.DEGREES_TO_RADIANS,
      perfApprWindDir,
      ConstantWindProfile.VectorCache[0],
    );

    const destinationAlt =
      this.plan.destinationRunway?.thresholdLocation.alt ?? this.plan.destinationAirport?.location.alt ?? 0;

    if (hasDescentWindEntry) {
      const lowestAltitude = descentWindEntries[descentWindEntries.length - 1].altitude;

      if (altitude < lowestAltitude) {
        WindUtils.interpolateVectors(
          altitude,
          destinationAlt,
          lowestAltitude,
          perfPageWind,
          descentWindEntries[descentWindEntries.length - 1].vector,
          result,
        );
      } else {
        WindUtils.interpolateWindEntries(descentWindEntries, altitude, result);
      }
    }

    return Vec2Math.set(0, 0, result);
  }

  getDescentTailwind(distanceFromStart: NauticalMiles, altitude: Feet): TailwindComponent {
    const windPrediction = this.getDescentWind(distanceFromStart, altitude, ConstantWindProfile.VectorCache[0]);

    return this.computeTailwindComponent(distanceFromStart, windPrediction);
  }

  private computeTailwindComponent(_distanceFromStart: number, vector: WindVector): TailwindComponent {
    const trueTrack = this.getTrueTrack();
    if (trueTrack === null) {
      return 0;
    }

    const trueTrackVector = Vec2Math.setFromPolar(
      1,
      trueTrack * MathUtils.DEGREES_TO_RADIANS,
      ConstantWindProfile.VectorCache[1],
    );

    // We need a minus here because the wind vector points in the direction that the wind is coming from,
    // whereas the true track vector points in the direction that the aircraft is going. So if they are pointing in the same direction,
    // the wind is actually a headwind.
    return -Vec2Math.dot(vector, trueTrackVector);
  }

  private blendWithMeasurement(forecast: WindVector, altitude: Feet, result: WindVector): WindVector {
    const measurement = this.measurementDevice.get(ConstantWindProfile.WindMeasurementCache);

    if (measurement === null) {
      return Vec2Math.copy(forecast, result);
    }

    return WindUtils.interpolateVectors(
      MathUtils.clamp(Math.abs(altitude - measurement.altitude), 0, WindConfig.MaxWindBlendAltitude),
      0,
      WindConfig.MaxWindBlendAltitude,
      measurement.vector,
      forecast,
      result,
    );
  }
}

class LegWinds {
  private static readonly PropagatedWinds: PropagatedWindEntry[] = [];

  constructor(
    private readonly flightPlanService: FlightPlanService,
    private readonly index: FlightPlanIndex,
  ) {}

  get plan(): FlightPlan {
    return this.flightPlanService.get(this.index);
  }

  getCruiseWindVectorForecast(legIndex: number, altitude: Feet, result: WindVector): WindVector {
    const windForecast = this.getCruiseWindForecast(legIndex, altitude, result);

    if (typeof windForecast === 'number') {
      const leg = this.plan.legElementAt(legIndex);

      if (leg.calculated?.trueTrack === undefined) {
        return Vec2Math.set(0, 0, result);
      }

      // The minus is needed because the wind vector points in the direction that the wind is coming from, whereas the leg's
      // true track points in the direction that the aircraft is going.
      return Vec2Math.set(-windForecast, leg.calculated.trueTrack * MathUtils.DEGREES_TO_RADIANS, result);
    }

    return result;
  }

  getCruiseWindForecast(legIndex: number, altitude: Feet, result: WindVector): WindVector | TailwindComponent {
    const hasCruiseWindEntry = this.plan.allLegs.some(
      (leg, i) =>
        i >= 0 &&
        i < this.plan.firstMissedApproachLegIndex &&
        !isDiscontinuity(leg) &&
        leg.cruiseWindEntries.length > 0,
    );

    // TODO winds trip wind from performance data
    const tripWind: TailwindComponent | null = null;
    const hasTripWindEntry = tripWind !== null;

    if (hasCruiseWindEntry) {
      const legWinds = this.flightPlanService.propagateWindsAt(legIndex, LegWinds.PropagatedWinds, this.index);

      return WindUtils.interpolateWindEntries(legWinds, altitude, result);
    } else if (hasTripWindEntry) {
      return tripWind;
    }

    return Vec2Math.set(0, 0, result);
  }
}

export interface WindInterface {
  getClimbTailwind(distanceFromStart: NauticalMiles, altitude: Feet): TailwindComponent;
  getDescentTailwind(distanceFromStart: NauticalMiles, altitude: Feet): TailwindComponent;
}

class WindConfig {
  static readonly MaxWindBlendAltitude = 10_000; // feet

  static readonly MaxCruiseWindBlendDistance = 200; // NM

  static readonly TripWindMaxAltitude = 20_000; // feet
}
