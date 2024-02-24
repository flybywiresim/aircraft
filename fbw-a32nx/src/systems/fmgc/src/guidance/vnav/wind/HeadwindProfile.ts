// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { WindComponent } from '@fmgc/guidance/vnav/wind';
import { AircraftHeadingProfile } from '@fmgc/guidance/vnav/wind/AircraftHeadingProfile';
import { WindProfile } from '@fmgc/guidance/vnav/wind/WindProfile';

export class HeadwindProfile {
  constructor(
    private windProfile: WindProfile,
    private headingProfile: AircraftHeadingProfile,
  ) {}

  /**
   * Returns the predicted headwind component at a given distanceFromStart and altitude
   * @param distanceFromStart
   * @param altitude
   * @returns
   */
  getHeadwindComponent(distanceFromStart: NauticalMiles, altitude: Feet): WindComponent {
    const heading = this.headingProfile.get(distanceFromStart);
    if (heading === null) {
      return WindComponent.zero();
    }

    return this.windProfile.getHeadwindComponent(distanceFromStart, altitude, heading);
  }
}
