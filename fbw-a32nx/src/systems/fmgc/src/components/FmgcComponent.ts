// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanManager } from '@fmgc/wtsdk';

export interface FmgcComponent {
  init(baseInstrument: BaseInstrument, flightPlanManager: FlightPlanManager): void;
  update(deltaTime: number): void;
}
