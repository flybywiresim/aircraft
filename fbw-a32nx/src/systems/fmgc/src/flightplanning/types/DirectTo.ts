// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Fix } from '@flybywiresim/fbw-sdk';

interface FlightPlanDirectTo {
  flightPlanLegIndex?: number;
  nonFlightPlanFix?: Fix;
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

export function isDirectWithAbeam(directTo: DirectTo): directTo is WithAbeamFlightPlanDirectTo {
  return 'withAbeam' in directTo && directTo.withAbeam;
}

export function isDirectWithCourseIn(directTo: DirectTo): directTo is CourseInFlightPlanDirectTo {
  return 'courseIn' in directTo && Number.isFinite(directTo.courseIn);
}

export function isDirectWithCourseOut(directTo: DirectTo): directTo is CourseOutFlightPlanDirectTo {
  return 'courseOut' in directTo && Number.isFinite(directTo.courseOut);
}
