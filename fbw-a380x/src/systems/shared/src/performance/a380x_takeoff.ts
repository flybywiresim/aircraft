// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import {
  LineupAngle,
  RunwayCondition,
  TakeoffAntiIceSetting,
  TakeoffPerfomanceError,
  TakeoffPerformanceCalculator,
  TakeoffPerformanceInputs,
  TakeoffPerformanceParameters,
  TakeoffPerformanceResult,
} from '@flybywiresim/fbw-sdk';
import { ApproachConf, SpeedsLookupTables } from '@shared/OperatingSpeeds';

const REFERENCE_TORA = 4_315;
const REFERENCE_PRESSURE_ALT = 62;
const REFERENCE_HEADWIND = 4;
const REFERENCE_OAT = 32;

// SimBrief A380-842 OMDB 12R dry-runway samples, 14,157 ft TORA, normalized to 4 kt headwind.
// The mass sweep used 090/06 wind; its stop runs include a 22 m correction to the 090/05 reference wind.
const referenceStopRuns: ReadonlyArray<readonly [number, number]> = [
  [320_000, 3_302],
  [340_000, 3_329],
  [360_000, 3_389],
  [361_546, 3_401],
  [380_000, 3_611],
  [400_000, 3_900],
  [420_000, 3_915],
  [450_000, 3_990],
  [480_000, 3_985],
  [500_000, 3_904],
];

const referenceFlexTemps: ReadonlyArray<readonly [number, number]> = [
  [320_000, 75],
  [380_000, 75],
  [400_000, 74],
  [420_000, 70],
  [450_000, 65],
  [480_000, 60],
  [500_000, 55],
];

const interpolate = (points: ReadonlyArray<readonly [number, number]>, x: number): number => {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [upperX, upperY] = points[i];
    if (x <= upperX) {
      const [lowerX, lowerY] = points[i - 1];
      return lowerY + ((x - lowerX) * (upperY - lowerY)) / (upperX - lowerX);
    }
  }
  return points[points.length - 1][1];
};

const surfaceFactor: Record<RunwayCondition, number> = {
  [RunwayCondition.Dry]: 1,
  [RunwayCondition.Wet]: 1.15,
  [RunwayCondition.Contaminated6mmWater]: 1.45,
  [RunwayCondition.Contaminated13mmWater]: 1.75,
  [RunwayCondition.Contaminated6mmSlush]: 1.5,
  [RunwayCondition.Contaminated13mmSlush]: 1.8,
  [RunwayCondition.ContaminatedCompactedSnow]: 1.4,
  [RunwayCondition.Contaminated5mmWetSnow]: 1.45,
  [RunwayCondition.Contaminated15mmWetSnow]: 1.8,
  [RunwayCondition.Contaminated30mmWetSnow]: 2.2,
  [RunwayCondition.Contaminated10mmDrySnow]: 1.5,
  [RunwayCondition.Contaminated100mmDrySnow]: 2.3,
};

const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));

/** Simulator estimate calibrated against A380-842 SimBrief Dispatch reference cases. */
export class A380XTakeoffPerformanceCalculator implements TakeoffPerformanceCalculator {
  public readonly structuralMtow = 510_000;
  public readonly maxPressureAlt = 10_000;
  public readonly oew = 300_006;
  public readonly maxHeadwind = 40;
  public readonly maxTailwind = 15;

  public isCgWithinLimits(cg: number, _tow: number): boolean {
    return cg >= 23 && cg <= 48;
  }

  public getCrosswindLimit(condition: RunwayCondition, _oat: number): number {
    return condition === RunwayCondition.Dry ? 35 : condition === RunwayCondition.Wet ? 30 : 20;
  }

