// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

/**
 * Digitized, rounded points from Airbus AC A380 (Dec 01/25), figures
 * 3-3-1-991-001-A01 and 3-3-2-991-001-A01, Trent 900 engines.
 * These airport-planning curves are informational and do not specify
 * configuration, bleed, wind, slope or runway-condition corrections.
 * Rows are runway length in metres, then TOW in tonnes at 0/2/4/6/8 kft.
 */
const isa: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [1_750, 447, 428, 407, 386, 366],
  [2_000, 482, 458, 436, 413, 392],
  [2_500, 534, 510, 486, 462, 438],
  [3_000, 576, 553, 527, 502, 476],
  [3_500, 600, 574, 548, 523, 498],
  [4_000, 618, 593, 567, 543, 517],
  [4_500, 628, 604, 579, 554, 529],
  [5_000, 636, 610, 586, 562, 536],
];

const isaPlus15: typeof isa = [
  [1_750, 433, 418, 399, 378, 359],
  [2_000, 472, 449, 428, 406, 384],
  [2_500, 524, 501, 476, 452, 429],
  [3_000, 568, 542, 517, 492, 467],
  [3_500, 591, 567, 543, 518, 494],
  [4_000, 613, 587, 563, 537, 512],
  [4_500, 623, 598, 575, 550, 524],
  [5_000, 632, 607, 581, 557, 532],
];

const lerp = (a: number, b: number, fraction: number): number => a + (b - a) * fraction;

function chartWeight(
  rows: ReadonlyArray<readonly [number, number, number, number, number, number]>,
  runwayLength: number,
  pressureAlt: number,
): number {
  const length = Math.max(rows[0][0], Math.min(rows[rows.length - 1][0], runwayLength));
  const altitude = Math.max(0, Math.min(8_000, pressureAlt));
  const altitudeIndex = Math.min(3, Math.floor(altitude / 2_000));
  const altitudeFraction = (altitude - altitudeIndex * 2_000) / 2_000;
  let upper = rows.findIndex((row) => row[0] >= length);
  if (upper < 0) upper = rows.length - 1;
  const lower = Math.max(0, upper - 1);
  const lengthFraction = upper === lower ? 0 : (length - rows[lower][0]) / (rows[upper][0] - rows[lower][0]);
  const lowerWeight = lerp(rows[lower][altitudeIndex + 1], rows[lower][altitudeIndex + 2], altitudeFraction);
  const upperWeight = lerp(rows[upper][altitudeIndex + 1], rows[upper][altitudeIndex + 2], altitudeFraction);
  return lerp(lowerWeight, upperWeight, lengthFraction);
}

/** Informational dry-runway Trent 900 limit, in kg, for 1,750-5,000 m and 0-8,000 ft. */
export function getA380RunwayChartLimit(runwayLength: number, pressureAlt: number, oat: number): number | undefined {
  if (runwayLength < 1_750 || pressureAlt > 8_000) return undefined;
  const isaTemp = 15 - pressureAlt * 0.0019812;
  const isaWeight = chartWeight(isa, runwayLength, pressureAlt);
  const hotWeight = chartWeight(isaPlus15, runwayLength, pressureAlt);
  const temperatureFraction = Math.max(0, Math.min(1, (oat - isaTemp) / 15));
  return lerp(isaWeight, hotWeight, temperatureFraction) * 1_000;
}
