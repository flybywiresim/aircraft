// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it, vi } from 'vitest';
import {
  LandingFlapsConfig,
  LandingRunwayConditions,
  RunwayCondition,
  TakeoffAntiIceSetting,
  TakeoffPerfomanceError,
} from '@flybywiresim/fbw-sdk';
import { A380XLandingPerformanceCalculator } from './a380x_landing';
import { A380XTakeoffPerformanceCalculator } from './a380x_takeoff';

vi.mock('@shared/OperatingSpeeds', () => ({
  ApproachConf: { CONF_1: 1, CONF_2: 3, CONF_3: 4, CONF_FULL: 5 },
  SpeedsLookupTables: {
    getApproachVls: (conf: number) => (conf === 1 ? 150 : conf === 3 ? 139 : 130),
  },
}));

describe('A380X performance estimates', () => {
  it('returns the OMDB dry-runway takeoff reference speeds', () => {
    const result = new A380XTakeoffPerformanceCalculator().calculateTakeoffPerformance(
      361_546,
      false,
      1,
      4_315,
      0,
      0,
      4,
      62,
      1014,
      32,
      TakeoffAntiIceSetting.Off,
      true,
      false,
      RunwayCondition.Dry,
    );
    expect(result.error).toBe(TakeoffPerfomanceError.None);
    expect(result.v1).toBe(143);
    expect(result.vR).toBe(153);
    expect(result.v2).toBe(154);
    expect(result.flex).toBe(75);
  });

  it('rejects an overweight takeoff instead of publishing speeds', () => {
    const result = new A380XTakeoffPerformanceCalculator().calculateTakeoffPerformance(
      520_000,
      false,
      1,
      4_315,
      0,
      0,
      4,
      62,
      1014,
      32,
      TakeoffAntiIceSetting.Off,
      true,
      false,
      RunwayCondition.Dry,
    );
    expect(result.error).toBe(TakeoffPerfomanceError.StructuralMtow);
    expect(result.v1).toBeUndefined();
  });

  it('tracks both SimBrief OMDB landing reference directions', () => {
    const calculator = new A380XLandingPerformanceCalculator();
    const landing = (heading: number) =>
      calculator.calculateLandingDistances(
        354_380,
        LandingFlapsConfig.Full,
        LandingRunwayConditions.Dry,
        135,
        90,
        5,
        heading,
        true,
        62,
        32,
        0,
        false,
        1014,
        false,
      );
    expect(landing(299).lowAutobrakeDist).toBeCloseTo(2_082, -1);
    expect(landing(119).lowAutobrakeDist).toBeCloseTo(1_889, -1);
    expect(landing(119).lowAutobrakeDist).toBeLessThan(landing(299).lowAutobrakeDist);
  });

  it('estimates a plausible A380X VAPP from its own speed table', () => {
    expect(new A380XLandingPerformanceCalculator().getEstimatedVapp(354_380, LandingFlapsConfig.Full)).toBe(135);
  });
});
