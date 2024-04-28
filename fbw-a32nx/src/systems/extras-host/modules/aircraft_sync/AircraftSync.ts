// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { UniversalConfigProvider } from '@flybywiresim/fbw-sdk';
import { EventBus } from '@microsoft/msfs-sdk';

/**
 * This class is used to check the airframe of the aircraft and set the LVar
 */
export class AircraftSync {
  public xmlConfig: Document;

  constructor(
    private readonly aircraftProjectPrefix: string,
    private readonly bus: EventBus,
  ) {
    console.log('AircraftSync: Created');
  }

  public connectedCallback(): void {
    // empty
  }

  public parseXMLConfig(xmlConfig: Document): void {
    this.xmlConfig = xmlConfig;
  }

  // TODO: Replace with new function for commbus implementation to sync VFS markup config to WASM
  public startPublish(): void {
    console.log('AicraftSync: startPublish()');

    UniversalConfigProvider.initialize(process.env.AIRCRAFT_PROJECT_PREFIX, process.env.AIRCRAFT_VARIANT);

    // TODO: Future WASM commbus subscriber goes here
  }

  public update(): void {
    // empty
  }
}
