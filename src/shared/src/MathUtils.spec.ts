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
