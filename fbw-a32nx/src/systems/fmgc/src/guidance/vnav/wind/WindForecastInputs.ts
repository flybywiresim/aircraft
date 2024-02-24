// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { WindComponent, WindVector, WindVectorAtAltitude } from '@fmgc/guidance/vnav/wind';

export interface WindForecastInputs {
  tripWind: WindComponent;
  climbWinds: WindVectorAtAltitude[];
  cruiseWindsByWaypoint: Map<number, WindVectorAtAltitude[]>;
  descentWinds: WindVectorAtAltitude[];
  destinationWind: WindVector;
}
