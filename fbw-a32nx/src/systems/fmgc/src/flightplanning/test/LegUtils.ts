// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Discontinuity, FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

export function assertDiscontinuity(element: FlightPlanElement) {
  expect(element?.isDiscontinuity ?? false).toBeTruthy();

  return element as Discontinuity;
}

export function assertNotDiscontinuity(element: FlightPlanElement) {
  expect(element?.isDiscontinuity ?? true).toBeFalsy();

  return element as FlightPlanLeg;
}
