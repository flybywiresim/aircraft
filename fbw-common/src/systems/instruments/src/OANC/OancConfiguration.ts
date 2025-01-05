// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export interface OancConfiguration {
  /** Whether the Software Control Panel is enabled */
  enableScp: boolean;

  /** Whether Brake-To-Vacate functionality is available */
  enableBtv: boolean;

  /** The URL to the map configuration JSON file to use */
  mapConfigurationUrl: string;
}
