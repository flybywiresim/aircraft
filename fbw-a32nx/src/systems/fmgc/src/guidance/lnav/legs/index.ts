// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { PILeg } from '@fmgc/guidance/lnav/legs/PI';
import { AltitudeConstraint, SpeedConstraint, TurnDirection } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/legs/FlightPlanLegDefinition';
import { MissedApproachSegment } from '@fmgc/flightplanning/segments/MissedApproachSegment';

export type PathAngleConstraint = Degrees;

export function isHold(leg: Leg): boolean {
  return leg instanceof HALeg || leg instanceof HFLeg || leg instanceof HMLeg;
}

export function isCourseReversalLeg(leg: Leg): boolean {
  return isHold(leg) || leg instanceof PILeg;
}

/**
 * Geometry and vertical constraints applicable to a leg
 */
export interface LegMetadata {
  /**
   * Definition of the originating flight plan leg
   */
  flightPlanLegDefinition: FlightPlanLegDefinition;

  /**
   * Turn direction constraint applicable to this leg
   */
  turnDirection: TurnDirection;

  /**
   * Altitude constraint applicable to this leg
   */
  altitudeConstraint?: AltitudeConstraint;

  /**
   * Speed constraint applicable to this leg
   */
  speedConstraint?: SpeedConstraint;

  /**
   * Path angle constraint applicable to this leg
   */
  pathAngleConstraint?: PathAngleConstraint;

  /**
   * UTC seconds required time of arrival applicable to the leg
   */
  rtaUtcSeconds?: Seconds;

  /**
   * Whether the termination of this leg must be overflown. The termination can be overflown even if this is `false` due to geometric constraints
   */
  isOverfly?: boolean;

  /**
   * Whether the leg is in the missed approach segment
   */
  isInMissedApproach?: boolean;

  /**
   * Lateral offset applicable to this leg. -ve if left offset, +ve if right offset.
   *
   * This also applies if this is the first or last leg considered "offset" in the FMS, even if the transition onto the offset path skips the leg.
   */
  offset?: NauticalMiles;
}

export function legMetadataFromFlightPlanLeg(leg: FlightPlanLeg): LegMetadata {
  const altitudeConstraint = leg.altitudeConstraint;
  const speedConstraint = leg.speedConstraint;
  const pathAngleConstraint = leg.definition?.verticalAngle;

  let turnDirection = TurnDirection.Either;
  if (leg.definition.turnDirection === 'L') {
    turnDirection = TurnDirection.Left;
  } else if (leg.definition.turnDirection === 'R') {
    turnDirection = TurnDirection.Right;
  }

  return {
    flightPlanLegDefinition: leg.definition,
    turnDirection,
    altitudeConstraint,
    speedConstraint,
    pathAngleConstraint,
    isOverfly: leg.definition.overfly,
    isInMissedApproach: leg.segment instanceof MissedApproachSegment,
  };
}
