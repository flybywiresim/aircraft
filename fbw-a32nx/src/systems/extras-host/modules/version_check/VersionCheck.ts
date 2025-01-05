// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { AircraftGithubVersionChecker } from '@fbw-common/shared/AircraftGithubVersionChecker';

/**
 * This class is used to check the version of the aircraft and display a warning if it is too old.
 */
export class VersionCheck {
  constructor(
    private readonly aircraftProjectPrefix: string,
    private readonly bus: EventBus,
  ) {
    console.log('VersionCheck: Created');
  }

  public connectedCallback(): void {
    // empty
  }

  public startPublish(): void {
    console.log('VersionCheck: startPublish()');
    AircraftGithubVersionChecker.checkVersion(this.aircraftProjectPrefix);
  }

  public update(): void {
    // empty
  }
}
