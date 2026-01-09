// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import {
  DescentAltitudeConstraint,
  GeographicCruiseStep,
  MaxAltitudeConstraint,
  MaxSpeedConstraint,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { ConstantWindProfile, WindInterface } from '../wind/WindProfile';
import { FlightPlan } from '../../../flightplanning/plans/FlightPlan';
import { EventBus } from '@microsoft/msfs-sdk';

export class SelectedGeometryProfile extends BaseGeometryProfile {
  public override maxAltitudeConstraints: MaxAltitudeConstraint[] = [];

  public override descentAltitudeConstraints: DescentAltitudeConstraint[] = [];

  public override maxClimbSpeedConstraints: MaxSpeedConstraint[] = [];

  public override descentSpeedConstraints: MaxSpeedConstraint[] = [];

  public override cruiseSteps: GeographicCruiseStep[] = [];

  public override distanceToPresentPosition: number = 0;

  public override readonly winds: WindInterface = new ConstantWindProfile(this.bus, this.plan);

  constructor(
    private readonly bus: EventBus,
    private readonly plan: FlightPlan,
  ) {
    super();
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
