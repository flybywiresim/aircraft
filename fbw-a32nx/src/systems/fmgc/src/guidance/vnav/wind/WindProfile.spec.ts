// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { scaleWindVector } from '../../../flightplanning/data/wind';
import { scalingBelowLowestWindEntry } from './WindProfile';

describe('scalingBelowLowestWindEntry', () => {
  it('scales linearly from the airport to the lowest entry', () => {
    expect(scalingBelowLowestWindEntry(2000, 1000, 3000)).toBeCloseTo(0.5);
    expect(scalingBelowLowestWindEntry(500, 1000, 3000)).toBe(Number.EPSILON);
  });

  it('applies an entry at the airport elevation as is (destination wind on PERF APPR)', () => {
    // The MSFS airport elevation is the mean runway elevation, often equal to the threshold
    expect(scalingBelowLowestWindEntry(2108, 2181, 2181)).toBe(1);
    expect(scalingBelowLowestWindEntry(2100, 2181, 2150)).toBe(1);
  });
});

describe('scaleWindVector', () => {
  it('keeps the direction', () => {
    const result = { direction: undefined, magnitude: undefined };
    expect(scaleWindVector({ direction: 4, magnitude: 20 }, 0.25, result)).toEqual({ direction: 4, magnitude: 5 });
  });
});
