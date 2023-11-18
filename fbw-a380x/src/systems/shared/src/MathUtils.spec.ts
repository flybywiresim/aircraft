// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

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
        expect(MathUtils.round(1.005, 2)).toBe(1.01);
        expect(MathUtils.round(1.005, 3)).toBe(1.005);
        expect(MathUtils.round(1.004, 2)).toBe(1);
        expect(MathUtils.round(1.5, 0)).toBe(2);
        expect(MathUtils.round(1.05, 1)).toBe(1.1);
        expect(MathUtils.round(1.05, 0)).toBe(1);
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
