// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import {
  LandingFlapsConfig,
  LandingRunwayConditions,
  RunwayCondition,
  TakeoffAntiIceSetting,
  TakeoffPerfomanceError,
} from '@flybywiresim/fbw-sdk';
import { A380XLandingPerformanceCalculator } from './a380x_landing';
import { A380XTakeoffPerformanceCalculator } from './a380x_takeoff';

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
    expect(result.asd).toBeCloseTo(3_401, -1);
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

  it('accepts a TOW equal to the rounded runway-limited MTOW', () => {
    const calculator = new A380XTakeoffPerformanceCalculator();
    const inputs = [
      400_000,
      false,
      1,
      4_315,
      0,
      0,
      4,
      6_138.5,
      1_014,
      32,
      TakeoffAntiIceSetting.Off,
      true,
      false,
      RunwayCondition.Dry,
    ] as const;
    const reference = calculator.calculateTakeoffPerformance(...inputs);
    expect(reference.error).toBe(TakeoffPerfomanceError.None);
    expect(reference.mtow).toBeDefined();

    const atLimit = calculator.calculateTakeoffPerformance(
      reference.mtow!,
      false,
      1,
      4_315,
      0,
      0,
      4,
      6_138.5,
      1_014,
      32,
      TakeoffAntiIceSetting.Off,
      true,
      false,
      RunwayCondition.Dry,
    );
    expect(atLimit.error).toBe(TakeoffPerfomanceError.None);
  });

  it('continues the experimental calculation above runway performance limits', () => {
    const result = new A380XTakeoffPerformanceCalculator().calculateTakeoffPerformance(
      500_000,
      false,
      1,
      3_000,
      0,
      0,
      0,
      0,
      1_014,
      32,
      TakeoffAntiIceSetting.Off,
      true,
      false,
      RunwayCondition.Dry,
    );
    expect(result.error).toBe(TakeoffPerfomanceError.None);
    expect(result.mtow).toBeLessThan(500_000);
    expect(result.v1).toBeDefined();
    expect(result.asd).toBeGreaterThan(3_000);
  });

  it('publishes speeds when TOW exceeds the runway-limited MTOW', () => {
    const calculator = new A380XTakeoffPerformanceCalculator();
    const result = calculator.calculateTakeoffPerformance(
      500_000,
      false,
      1,
      4_315,
      0,
      0,
      4,
      6_138.5,
      1_014,
      32,
      TakeoffAntiIceSetting.Off,
      true,
      false,
      RunwayCondition.Dry,
    );

    expect(result.error).toBe(TakeoffPerfomanceError.None);
    expect(result.mtow).toBeLessThan(result.inputs.tow);
    expect(result.v1).toBeDefined();
    expect(result.vR).toBeDefined();
    expect(result.v2).toBeDefined();
  });

  it('rejects a takeoff CG outside the configured envelope', () => {
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
      50,
    );
    expect(result.error).toBe(TakeoffPerfomanceError.CgOutOfLimits);
  });

  it('tracks the OMDB 30L flaps 2 and tailwind reference', () => {
    const result = new A380XTakeoffPerformanceCalculator().calculateTakeoffPerformance(
      361_546,
      false,
      2,
      4_447,
      0,
      0,
      -4,
      62,
      1014,
      32,
      TakeoffAntiIceSetting.Off,
      true,
      false,
      RunwayCondition.Dry,
    );
    expect(result.error).toBe(TakeoffPerfomanceError.None);
    expect(result.v1).toBe(142);
    expect(result.vR).toBe(142);
    expect(result.v2).toBe(144);
    expect(result.flex).toBe(74);
    expect(result.asd).toBeCloseTo(3_610, -1);
  });

  it('tracks the observed takeoff weight effects on FLEX and stop run', () => {
    const calculator = new A380XTakeoffPerformanceCalculator();
    const result = (weight: number) =>
      calculator.calculateTakeoffPerformance(
        weight,
        false,
        1,
        4_315,
        0,
        0,
        5,
        62,
        1014,
        32,
        TakeoffAntiIceSetting.Off,
        true,
        false,
        RunwayCondition.Dry,
      );
    expect(result(320_000).flex).toBe(75);
    expect(result(400_000).flex).toBe(74);
    expect(result(500_000).flex).toBe(55);
    expect(result(320_000).asd).toBeCloseTo(3_280, -1);
    expect(result(500_000).asd).toBeCloseTo(3_882, -1);
  });

  it('keeps the measured FLEX setting across the sampled OAT range', () => {
    const calculator = new A380XTakeoffPerformanceCalculator();
    const flex = (oat: number) =>
      calculator.calculateTakeoffPerformance(
        361_546,
        false,
        1,
        4_315,
        0,
        0,
        4,
        62,
        1014,
        oat,
        TakeoffAntiIceSetting.Off,
        true,
        false,
        RunwayCondition.Dry,
      ).flex;
    expect(flex(10)).toBe(75);
    expect(flex(40)).toBe(75);
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

  it('tracks the measured landing weight trend at fixed runway and weather', () => {
    const calculator = new A380XLandingPerformanceCalculator();
    const distance = (weight: number, vapp: number) =>
      calculator.calculateLandingDistances(
        weight,
        LandingFlapsConfig.Full,
        LandingRunwayConditions.Dry,
        vapp,
        90,
        5,
        299,
        true,
        62,
        32,
        0,
        false,
        1014,
        false,
      ).lowAutobrakeDist;
    expect(distance(320_000, 129)).toBeCloseTo(1_974, -1);
    expect(distance(395_000, 142)).toBeCloseTo(2_217, -1);
  });

  it('penalizes stronger tailwind and low pressure in the landing estimate', () => {
    const calculator = new A380XLandingPerformanceCalculator();
    const distance = (windDirection: number, windMagnitude: number, pressure: number) =>
      calculator.calculateLandingDistances(
        354_380,
        LandingFlapsConfig.Full,
        LandingRunwayConditions.Dry,
        135,
        windDirection,
        windMagnitude,
        299,
        true,
        62,
        32,
        0,
        false,
        pressure,
        false,
      ).lowAutobrakeDist;
    expect(distance(90, 20, 1014)).toBeCloseTo(2_536, -1);
    expect(distance(300, 10, 1014)).toBeCloseTo(1_826, -1);
    expect(distance(90, 5, 980)).toBeCloseTo(2_165, -1);
  });
});
