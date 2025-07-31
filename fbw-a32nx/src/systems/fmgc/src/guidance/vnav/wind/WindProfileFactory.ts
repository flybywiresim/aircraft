// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Fmgc } from '@fmgc/guidance/GuidanceController';
import { ClimbWindProfile } from '@fmgc/guidance/vnav/wind/ClimbWindProfile';
import { CruiseWindProfile } from '@fmgc/guidance/vnav/wind/CruiseWindProfile';
import { DescentWindProfile } from '@fmgc/guidance/vnav/wind/DescentWindProfile';
import { WindForecastInputObserver } from '@fmgc/guidance/vnav/wind/WindForecastInputObserver';
import { WindObserver } from '@fmgc/guidance/vnav/wind/WindObserver';

export class WindProfileFactory {
  private windObserver: WindObserver;

  private windInputObserver: WindForecastInputObserver;

  private aircraftDistanceFromStart: NauticalMiles;

  constructor(fmgc: Fmgc, fmgcSide: number) {
    this.windObserver = new WindObserver(fmgcSide);
    this.windInputObserver = new WindForecastInputObserver(fmgc);
  }

  updateFmgcInputs() {
    this.windInputObserver.update();
  }

  updateAircraftDistanceFromStart(distanceFromStart: NauticalMiles) {
    this.aircraftDistanceFromStart = distanceFromStart;
  }

  getClimbWinds(): ClimbWindProfile {
    return new ClimbWindProfile(this.windInputObserver.get(), this.windObserver, this.aircraftDistanceFromStart);
  }

  getCruiseWinds(): CruiseWindProfile {
    return new CruiseWindProfile(this.windInputObserver.get(), this.windObserver, this.aircraftDistanceFromStart);
  }

  getDescentWinds(): DescentWindProfile {
    return new DescentWindProfile(this.windInputObserver.get(), this.windObserver, this.aircraftDistanceFromStart);
  }
}
