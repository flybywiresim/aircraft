// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { LegType } from '@flybywiresim/fbw-sdk';
import { FlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { HoldData, OffsetData } from '@fmgc/flightplanning/data/flightplan';
import { WaypointConstraintType, AltitudeConstraint, SpeedConstraint } from '@fmgc/flightplanning/data/constraint';
import { CruiseStepEntry } from '@fmgc/flightplanning/CruiseStep';

export interface ReadonlyFlightPlanLeg {
  readonly isDiscontinuity: false;

  readonly type: LegType;

  readonly flags: number;

  readonly segment: FlightPlanSegment;

  readonly definition: Readonly<FlightPlanLegDefinition>;

  readonly ident: string;

  readonly annotation: string;

  readonly rnp: number | undefined; // TODO maybe redundant

  readonly defaultHold: HoldData | undefined;

  readonly modifiedHold: HoldData | undefined;

  readonly holdImmExit: boolean;

  readonly constraintType: WaypointConstraintType;

  readonly cruiseStep: CruiseStepEntry | undefined;

  readonly pilotEnteredAltitudeConstraint: AltitudeConstraint | undefined;

  readonly pilotEnteredSpeedConstraint: SpeedConstraint | undefined;

  readonly lateralOffset: OffsetData | undefined;
}

export interface ReadonlyDiscontinuity {
  readonly isDiscontinuity: true;
}

export type ReadonlyFlightPlanElement = ReadonlyFlightPlanLeg | ReadonlyDiscontinuity;
