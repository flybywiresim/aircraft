// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { Navigation } from '@fmgc/navigation/Navigation';

export interface FmgcComponent {
  init(navigation: Navigation, guidanceController: GuidanceController, flightPlanService: FlightPlanService): void;
  update(deltaTime: number): void;
}
