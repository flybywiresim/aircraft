// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, IndexedEventType, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';
import {
  AdirsSimVarDefinitions,
  AdirsSimVars,
  SwitchingPanelSimVarsDefinitions,
  SwitchingPanelVSimVars,
} from '../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../MsfsAvionicsCommon/UpdatableSimVarPublisher';

// FIXME ideally migrate to singular publishers (split by source)
export type BaseSDSimvars = AdirsSimVars &
  SwitchingPanelVSimVars & {
    sdPageToShow: number;
    zuluTime: number;
    grossWeight: number;
    greenHydraulicPressureSwitchPressurized: boolean;
    yellowHydraulicPressureSwitchPressurized: boolean;
    blueHydraulicPressureSwitchPressurized: boolean;
    rudderDeflection: number;
  };

type SDIndexedEvents = {
  [P in keyof BaseSDSimvars as IndexedEventType<P>]: BaseSDSimvars[P];
};

export interface SDSimvars extends BaseSDSimvars, SDIndexedEvents {}

/** A publisher to poll and publish nav/com simvars. */
export class SDSimvarPublisher extends UpdatableSimVarPublisher<SDSimvars> {
  private static simvars = new Map<keyof SDSimvars, SimVarPublisherEntry<any>>([
    ...AdirsSimVarDefinitions,
    ...SwitchingPanelSimVarsDefinitions,
    ['sdPageToShow', { name: 'L:A32NX_ECAM_SD_PAGE_TO_DISPLAY', type: SimVarValueType.Enum }],
    ['zuluTime', { name: 'E:ZULU TIME', type: SimVarValueType.Seconds }],
    ['grossWeight', { name: 'E:ZULU TIME', type: SimVarValueType.Seconds }],
    [
      'greenHydraulicPressureSwitchPressurized',
      { name: 'L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH', type: SimVarValueType.Bool },
    ],
    [
      'yellowHydraulicPressureSwitchPressurized',
      { name: 'L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH', type: SimVarValueType.Bool },
    ],
    [
      'blueHydraulicPressureSwitchPressurized',
      { name: 'L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE_SWITCH', type: SimVarValueType.Bool },
    ],
    ['rudderDeflection', { name: 'L:A32NX_HYD_RUDDER_DEFLECTION', type: SimVarValueType.Number }],
  ]);

  public constructor(bus: EventBus) {
    super(SDSimvarPublisher.simvars, bus);
  }
}
