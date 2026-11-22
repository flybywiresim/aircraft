// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import {
  LandingFlapsConfig,
  LandingPerformanceDistances,
  LandingPerformanceCalculator,
  LandingRunwayConditions,
} from '@flybywiresim/fbw-sdk';
import { ApproachConf, getApproachVls } from './a380x_vls';
import { getA380TableVapp } from './a380x_approach_speeds';

const REFERENCE_WEIGHT = 354_380;
const REFERENCE_HEADWIND = -4.37;
const REFERENCE_ALTITUDE = 62;
const REFERENCE_OAT = 32;
const REFERENCE_PRESSURE = 1014;

const pressureAltitudeOffset = (qnh: number): number => 145442.15 * (1 - (qnh / 1013.25) ** 0.190263);

const surfaceFactor: Record<LandingRunwayConditions, number> = {
  [LandingRunwayConditions.Dry]: 1,
  [LandingRunwayConditions.Good]: 1.16,
  [LandingRunwayConditions.GoodMedium]: 1.32,
  [LandingRunwayConditions.Medium]: 1.52,
  [LandingRunwayConditions.MediumPoor]: 1.78,
  [LandingRunwayConditions.Poor]: 2.15,
};

/** Simulator estimate calibrated to the A380X SimBrief Dispatch dry-runway reference cases. */
export class A380XLandingPerformanceCalculator implements LandingPerformanceCalculator {
  public getEstimatedVapp(weight: number, flaps: LandingFlapsConfig, windComponent = 0, cg = 36): number {
    const tableVapp = getA380TableVapp(weight, flaps);
    const windAdditive = Math.max(0, Math.min(10, windComponent / 3));
    const dispatchWeight =
      flaps === LandingFlapsConfig.Full ? 0.5 * Math.max(0, 1 - Math.abs(weight - REFERENCE_WEIGHT) / 10_000) : 0;
    const estimated = tableVapp * (1 - dispatchWeight) + 135 * dispatchWeight + windAdditive;
    if (weight > 386_999) {
      const conf = flaps === LandingFlapsConfig.Full ? ApproachConf.CONF_FULL : ApproachConf.CONF_3;
      return Math.max(Math.ceil(estimated), Math.ceil(getApproachVls(conf, cg, weight) + 5));
    }
    return Math.ceil(estimated);
  }

  public calculateLandingDistances(
    weight: number,
    flaps: LandingFlapsConfig,
    runwayCondition: LandingRunwayConditions,
    approachSpeed: number,
    windDirection: number,
    windMagnitude: number,
    runwayHeading: number,
    reverseThrust: boolean,
    altitude: number,
    temperature: number,
    slope: number,
    overweightProcedure: boolean,
    pressure: number,
    autoland: boolean,
    cg = 36,
  ): LandingPerformanceDistances {
    const headwind = windMagnitude * Math.cos(((windDirection - runwayHeading) * Math.PI) / 180);
    const vapp = approachSpeed > 0 ? approachSpeed : this.getEstimatedVapp(weight, flaps, headwind, cg);
    const densityFactor = 1 + Math.max(-0.08, (altitude - REFERENCE_ALTITUDE) / 40_000);
    const tempFactor = 1 + Math.max(-0.06, (temperature - REFERENCE_OAT) / (temperature > REFERENCE_OAT ? 300 : 400));
    const pressureFactor =
      1 + Math.max(-0.04, (pressureAltitudeOffset(pressure) - pressureAltitudeOffset(REFERENCE_PRESSURE)) / 23_000);
    const confFactor = flaps === LandingFlapsConfig.Full ? 1 : 1.11;
    const reverserFactor = reverseThrust ? 1 : 1.09;
    const autolandFactor = autoland ? 1.04 : 1;
    const overweightFactor = overweightProcedure ? 1.1 : 1;
    const nominalVapp =
      flaps === LandingFlapsConfig.Full
        ? Math.round(135 + (weight - REFERENCE_WEIGHT) / 6_000)
        : this.getEstimatedVapp(weight, flaps, headwind, cg);
    const energyDistance =
      Math.max(0, 2_082 + (weight - REFERENCE_WEIGHT) * 0.00326) *
      Math.pow(vapp / nominalVapp, 2) *
      surfaceFactor[runwayCondition] *
      confFactor *
      reverserFactor *
      densityFactor *
      tempFactor *
      pressureFactor *
      autolandFactor *
      overweightFactor;
    const windCorrection =
      (REFERENCE_HEADWIND - Math.min(headwind, 5)) * 22 +
      Math.max(0, -headwind - 5) * 13 -
      Math.max(0, headwind - 5) * 10;
    const lowAutobrakeDist = Math.max(0, energyDistance + windCorrection + Math.max(0, -slope) * 90);
    return {
      maxAutobrakeDist: Math.round(lowAutobrakeDist * 0.73),
      mediumAutobrakeDist: Math.round(lowAutobrakeDist * 0.86),
      lowAutobrakeDist: Math.round(lowAutobrakeDist),
      factoredLandingDist: Math.round(lowAutobrakeDist * 1.26),
    };
  }
}