  public calculateTakeoffPerformance(
    tow: number,
    forwardCg: boolean,
    conf: number,
    tora: number,
    slope: number,
    lineupAngle: LineupAngle,
    wind: number,
    elevation: number,
    qnh: number,
    oat: number,
    antiIce: TakeoffAntiIceSetting,
    packs: boolean,
    forceToga: boolean,
    runwayCondition: RunwayCondition,
    cg?: number,
    _out?: Partial<TakeoffPerformanceResult>,
  ): TakeoffPerformanceResult {
    const inputs: TakeoffPerformanceInputs = {
      tow,
      forwardCg,
      cg,
      conf,
      tora,
      slope,
      lineupAngle,
      wind,
      elevation,
      qnh,
      oat,
      antiIce,
      packs,
      forceToga,
      runwayCondition,
    };
    const pressureAlt = elevation + (1013.25 - qnh) * 27;
    const adjustedTora = tora - (lineupAngle === 180 ? 120 : lineupAngle === 90 ? 60 : 0);
    const headwind = Math.min(wind, this.maxHeadwind);
    const isaTemp = 15 - pressureAlt * 0.00198;
    const params: TakeoffPerformanceParameters = {
      adjustedTora,
      pressureAlt,
      isaTemp,
      tRef: 45,
      tMax: 55,
      tFlexMax: 80,
      headwind,
    };
    const result: TakeoffPerformanceResult = { inputs, params, error: TakeoffPerfomanceError.None };

    if (
      ![tow, tora, slope, wind, elevation, qnh, oat].every(Number.isFinite) ||
      tora <= 0 ||
      qnh <= 0 ||
      conf < 1 ||
      conf > 3
    ) {
      result.error = TakeoffPerfomanceError.InvalidData;
    } else if (tow < this.oew) {
      result.error = TakeoffPerfomanceError.OperatingEmptyWeight;
    } else if (tow > this.structuralMtow) {
      result.error = TakeoffPerfomanceError.StructuralMtow;
    } else if (pressureAlt > this.maxPressureAlt) {
      result.error = TakeoffPerfomanceError.MaximumPressureAlt;
    } else if (wind < -this.maxTailwind) {
      result.error = TakeoffPerfomanceError.MaximumTailwind;
    } else if (Math.abs(slope) > 3) {
      result.error = TakeoffPerfomanceError.MaximumRunwaySlope;
    } else if (cg !== undefined && !this.isCgWithinLimits(cg, tow)) {
      result.error = TakeoffPerfomanceError.CgOutOfLimits;
    }
    if (result.error !== TakeoffPerfomanceError.None) return result;

    const antiIcePenalty =
      antiIce === TakeoffAntiIceSetting.EngineWing ? 13_000 : antiIce === TakeoffAntiIceSetting.Engine ? 6_000 : 0;
    const shortRunwayPenalty = Math.max(0, 4_300 - adjustedTora) * (conf === 1 ? 155 : conf === 2 ? 125 : 118);
    const mtow = clamp(
      this.structuralMtow -
        shortRunwayPenalty -
        Math.max(0, pressureAlt - 500) * 17 -
        Math.max(0, oat - REFERENCE_OAT) * 500 +
        (headwind - REFERENCE_HEADWIND) * 180 -
        antiIcePenalty -
        Math.max(0, slope) * 6_000 -
        (surfaceFactor[runwayCondition] - 1) * 100_000,
      this.oew,
      this.structuralMtow,
    );
    result.mtow = Math.round(mtow);
    if (tow > mtow) {
      result.error = TakeoffPerfomanceError.TooHeavy;
      return result;
    }

    const lookupConf = conf === 1 ? ApproachConf.CONF_1 : conf === 2 ? ApproachConf.CONF_2 : ApproachConf.CONF_3;
    const vls = SpeedsLookupTables.getApproachVls(lookupConf, cg ?? (forwardCg ? 29 : 36), tow);
    const altitudeCorrection = Math.max(0, pressureAlt - REFERENCE_PRESSURE_ALT) / 3_000;
    const v2 = Math.ceil(vls + (conf === 1 ? 4 : conf === 2 ? 5 : 6) + altitudeCorrection);
    const vr = v2 - (conf === 1 ? 1 : 2);
    const runwayV1Correction =
      (adjustedTora < REFERENCE_TORA
        ? (adjustedTora - REFERENCE_TORA) / 105
        : (adjustedTora - REFERENCE_TORA) / 600) +
      (Math.min(headwind, REFERENCE_HEADWIND) - REFERENCE_HEADWIND) / 8;
    const v1 = clamp(Math.round(143 + runwayV1Correction), 110, vr);
    result.v1 = v1;
    result.vR = vr;
    result.v2 = v2;

    // At OMDB 12R, 14,157 ft TORA minus 3,002 ft stop margin is a 3,401 m stop run.
    result.asd = Math.round(
      interpolate(referenceStopRuns, tow) *
        Math.pow(v1 / 143, 2) *
        surfaceFactor[runwayCondition] +
        (REFERENCE_HEADWIND - headwind) * 22 +
        (conf - 1) * 80 +
        Math.max(0, slope) * 110,
    );
    if (result.asd > adjustedTora) {
      result.error = TakeoffPerfomanceError.TooHeavy;
      return result;
    }

    if (!forceToga && runwayCondition !== RunwayCondition.Dry && runwayCondition !== RunwayCondition.Wet) return result;
    if (!forceToga) {
      const flex =
        interpolate(referenceFlexTemps, tow) +
        (adjustedTora - REFERENCE_TORA) * 0.008 -
        (pressureAlt - REFERENCE_PRESSURE_ALT) / 500 -
        (oat - REFERENCE_OAT) * 0.25 +
        (headwind - REFERENCE_HEADWIND) * 0.1 -
        (conf - 1) * 1.5 -
        (antiIce === TakeoffAntiIceSetting.Off ? 0 : 3) -
        (packs ? 0 : 1);
      if (flex >= oat + 1) result.flex = Math.round(clamp(flex, oat + 1, params.tFlexMax));
    }
    return result;
  }

  public calculateTakeoffPerformanceOptConf(
    tow: number,
    forwardCg: boolean,
    tora: number,
    slope: number,
    lineupAngle: LineupAngle,
    wind: number,
    elevation: number,
    qnh: number,
    oat: number,
    antiIce: TakeoffAntiIceSetting,
    packs: boolean,
    forceToga: boolean,
    runwayCondition: RunwayCondition,
    cg?: number,
    out?: Partial<TakeoffPerformanceResult>,
  ): TakeoffPerformanceResult {
    const candidates = [1, 2, 3].map((conf) =>
      this.calculateTakeoffPerformance(
        tow,
        forwardCg,
        conf,
        tora,
        slope,
        lineupAngle,
        wind,
        elevation,
        qnh,
        oat,
        antiIce,
        packs,
        forceToga,
        runwayCondition,
        cg,
        out,
      ),
    );
    return candidates.find((candidate) => candidate.error === TakeoffPerfomanceError.None) ?? candidates[0];
  }
}
