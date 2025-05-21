// Copyright (c) 2022, 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, it, expect } from 'vitest';
import { MathUtils } from './MathUtils';

describe('MathUtils.clamp', () => {
  it('correctly clamps', () => {
    expect(MathUtils.clamp(0, -1, 1)).toBe(0);
    expect(MathUtils.clamp(-1.0, -1, 1)).toBe(-1.0);
    expect(MathUtils.clamp(1.0, -1, 1)).toBe(1);
    expect(MathUtils.clamp(-1.001, -1, 1)).toBe(-1);
    expect(MathUtils.clamp(0.11, 0.1, 0.2)).toBe(0.11);
    expect(MathUtils.clamp(0.21, 0.1, 0.2)).toBe(0.2);
  });
});

describe('MathUtils.round', () => {
  it('correctly rounds', () => {
    expect(MathUtils.round(1.005, 2)).toBeCloseTo(2);
    expect(MathUtils.round(1.005, 3)).toBeCloseTo(0);
    expect(MathUtils.round(1.004, 0.005)).toBeCloseTo(1.005, 3);
    expect(MathUtils.round(1.5, 0)).toBe(NaN);
    expect(MathUtils.round(1.05, 1)).toBeCloseTo(1);
    expect(MathUtils.round(1.33, 0.25)).toBeCloseTo(1.25);
    expect(MathUtils.round(1.38, 0.25)).toBeCloseTo(1.5);
  });
});

describe('MathUtils.ceil', () => {
  it('correctly rounds up', () => {
    expect(MathUtils.ceil(1.005, 2)).toBeCloseTo(2);
    expect(MathUtils.ceil(1.005, 3)).toBeCloseTo(3);
    expect(MathUtils.ceil(1.004, 0.005)).toBeCloseTo(1.005, 3);
    expect(MathUtils.ceil(1.5, 0)).toBe(NaN);
    expect(MathUtils.ceil(1.05, 1)).toBeCloseTo(2);
    expect(MathUtils.ceil(1.33, 0.25)).toBeCloseTo(1.5);
    expect(MathUtils.ceil(1.38, 0.25)).toBeCloseTo(1.5);
  });
});

describe('MathUtils.floor', () => {
  it('correctly rounds down', () => {
    expect(MathUtils.floor(1.005, 2)).toBeCloseTo(0);
    expect(MathUtils.floor(1.005, 3)).toBeCloseTo(0);
    expect(MathUtils.floor(1.004, 0.005)).toBeCloseTo(1.0, 3);
    expect(MathUtils.floor(1.5, 0)).toBe(NaN);
    expect(MathUtils.floor(1.05, 1)).toBeCloseTo(1);
    expect(MathUtils.floor(1.33, 0.25)).toBeCloseTo(1.25);
    expect(MathUtils.floor(1.38, 0.25)).toBeCloseTo(1.25);
  });
});

describe('MathUtils.angleAdd', () => {
  it('correctly adds two angles', () => {
    expect(MathUtils.angleAdd(270, 90)).toBeCloseTo(360, 4);
    expect(MathUtils.angleAdd(270, 90.1)).toBeCloseTo(0.1, 4);
    expect(MathUtils.angleAdd(270, -90)).toBeCloseTo(180, 4);
    expect(MathUtils.angleAdd(90, -90)).toBeCloseTo(0, 4);
    expect(MathUtils.angleAdd(90, -90)).toBeCloseTo(0, 4);
    expect(MathUtils.angleAdd(90, -89.9)).toBeCloseTo(0.1, 4);
    expect(MathUtils.angleAdd(-90, -89.9)).toBeCloseTo(180.1, 4);
    expect(MathUtils.angleAdd(-90, -90.1)).toBeCloseTo(179.9, 4);
    expect(MathUtils.angleAdd(359, -359)).toBeCloseTo(0, 4);
    expect(MathUtils.angleAdd(180, 179.9)).toBeCloseTo(359.9, 4);
    expect(MathUtils.angleAdd(180, 180.1)).toBeCloseTo(0.1, 4);
    expect(MathUtils.angleAdd(-180, 180.1)).toBeCloseTo(0.1, 4);
    expect(MathUtils.angleAdd(-180, -180.1)).toBeCloseTo(359.9, 4);
  });
});

