// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export interface OansControlEvents {
  ndShowOans: boolean;
  ndSetContextMenu: { x: number; y: number };
  oansDisplayAirport: string;
  oansZoomIn: number;
  oansZoomOut: number;
  oansNotAvail: boolean;
}
