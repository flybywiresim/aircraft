// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport } from './Airport';
import { General } from './General';
import { Navlog } from './Navlog';

export interface CoRouteDto {
  name: String;

  origin: Airport;

  alternate: Airport;

  destination: Airport;

  general: General;

  navlog: Navlog;
}
