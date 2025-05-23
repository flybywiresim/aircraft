// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export interface SwitchingPanelSimVars {
  /** State of ATT HDG switching knob (switching IR data for PFD and ND): 0 = CAPT ON 3; 1 = NORM; 2 = F/O ON 3 */
  attHdgSwitching: number;
  /** State of AIR DATA switching knob (switching ADR data for PFD and ND): 0 = CAPT ON 3; 1 = NORM; 2 = F/O ON 3 */
  airDataSwitching: number;
  /** State of FMS switching knob: 0 = CAPT ON 3; 1 = NORM; 2 = F/O ON 3 */
  fmsSwitching: number;
}

export class SwitchingPanelPublisher extends SimVarPublisher<SwitchingPanelSimVars> {
  constructor(bus: EventBus) {
    super(
      new Map([
        ['attHdgSwitching', { name: 'L:A32NX_ATT_HDG_SWITCHING_KNOB', type: SimVarValueType.Enum }],
        ['airDataSwitching', { name: 'L:A32NX_AIR_DATA_SWITCHING_KNOB', type: SimVarValueType.Enum }],
        ['fmsSwitching', { name: 'L:A32NX_FMS_SWITCHING_KNOB', type: SimVarValueType.Enum }],
      ]),
      bus,
    );
  }
}
