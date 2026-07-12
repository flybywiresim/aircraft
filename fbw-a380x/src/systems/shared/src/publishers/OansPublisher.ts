// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { SimVarPublisher, SimVarDefinition, SimVarValueType, EventBus } from '@microsoft/msfs-sdk';

interface OansBaseEvents {
  /** Indicates whether the OANS system has failed */
  oans_failed: boolean;
}

/**
 * Events for the OANS system simvars.
 */
export interface OansBusEvents extends OansBaseEvents {}

/**
 * Publisher for the OANS simvars
 */
export class OansSimVarPublisher extends SimVarPublisher<OansBusEvents> {
  private static simvars = new Map<keyof OansBusEvents, SimVarDefinition>([
    ['oans_failed', { name: 'L:A380X_OANS_FAILED', type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(OansSimVarPublisher.simvars, bus);
  }
}
