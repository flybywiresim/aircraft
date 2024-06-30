// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export enum RmpState {
  OffFailed,
  OffStandby,
  On,
  OnFailed,
}

export interface RmpStateControllerEvents {
  rmp_state: RmpState;
}
