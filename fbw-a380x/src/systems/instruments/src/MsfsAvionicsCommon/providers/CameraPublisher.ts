// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export interface CameraEvents {
  camera_pilot_in_fo_seat: boolean;
}

export class CameraPublisher extends SimVarPublisher<CameraEvents> {
  constructor(bus: EventBus, pacer?: PublishPacer<CameraEvents>) {
    super(
      new Map([['camera_pilot_in_fo_seat', { name: 'L:A380X_PILOT_IN_FO_SEAT', type: SimVarValueType.Bool }]]),
      bus,
      pacer,
    );
  }
}
