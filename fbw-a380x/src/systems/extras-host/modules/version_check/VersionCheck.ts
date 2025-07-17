// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AircraftGithubVersionChecker } from '@flybywiresim/fbw-sdk';
import { EventBus } from '@microsoft/msfs-sdk';

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
    AircraftGithubVersionChecker.setEditionLocalVar(this.aircraftProjectPrefix);
  }

  public startPublish(): void {
    console.log('VersionCheck: startPublish()');

    // TODO: Implement version check which is dependent on the API to change and handling
    //  of github version for the monorepo needs to be changed.
    console.warn('VersionCheck for the A380X is not yet implemented.');
  }
}
