// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import {
  LandingFlapsConfig,
  LandingPerformanceDistances,
  LandingPerformanceCalculator,
  LandingRunwayConditions,
} from '@flybywiresim/fbw-sdk';
import { ApproachConf, SpeedsLookupTables } from '@shared/OperatingSpeeds';

const REFERENCE_WEIGHT = 354_380;
const REFERENCE_HEADWIND = -4.37;
const REFERENCE_ALTITUDE = 62;
const REFERENCE_OAT = 32;

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
    const conf = flaps === LandingFlapsConfig.Full ? ApproachConf.CONF_FULL : ApproachConf.CONF_3;
    const vls = SpeedsLookupTables.getApproachVls(conf, cg, weight);
    return Math.ceil(vls + Math.max(5, Math.min(15, windComponent / 3)));
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
    const tempFactor =
      1 + Math.max(-0.06, (temperature - REFERENCE_OAT) / (temperature > REFERENCE_OAT ? 300 : 400));
    const pressureFactor = 1 + Math.max(-0.04, (1014 - pressure) / 850);
    const confFactor = flaps === LandingFlapsConfig.Full ? 1 : 1.11;
    const reverserFactor = reverseThrust ? 1 : 1.09;
    const autolandFactor = autoland ? 1.04 : 1;
    const overweightFactor = overweightProcedure ? 1.1 : 1;
    const nominalVapp = this.getEstimatedVapp(weight, flaps, headwind, cg);
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
