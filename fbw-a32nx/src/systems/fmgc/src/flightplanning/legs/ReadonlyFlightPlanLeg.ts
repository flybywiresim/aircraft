// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AltitudeConstraint, Fix, LegType, SpeedConstraint, WaypointConstraintType } from '@flybywiresim/fbw-sdk';

import { FlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { HoldData } from '@fmgc/flightplanning/data/flightplan';
import { CruiseStepEntry } from '@fmgc/flightplanning/CruiseStep';
import { LegCalculations } from './FlightPlanLeg';

export interface ReadonlyFlightPlanLeg {
  readonly uuid: string;

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

  readonly altitudeConstraint: AltitudeConstraint | undefined;

  readonly speedConstraint: SpeedConstraint | undefined;

  isXF(): boolean;

  isHX(): boolean;

  isVectors(): boolean;

  readonly cruiseStep: CruiseStepEntry | undefined;

  readonly pilotEnteredAltitudeConstraint: AltitudeConstraint | undefined;

  readonly pilotEnteredSpeedConstraint: SpeedConstraint | undefined;

  readonly calculated: LegCalculations | undefined;

  terminationWaypoint(): Fix | null;

  isRunway(): boolean;
}

export interface ReadonlyDiscontinuity {
  readonly isDiscontinuity: true;
}

export type ReadonlyFlightPlanElement = ReadonlyFlightPlanLeg | ReadonlyDiscontinuity;