describe('MathUtils.normalise360', () => {
  it('correctly normalises angles already in the nominal range', () => {
    expect(MathUtils.normalise360(0)).toBeCloseTo(0);
    expect(MathUtils.normalise360(180)).toBeCloseTo(180);
    expect(MathUtils.normalise360(359.9)).toBeCloseTo(359.9);
  });
  it('correctly normalises angles below the nominal range', () => {
    expect(MathUtils.normalise360(-1)).toBeCloseTo(359);
    expect(MathUtils.normalise360(-180)).toBeCloseTo(180);
    expect(MathUtils.normalise360(-359.9)).toBeCloseTo(0.1);
    expect(MathUtils.normalise360(-720)).toBeCloseTo(0);
    expect(MathUtils.normalise360(-540)).toBeCloseTo(180);
  });
  it('correctly normalises angles above the nominal range', () => {
    expect(MathUtils.normalise360(360)).toBeCloseTo(0);
    expect(MathUtils.normalise360(719)).toBeCloseTo(359);
    expect(MathUtils.normalise360(540)).toBeCloseTo(180);
    expect(MathUtils.normalise360(360.1)).toBeCloseTo(0.1);
    expect(MathUtils.normalise360(720)).toBeCloseTo(0);
  });
});

describe('MathUtils.normalise180', () => {
  it('correctly normalises angles already in the nominal range', () => {
    expect(MathUtils.normalise180(-180)).toBeCloseTo(-180);
    expect(MathUtils.normalise180(0)).toBeCloseTo(0);
    expect(MathUtils.normalise180(179.9)).toBeCloseTo(179.9);
  });
  it('correctly normalises angles below the nominal range', () => {
    expect(MathUtils.normalise180(-181)).toBeCloseTo(179);
    expect(MathUtils.normalise180(-359.9)).toBeCloseTo(0.1);
    expect(MathUtils.normalise180(-720)).toBeCloseTo(0);
    expect(MathUtils.normalise180(-540)).toBeCloseTo(-180);
  });
  it('correctly normalises angles above the nominal range', () => {
    expect(MathUtils.normalise180(180)).toBeCloseTo(-180);
    expect(MathUtils.normalise180(719)).toBeCloseTo(-1);
    expect(MathUtils.normalise180(540)).toBeCloseTo(-180);
    expect(MathUtils.normalise180(720)).toBeCloseTo(0);
  });
});

describe('MathUtils.normalise2Pi', () => {
  it('correctly normalises angles already in the nominal range', () => {
    expect(MathUtils.normalise2Pi(0)).toBeCloseTo(0);
    expect(MathUtils.normalise2Pi(Math.PI)).toBeCloseTo(Math.PI);
    expect(MathUtils.normalise2Pi(Math.PI - 0.1)).toBeCloseTo(Math.PI - 0.1);
  });
  it('correctly normalises angles below the nominal range', () => {
    expect(MathUtils.normalise2Pi(-0.1)).toBeCloseTo(2 * Math.PI - 0.1);
    expect(MathUtils.normalise2Pi(-Math.PI)).toBeCloseTo(Math.PI);
    expect(MathUtils.normalise2Pi(-2 * Math.PI + 0.1)).toBeCloseTo(0.1);
    expect(MathUtils.normalise2Pi(-2 * Math.PI)).toBeCloseTo(0);
    expect(MathUtils.normalise2Pi(-3 * Math.PI)).toBeCloseTo(Math.PI);
  });
  it('correctly normalises angles above the nominal range', () => {
    expect(MathUtils.normalise2Pi(2 * Math.PI)).toBeCloseTo(0);
    expect(MathUtils.normalise2Pi(4 * Math.PI - 0.1)).toBeCloseTo(2 * Math.PI - 0.1);
    expect(MathUtils.normalise2Pi(3 * Math.PI + 0.1)).toBeCloseTo(Math.PI + 0.1);
    expect(MathUtils.normalise2Pi(2 * Math.PI + 0.1)).toBeCloseTo(0.1);
    expect(MathUtils.normalise2Pi(4 * Math.PI)).toBeCloseTo(0);
  });
});

