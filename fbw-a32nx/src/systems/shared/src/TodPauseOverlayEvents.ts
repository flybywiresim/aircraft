// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export interface TodPauseOverlayState {
  visible: boolean;
  title: string;
  message: string;
}

/** Controls visibility and content of the EFB pause-at-TOD overlay. */
export interface TodPauseOverlayControlEvents {
  tod_pause_overlay: TodPauseOverlayState;
}
