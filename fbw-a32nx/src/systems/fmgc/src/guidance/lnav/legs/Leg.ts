// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Guidable } from '@fmgc/guidance/Guidable';
import { distanceTo } from 'msfs-geo';
import { Fix } from '@flybywiresim/fbw-sdk';
import { LegMetadata } from '@fmgc/guidance/lnav/legs/index';
import { LegCalculations } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';

export abstract class Leg extends Guidable {
  // @ts-expect-error TS2564 -- TODO fix this manually (strict mode migration)
  segment: SegmentType;

  abstract metadata: Readonly<LegMetadata>;

  get constrainedTurnDirection() {
    return this.metadata.turnDirection;
  }

  abstract get inboundCourse(): Degrees | undefined;

  abstract get outboundCourse(): Degrees | undefined;

  abstract get terminationWaypoint(): Fix | Coordinates | undefined;

  isNull = false;

  displayedOnMap = true;

  // @ts-expect-error TS2564 -- TODO fix this manually (strict mode migration)
  predictedTas: Knots;

  // @ts-expect-error TS2564 -- TODO fix this manually (strict mode migration)
  predictedGs: Knots;

  calculated?: LegCalculations;

  get disableAutomaticSequencing(): boolean {
    return false;
  }

  /** @inheritDoc */
  recomputeWithParameters(
    _isActive: boolean,
    _tas: Knots,
    _gs: Knots,
    _ppos: Coordinates,
    _trueTrack: DegreesTrue,
  ): void {
    // Default impl.
  }

  get distance(): NauticalMiles {
    try {
      // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
      return distanceTo(this.getPathStartPoint(), this.getPathEndPoint());
    } catch {
      return 0;
    }
  }

  abstract get distanceToTermination(): NauticalMiles;

  get overflyTermFix(): boolean {
    return false;
  }

  get initialLegTermPoint(): Coordinates {
    // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
    return this.getPathEndPoint();
  }
}
