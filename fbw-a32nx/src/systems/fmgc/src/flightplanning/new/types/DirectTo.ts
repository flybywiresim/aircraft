// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Waypoint } from '@flybywiresim/fbw-sdk';

interface FlightPlanDirectTo {
  flightPlanLegIndex?: number;
  nonFlightPlanWaypoint?: Waypoint;
}

type CourseInFlightPlanDirectTo = FlightPlanDirectTo & {
  courseIn: DegreesTrue;
};

type CourseOutFlightPlanDirectTo = FlightPlanDirectTo & {
  courseOut: DegreesTrue;
};

type WithAbeamFlightPlanDirectTo = FlightPlanDirectTo & {
  withAbeam: true;
};

export type DirectTo =
  | FlightPlanDirectTo
  | CourseInFlightPlanDirectTo
  | CourseOutFlightPlanDirectTo
  | WithAbeamFlightPlanDirectTo;
