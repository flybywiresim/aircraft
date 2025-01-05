// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import {
  DescentAltitudeConstraint,
  GeographicCruiseStep,
  MaxAltitudeConstraint,
  MaxSpeedConstraint,
  VerticalCheckpoint,
  VerticalCheckpointReason,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';

export class SelectedGeometryProfile extends BaseGeometryProfile {
  public override maxAltitudeConstraints: MaxAltitudeConstraint[] = [];

  public override descentAltitudeConstraints: DescentAltitudeConstraint[] = [];

  public override maxClimbSpeedConstraints: MaxSpeedConstraint[] = [];

  public override descentSpeedConstraints: MaxSpeedConstraint[] = [];

  public override cruiseSteps: GeographicCruiseStep[] = [];

  public override distanceToPresentPosition: number = 0;

  private checkpointsToShowAlongFlightPlan: Set<VerticalCheckpointReason> = new Set([
    VerticalCheckpointReason.CrossingFcuAltitudeClimb,
    VerticalCheckpointReason.CrossingFcuAltitudeDescent,
    VerticalCheckpointReason.CrossingClimbSpeedLimit,
  ]);

  getCheckpointsToShowOnTrackLine(): VerticalCheckpoint[] {
    return this.checkpoints.filter((checkpoint) => this.checkpointsToShowAlongFlightPlan.has(checkpoint.reason));
  }

  override resetAltitudeConstraints(): void {
    this.maxAltitudeConstraints = [];
    this.descentAltitudeConstraints = [];
  }

  override resetSpeedConstraints() {
    this.maxClimbSpeedConstraints = [];
    this.descentSpeedConstraints = [];
  }
}
