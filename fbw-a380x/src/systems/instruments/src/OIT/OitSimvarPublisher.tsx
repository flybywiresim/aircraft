//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export type OitSimvars = {
  coldDark: number;
  elec: boolean;
  elecFo: boolean;
  potentiometerCaptain: number;
  potentiometerFo: number;
};

export enum OitVars {
  coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
  elec = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
  elecFo = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
  potentiometerCaptain = 'LIGHT POTENTIOMETER:81', // FIXME poti
  potentiometerFo = 'LIGHT POTENTIOMETER:82', // FIXME poti
}

/** A publisher to poll and publish nav/com simvars. */
export class OitSimvarPublisher extends SimVarPublisher<OitSimvars> {
  private static simvars = new Map<keyof OitSimvars, SimVarDefinition>([
    ['elec', { name: OitVars.elec, type: SimVarValueType.Bool }],
    ['elecFo', { name: OitVars.elecFo, type: SimVarValueType.Bool }],
    ['potentiometerCaptain', { name: OitVars.potentiometerCaptain, type: SimVarValueType.Number }],
    ['potentiometerFo', { name: OitVars.potentiometerFo, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: EventBus) {
    super(OitSimvarPublisher.simvars, bus);
  }
}
