// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { getConservativeWindComponents, parseDirectionalWindEntry } from './WindComponents';

describe('takeoff wind components', () => {
  it('parses directional gusts and variable wind', () => {
    expect(parseDirectionalWindEntry('090/05G12')).toEqual({ direction: 90, speed: 5, gust: 12, variable: false });
    expect(parseDirectionalWindEntry('VRB/05G12')).toEqual({
      direction: undefined,
      speed: 5,
      gust: 12,
      variable: true,
    });
    expect(parseDirectionalWindEntry('09/05')).toEqual({ direction: 9, speed: 5, gust: undefined, variable: false });
    expect(parseDirectionalWindEntry('361/05')).toBeUndefined();
    expect(parseDirectionalWindEntry('090/12G05')).toBeUndefined();
  });
  it('uses steady speed for headwind credit', () => {
    expect(getConservativeWindComponents(90, 90, 10, 20, false)).toEqual({ headwind: 10, crosswind: 0 });
  });

  it('uses gust speed for tailwind and crosswind', () => {
    expect(getConservativeWindComponents(90, 270, 10, 20, false).headwind).toBeCloseTo(-20);
    expect(getConservativeWindComponents(90, 180, 10, 20, false).crosswind).toBeCloseTo(20);
  });

  it('does not assign an arbitrary heading to variable wind', () => {
    expect(getConservativeWindComponents(90, undefined, 5, 12, true)).toEqual({ headwind: -12, crosswind: 12 });
  });

  it('preserves manually entered signed runway components', () => {
    expect(getConservativeWindComponents(90, undefined, -5, undefined, false)).toEqual({ headwind: -5, crosswind: 0 });
  });
});
