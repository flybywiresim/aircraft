// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NavAidMode } from '@flybywiresim/fbw-sdk';
import { EventBus, PublishPacer, SimVarPublisher, SimVarPublisherEntry, SimVarValueType } from '@microsoft/msfs-sdk';

interface FcuBaseEvents {
  /** Whether TRK/FPA mode is active. */
  fcu_trk_fpa_active: boolean;
  fcu_left_navaid_mode: NavAidMode;
  fcu_right_navaid_mode: NavAidMode;
  fcu_loc_mode_active: boolean;
  fcu_approach_mode_active: boolean;
}

type IndexedTopics = 'fcu_left_navaid_mode' | 'fcu_right_navaid_mode';

type FcuIndexedEvents = {
  [P in keyof Pick<FcuBaseEvents, IndexedTopics> as `${P}_${1 | 2}`]: FcuBaseEvents[P];
};

export interface FcuEvents extends FcuBaseEvents, FcuIndexedEvents {}

export class FcuPublisher extends SimVarPublisher<FcuEvents> {
  /**
   * Create an FCU publisher
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<FcuEvents>) {
    const simvars = new Map<keyof FcuEvents, SimVarPublisherEntry<any>>([
      ['fcu_trk_fpa_active', { name: `L:A32NX_TRK_FPA_MODE_ACTIVE`, type: SimVarValueType.Bool }],
      [
        'fcu_left_navaid_mode',
        { name: `L:A32NX_EFIS_L_NAVAID_#index#_MODE`, type: SimVarValueType.Enum, indexed: true },
      ],
      [
        'fcu_right_navaid_mode',
        { name: `L:A32NX_EFIS_R_NAVAID_#index#_MODE`, type: SimVarValueType.Enum, indexed: true },
      ],
      [
        'fcu_loc_mode_active',
        {
          name: 'L:A32NX_FCU_LOC_MODE_ACTIVE',
          type: SimVarValueType.Bool,
        },
      ],
      [
        'fcu_approach_mode_active',
        {
          name: 'L:A32NX_FCU_APPR_MODE_ACTIVE',
          type: SimVarValueType.Bool,
        },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
