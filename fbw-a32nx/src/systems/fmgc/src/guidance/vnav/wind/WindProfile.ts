// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { WindComponent } from '@fmgc/guidance/vnav/wind';

export interface WindProfile {
  getHeadwindComponent(distanceFromStart: NauticalMiles, altitude: Feet, planeHeading: DegreesTrue): WindComponent;
}