describe('MathUtils.normalisePi', () => {
  it('correctly normalises angles already in the nominal range', () => {
    expect(MathUtils.normalisePi(-Math.PI)).toBeCloseTo(-Math.PI);
    expect(MathUtils.normalisePi(0)).toBeCloseTo(0);
    expect(MathUtils.normalisePi(Math.PI - 0.1)).toBeCloseTo(Math.PI - 0.1);
  });
  it('correctly normalises angles below the nominal range', () => {
    expect(MathUtils.normalisePi(-Math.PI - 0.1)).toBeCloseTo(Math.PI - 0.1);
    expect(MathUtils.normalisePi(-2 * Math.PI + 0.1)).toBeCloseTo(0.1);
    expect(MathUtils.normalisePi(-4 * Math.PI)).toBeCloseTo(0);
    expect(MathUtils.normalisePi(-3 * Math.PI)).toBeCloseTo(-Math.PI);
  });
  it('correctly normalises angles above the nominal range', () => {
    expect(MathUtils.normalisePi(Math.PI)).toBeCloseTo(-Math.PI);
    expect(MathUtils.normalisePi(4 * Math.PI - 0.1)).toBeCloseTo(-0.1);
    expect(MathUtils.normalisePi(3 * Math.PI)).toBeCloseTo(-Math.PI);
    expect(MathUtils.normalisePi(4 * Math.PI)).toBeCloseTo(0);
  });
});

describe('MathUtils.correctMsfsLocaliserError', () => {
  it('does not change regular front course deviations', () => {
    expect(MathUtils.correctMsfsLocaliserError(1.2)).toBeCloseTo(1.2);
    expect(MathUtils.correctMsfsLocaliserError(89.9)).toBeCloseTo(89.9);
    expect(MathUtils.correctMsfsLocaliserError(0)).toBeCloseTo(0);
    expect(MathUtils.correctMsfsLocaliserError(-2.5)).toBeCloseTo(-2.5);
    expect(MathUtils.correctMsfsLocaliserError(-89.9)).toBeCloseTo(-89.9);
  });
  it('corrects back beam deviations', () => {
    expect(MathUtils.correctMsfsLocaliserError(-178.8)).toBeCloseTo(-1.2);
    expect(MathUtils.correctMsfsLocaliserError(-90.1)).toBeCloseTo(-89.9);
    expect(MathUtils.correctMsfsLocaliserError(0)).toBeCloseTo(0);
    expect(MathUtils.correctMsfsLocaliserError(177.5)).toBeCloseTo(2.5);
    expect(MathUtils.correctMsfsLocaliserError(90.1)).toBeCloseTo(89.9);
  });

  describe('MathUtils.convertMachToKCas', () => {
    it('correctly converts mach to CAS', () => {
      expect(MathUtils.convertMachToKCas(0, 1013.25)).toBeCloseTo(0);
      expect(MathUtils.convertMachToKCas(0.84, 1013.25)).toBeCloseTo(555.634);
      // FL350 = 238.423 hPa
      expect(MathUtils.convertMachToKCas(0, 238.423)).toBeCloseTo(0);
      expect(MathUtils.convertMachToKCas(0.84, 238.423)).toBeCloseTo(287.097);
    });
  });
});
