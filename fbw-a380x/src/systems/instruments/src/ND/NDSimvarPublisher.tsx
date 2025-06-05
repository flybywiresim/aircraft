// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import {
  AdirsSimVarDefinitions,
  AdirsSimVars,
  SwitchingPanelSimVarsDefinitions,
  SwitchingPanelVSimVars,
} from '../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export type NDSimvars = AdirsSimVars &
  SwitchingPanelVSimVars & {
    elec: boolean;
    elecFo: boolean;
    potentiometerCaptain: number;
    potentiometerFo: number;
    ilsCourse: number;
    selectedHeading: Degrees;
    showSelectedHeading: boolean;
    absoluteTime: Seconds;
    kccuOnL: boolean;
    kccuOnR: boolean;
  };

export enum NDVars {
  elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
  elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
  potentiometerCaptain = 'LIGHT POTENTIOMETER:89',
  potentiometerFo = 'LIGHT POTENTIOMETER:91',
  ilsCourse = 'L:A32NX_FM_LS_COURSE',
  selectedHeading = 'L:A32NX_FCU_HEADING_SELECTED',
  showSelectedHeading = 'L:A320_FCU_SHOW_SELECTED_HEADING',
  absoluteTime = 'E:ABSOLUTE TIME',
  kccuOnL = 'L:A32NX_KCCU_L_KBD_ON_OFF',
  kccuOnR = 'L:A32NX_KCCU_R_KBD_ON_OFF',
}

/** A publisher to poll and publish nav/com simvars. */
export class NDSimvarPublisher extends UpdatableSimVarPublisher<NDSimvars> {
  private static simvars = new Map<keyof NDSimvars, SimVarDefinition>([
    ...AdirsSimVarDefinitions,
    ...SwitchingPanelSimVarsDefinitions,
    ['elec', { name: NDVars.elec, type: SimVarValueType.Bool }],
    ['elecFo', { name: NDVars.elecFo, type: SimVarValueType.Bool }],
    ['potentiometerCaptain', { name: NDVars.potentiometerCaptain, type: SimVarValueType.Number }],
    ['potentiometerFo', { name: NDVars.potentiometerFo, type: SimVarValueType.Number }],
    ['ilsCourse', { name: NDVars.ilsCourse, type: SimVarValueType.Number }],
    ['selectedHeading', { name: NDVars.selectedHeading, type: SimVarValueType.Degree }],
    ['showSelectedHeading', { name: NDVars.showSelectedHeading, type: SimVarValueType.Bool }],
    ['absoluteTime', { name: NDVars.absoluteTime, type: SimVarValueType.Seconds }],
    ['kccuOnL', { name: NDVars.kccuOnL, type: SimVarValueType.Bool }],
    ['kccuOnR', { name: NDVars.kccuOnR, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(NDSimvarPublisher.simvars, bus);
  }
}
