// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export enum PopupUuid {
  MsfsVersion = 'msfs-version',
  /** Special popup with the pause/unpause functions. */
  TodPause = 'tod-pause',
  VersionOutdated = 'version-outdated',
}

export interface PopupDefinition {
  uuid: PopupUuid | string;
  title: string;
  message: string;
  /** The time the popup should display for in ms. */
  timeout?: number;
}
