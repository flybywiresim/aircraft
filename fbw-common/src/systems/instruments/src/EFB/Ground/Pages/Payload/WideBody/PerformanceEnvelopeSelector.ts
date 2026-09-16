// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import type { PayloadPerformanceEnvelopeVariant } from '@flybywiresim/fbw-sdk-react';

export interface SimbriefStructuralWeights {
  mlw: number;
  mtow: number;
  mzfw: number;
}

const POUNDS_PER_KILOGRAM = 2.20462;

const normalizeWeightToKilograms = (weight: number, units: string): number | undefined => {
  if (!Number.isFinite(weight) || weight <= 0) {
    return undefined;
  }

  switch (units.toLowerCase()) {
    case 'kgs':
      return weight;
    case 'lbs':
      return Math.round(weight / POUNDS_PER_KILOGRAM);
    default:
      return undefined;
  }
};

/**
 * Find the A380 weight variant that corresponds to simbrief ofp weight limits
 *
 * @param variants Array of performance envelopes to parse.
 * @param simbriefWeights Weights from simbrief OFP to find WV
 * @param simbriefUnits Units used in Simbrief OFP
 * @return Peformance envelope of variant matching Simbrief weights. Returns undefined if no match found.
 */
export const selectPerformanceEnvelopeVariant = (
  variants: PayloadPerformanceEnvelopeVariant[] | undefined,
  simbriefWeights: SimbriefStructuralWeights | undefined,
  simbriefUnits: string,
): PayloadPerformanceEnvelopeVariant | undefined => {
  if (!variants?.length || !simbriefWeights) {
    return undefined;
  }

  const mlw = normalizeWeightToKilograms(simbriefWeights.mlw, simbriefUnits);
  const mtow = normalizeWeightToKilograms(simbriefWeights.mtow, simbriefUnits);
  const mzfw = normalizeWeightToKilograms(simbriefWeights.mzfw, simbriefUnits);
  const matchingVariant = variants.find(
    (variant) => variant.weights.mlw === mlw && variant.weights.mtow === mtow && variant.weights.mzfw === mzfw,
  );

  if (mlw === undefined || mtow === undefined || mzfw === undefined) {
    return undefined;
  }

  return matchingVariant;
};
