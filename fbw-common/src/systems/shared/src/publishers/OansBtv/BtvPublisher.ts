// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

export interface BtvData {
  /** (BTV -> OANS) Arinc429: Estimated runway occupancy time (ROT), in seconds. */
  a380x_btv_rot: number;
  /** (BTV -> OANS) Arinc429: Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
  a380x_btv_turnaround_idle_reverse: number;
  /** (BTV -> OANS) Arinc429: Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
  a380x_btv_turnaround_max_reverse: number;
  /** (BTV -> OANS) Dry stopping distance */
  a380x_btv_dry_stopping_distance: number;
  /** (BTV -> OANS) Wet stopping distance */
  a380x_btv_wet_stopping_distance: number;
  /** (BTV -> OANS) Remaining stop distance on ground, used for ROP */
  a380x_btv_stop_bar_distance: number;

  /** Flight phase from FWS, from 1 to 12. */
  a380x_btv_fws_flight_phase: number;

  /** Current auto brake mode
   *
        - 0: Autobrake not armed
        - 1: Autobrake in LOW
        - 2: Autobrake in MED
        - 3: Autobrake in MAX
   */
  a380x_btv_auto_brake_mode: number;
  /** Whether auto brakes are actively braking. */
  a380x_btv_auto_brake_active: boolean;
}

export class BtvSimvarPublisher extends SimVarPublisher<BtvData> {
  private static simvars = new Map<keyof BtvData, SimVarDefinition>([
    ['a380x_btv_rot', { name: 'L:A32NX_BTV_ROT', type: SimVarValueType.Number }],
    [
      'a380x_btv_turnaround_idle_reverse',
      { name: 'L:A32NX_BTV_TURNAROUND_IDLE_REVERSE', type: SimVarValueType.Number },
    ],
    ['a380x_btv_turnaround_max_reverse', { name: 'L:A32NX_BTV_TURNAROUND_MAX_REVERSE', type: SimVarValueType.Number }],
    [
      'a380x_btv_dry_stopping_distance',
      { name: 'L:A32NX_OANS_BTV_DRY_DISTANCE_ESTIMATED', type: SimVarValueType.Number },
    ],
    [
      'a380x_btv_wet_stopping_distance',
      { name: 'L:A32NX_OANS_BTV_WET_DISTANCE_ESTIMATED', type: SimVarValueType.Number },
    ],
    [
      'a380x_btv_stop_bar_distance',
      { name: 'L:A32NX_OANS_BTV_STOP_BAR_DISTANCE_ESTIMATED', type: SimVarValueType.Number },
    ],
    ['a380x_btv_fws_flight_phase', { name: 'L:A32NX_FWC_FLIGHT_PHASE', type: SimVarValueType.Enum }],
    ['a380x_btv_auto_brake_mode', { name: 'L:A32NX_AUTOBRAKES_ARMED_MODE', type: SimVarValueType.Number }],
    ['a380x_btv_auto_brake_active', { name: 'L:A32NX_AUTOBRAKES_ACTIVE', type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: ArincEventBus) {
    super(BtvSimvarPublisher.simvars, bus);
  }
}
