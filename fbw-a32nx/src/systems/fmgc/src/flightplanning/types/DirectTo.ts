// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Fix } from '@flybywiresim/fbw-sdk';

export enum DirectToType {
  Normal,
  Abeams,
  RadialIn,
  RadialOut,
}

type FlightPlanDirectTo = {
  flightPlanLegIndex: number;
  readonly isToFlightPlanFix: true;
};

type NonFlightPlanDirectTo = {
  nonFlightPlanFix: Fix;
  readonly isToFlightPlanFix: false;
};

export type DirectTo = (FlightPlanDirectTo | NonFlightPlanDirectTo) &
  (
    | { type: DirectToType.Normal | DirectToType.Abeams }
    | { type: DirectToType.RadialIn; courseIn: number; isPilotEntered: boolean }
    | { type: DirectToType.RadialOut; courseOut: number }
  );

export class DirectToBuilder {
  protected constructor(protected directToObject: DirectTo) {}

  public static toFlightPlanFix(atIndex: number) {
    return new this({
      type: DirectToType.Normal,
      isToFlightPlanFix: true,
      flightPlanLegIndex: atIndex,
    });
  }

  public static toNonFlightPlanFix(fix: Fix) {
    return new this({
      type: DirectToType.Normal,
      isToFlightPlanFix: false,
      nonFlightPlanFix: fix,
    });
  }

  public get type() {
    return this.directToObject.type;
  }

  public normal() {
    this.directToObject.type = DirectToType.Normal;

    return this;
  }

  public withAbeams() {
    this.directToObject.type = DirectToType.Abeams;

    return this;
  }

  public radialIn(courseIn: number, isPilotEntered: boolean) {
    this.directToObject = {
      ...this.directToObject,
      type: DirectToType.RadialIn,
      courseIn,
      isPilotEntered,
    };

    return this;
  }

  public radialOut(course: number) {
    this.directToObject = {
      ...this.directToObject,
      type: DirectToType.RadialOut,
      courseOut: course,
    };

    return this;
  }

  public get() {
    return this.directToObject;
  }
}
