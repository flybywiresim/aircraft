// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import type { PayloadPerformanceEnvelopeVariant } from '@flybywiresim/fbw-sdk-react';
import { describe, expect, it } from 'vitest';
import { selectPerformanceEnvelopeVariant } from './PerformanceEnvelopeSelector';

// Minimal mock variants required to test variant selection logic
const variants: PayloadPerformanceEnvelopeVariant[] = [
  {
    name: 'WV011',
    weights: { mlw: 395000, mtow: 575000, mzfw: 369000 },
    chartLimits: {} as any,
    envelope: {} as any,
  },
  {
    name: 'WV003',
    weights: { mlw: 395000, mtow: 510000, mzfw: 373000 },
    chartLimits: {} as any,
    envelope: {} as any,
  },
];

describe('selectPerformanceEnvelopeVariant', () => {
  describe('Kilogram (kgs) unit matching', () => {
    it('returns the matching variant for WV011 with exact kg weights', () => {
      const selected = selectPerformanceEnvelopeVariant(variants, { mtow: 575000, mlw: 395000, mzfw: 369000 }, 'kgs');

      expect(selected?.name).toBe('WV011');
    });

    it('returns the matching variant for WV003 with exact kg weights', () => {
      const selected = selectPerformanceEnvelopeVariant(variants, { mtow: 510000, mlw: 395000, mzfw: 373000 }, 'kgs');

      expect(selected?.name).toBe('WV003');
    });

    it('returns undefined when kg weights do not match exactly (no tolerance applied in kgs)', () => {
      const selected = selectPerformanceEnvelopeVariant(variants, { mtow: 575004, mlw: 395000, mzfw: 369000 }, 'kgs');

      expect(selected).toBeUndefined();
    });

    it('returns undefined when given weights for an unsupported variant (WV000)', () => {
      const selected = selectPerformanceEnvelopeVariant(variants, { mtow: 560000, mlw: 386000, mzfw: 361000 }, 'kgs');

      expect(selected).toBeUndefined();
    });
  });

  describe('Pounds (lbs) unit matching & conversion tolerances', () => {
    it('matches official Airbus figures in lbs to WV003', () => {
      const selected = selectPerformanceEnvelopeVariant(variants, { mtow: 1124357, mlw: 870826, mzfw: 822324 }, 'lbs');

      expect(selected?.name).toBe('WV003');
    });

    it('matches SimBrief unit-converted figures in lbs (with rounding to nearest 10kg margin) to WV003', () => {
      const selected = selectPerformanceEnvelopeVariant(variants, { mtow: 1124356, mlw: 870825, mzfw: 822323 }, 'lbs');

      expect(selected?.name).toBe('WV003');
    });

    it('returns undefined when lbs weights fall outside the 10kg rounded conversion tolerance boundary', () => {
      // Off by enough pounds to shift the rounded kg result outside tolerance
      const selected = selectPerformanceEnvelopeVariant(variants, { mtow: 1125000, mlw: 870826, mzfw: 822324 }, 'lbs');

      expect(selected).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('returns undefined when weight properties are missing or incomplete', () => {
      const selected = selectPerformanceEnvelopeVariant(variants, { mtow: 575000, mlw: 395000 } as any, 'kgs');

      expect(selected).toBeUndefined();
    });

    it('returns undefined when variants array is empty', () => {
      const selected = selectPerformanceEnvelopeVariant([], { mtow: 575000, mlw: 395000, mzfw: 369000 }, 'kgs');

      expect(selected).toBeUndefined();
    });
  });
});
