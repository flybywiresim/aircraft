// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { LandingFlapsConfig } from '@flybywiresim/fbw-sdk';

/** User-supplied A380 VAPP schedule for CONF 3 and FULL, at 300-386 tonnes. */
const upperWeightBounds = [
  304_999, 309_999, 314_999, 319_999, 324_999, 329_999, 334_999, 339_999, 344_999, 349_999, 354_999, 359_999, 364_999,
  369_999, 374_999, 380_999, 386_999,
];
const conf3Vapp = [136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 150, 151, 152, 153];
const fullVapp = [129, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146];

export function getA380TableVapp(weight: number, flaps: LandingFlapsConfig): number {
  const index = upperWeightBounds.findIndex((upper) => weight <= upper);
  const row = index < 0 ? upperWeightBounds.length - 1 : index;
  return (flaps === LandingFlapsConfig.Full ? fullVapp : conf3Vapp)[row];
}
