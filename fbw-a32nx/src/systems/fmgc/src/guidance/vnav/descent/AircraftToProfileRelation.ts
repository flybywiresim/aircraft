// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  NavGeometryProfile,
  VerticalCheckpoint,
  VerticalCheckpointReason,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { MathUtils } from '@flybywiresim/fbw-sdk';

export class AircraftToDescentProfileRelation {
  public isValid: boolean = false;

  public currentProfile?: NavGeometryProfile;

  private topOfDescent?: VerticalCheckpoint;

  private geometricPathStart?: VerticalCheckpoint;

  private distanceToEnd: NauticalMiles = 0;

  public totalFlightPlanDistance: number = 0;

  get distanceFromStart(): NauticalMiles {
    return this.totalFlightPlanDistance - this.distanceToEnd;
  }

  constructor(private observer: VerticalProfileComputationParametersObserver) {}

  reset() {
    this.isValid = false;
    this.currentProfile = undefined;
    this.topOfDescent = undefined;
    this.geometricPathStart = undefined;
    this.distanceToEnd = 0;
    this.totalFlightPlanDistance = 0;
  }

  updateProfile(profile: NavGeometryProfile) {
    const topOfDescent = profile?.findVerticalCheckpoint(VerticalCheckpointReason.TopOfDescent);
    const geometricPathStart = profile?.findVerticalCheckpoint(VerticalCheckpointReason.GeometricPathStart);

    const isProfileValid = !!topOfDescent && !!geometricPathStart;

    if (!isProfileValid) {
      this.invalidate();

      // If the profile is empty, we don't bother logging that it's invalid, because it probably just hasn't been computed yet.
      if (VnavConfig.DEBUG_PROFILE && profile.checkpoints.length >= 0) {
        console.warn('[FMS/VNAV] Invalid profile');
      }

      return;
    }

    this.isValid = isProfileValid;

    this.topOfDescent = topOfDescent;
    this.geometricPathStart = geometricPathStart;

    this.currentProfile = profile;
    this.totalFlightPlanDistance = profile.totalFlightPlanDistance;

    this.distanceToEnd = profile.totalFlightPlanDistance - profile.distanceToPresentPosition;
  }

  private invalidate() {
    this.isValid = false;
    this.currentProfile = undefined;
    this.topOfDescent = undefined;
  }

  update(distanceToEnd: number) {
    if (!this.isValid) {
      return;
    }

    if (!Number.isFinite(distanceToEnd)) {
      this.invalidate();
      return;
    }

    this.distanceToEnd = distanceToEnd;
  }

  isPastTopOfDescent(): boolean {
    return this.distanceToTopOfDescent() < 0;
  }

  distanceToTopOfDescent(): number | null {
    if (this.topOfDescent) {
      return this.topOfDescent.distanceFromStart - this.distanceFromStart;
    }

    return null;
  }

  isOnGeometricPath(): boolean {
    return this.distanceFromStart > this.geometricPathStart.distanceFromStart;
  }

  computeLinearDeviation(): Feet {
    const altitude = this.observer.get().presentPosition.alt;
    const targetAltitude = this.currentTargetAltitude();

    return altitude - targetAltitude;
  }

  currentTargetAltitude(): Feet {
    return this.currentProfile.interpolateAltitudeAtDistance(this.distanceFromStart);
  }

  currentTargetPathAngle(): Degrees {
    return this.currentProfile.interpolatePathAngleAtDistance(this.distanceFromStart);
  }

  currentTargetVerticalSpeed(): FeetPerMinute {
    const groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'Knots');

    const knotsToFeetPerMinute = 101.269;
    return knotsToFeetPerMinute * groundSpeed * Math.tan(this.currentTargetPathAngle() * MathUtils.DEGREES_TO_RADIANS);
  }

  isAboveSpeedLimitAltitude(): boolean {
    const { presentPosition, descentSpeedLimit } = this.observer.get();

    return presentPosition.alt > descentSpeedLimit?.underAltitude;
  }

  isCloseToAirfieldElevation(): boolean {
    const { destinationElevation, presentPosition } = this.observer.get();

    return presentPosition.alt < destinationElevation + 5000;
  }

  get currentDistanceToEnd(): NauticalMiles {
    return this.distanceToEnd;
  }
}
