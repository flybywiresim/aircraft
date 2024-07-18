// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';

export interface FmgcComponent {
  init(baseInstrument: BaseInstrument, flightPlanService: FlightPlanService): void;
  update(deltaTime: number): void;
}
