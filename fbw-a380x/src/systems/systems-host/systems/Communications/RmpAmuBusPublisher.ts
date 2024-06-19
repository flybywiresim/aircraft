// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface BaseRmpAmuBusEvents {
  rmp_amu_vhf1_transmit: boolean;
  rmp_amu_vhf2_transmit: boolean;
  rmp_amu_vhf3_transmit: boolean;
  rmp_amu_hf1_transmit: boolean;
  rmp_amu_hf2_transmit: boolean;
  rmp_amu_tel1_transmit: boolean;
  rmp_amu_tel2_transmit: boolean;
  rmp_amu_int_transmit: boolean;
  rmp_amu_cab_transmit: boolean;
  rmp_amu_pa_transmit: boolean;
  rmp_amu_rad_nav_filter: boolean;

  rmp_amu_vhf1_receive: boolean;
  rmp_amu_vhf2_receive: boolean;
  rmp_amu_vhf3_receive: boolean;
  rmp_amu_hf1_receive: boolean;
  rmp_amu_hf2_receive: boolean;
  rmp_amu_tel1_receive: boolean;
  rmp_amu_tel2_receive: boolean;
  rmp_amu_int_receive: boolean;
  rmp_amu_cab_receive: boolean;
  rmp_amu_pa_receive: boolean;
  rmp_amu_rad_nav_receive: boolean;

  rmp_amu_vhf1_volume: number;
  rmp_amu_vhf2_volume: number;
  rmp_amu_vhf3_volume: number;
  rmp_amu_hf1_volume: number;
  rmp_amu_hf2_volume: number;
  rmp_amu_tel1_volume: number;
  rmp_amu_tel2_volume: number;
  rmp_amu_int_volume: number;
  rmp_amu_cab_volume: number;
  rmp_amu_pa_volume: number;
  rmp_amu_rad_nav_volume: number;
}

type RmpAmuBusIndexedEvents = {
  [P in keyof BaseRmpAmuBusEvents as IndexedEventType<P>]: BaseRmpAmuBusEvents[P];
};

export interface RmpAmuBusEvents extends BaseRmpAmuBusEvents, RmpAmuBusIndexedEvents {}

export class RmpAmuBusPublisher extends SimVarPublisher<RmpAmuBusEvents> {
  /**
   * Create an FuelSystemSimvarPublisher
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<RmpAmuBusEvents>) {
    const simvars = new Map<keyof RmpAmuBusEvents, SimVarPublisherEntry<any>>([
      ['rmp_amu_vhf1_transmit', { name: `L:A380X_RMP#index#_VHF_TX_1`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_vhf2_transmit', { name: `L:A380X_RMP#index#_VHF_TX_2`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_vhf3_transmit', { name: `L:A380X_RMP#index#_VHF_TX_3`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_hf1_transmit', { name: `L:A380X_RMP#index#_HF_TX_1`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_hf2_transmit', { name: `L:A380X_RMP#index#_HF_TX_2`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_tel1_transmit', { name: `L:A380X_RMP#index#_TEL_TX_1`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_tel2_transmit', { name: `L:A380X_RMP#index#_TEL_TX_2`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_int_transmit', { name: `L:A380X_RMP#index#_INT_TX`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_cab_transmit', { name: `L:A380X_RMP#index#_CAB_TX`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_pa_transmit', { name: `L:A380X_RMP#index#_PA_TX`, type: SimVarValueType.Bool, indexed: true }],
      [
        'rmp_amu_rad_nav_filter',
        { name: `L:A380X_RMP#index#_RAD_NAV_FILTER`, type: SimVarValueType.Bool, indexed: true },
      ],

      ['rmp_amu_vhf1_receive', { name: `L:A380X_RMP#index#_VHF_RX_1`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_vhf2_receive', { name: `L:A380X_RMP#index#_VHF_RX_2`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_vhf3_receive', { name: `L:A380X_RMP#index#_VHF_RX_3`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_hf1_receive', { name: `L:A380X_RMP#index#_HF_RX_1`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_hf2_receive', { name: `L:A380X_RMP#index#_HF_RX_2`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_tel1_receive', { name: `L:A380X_RMP#index#_TEL_RX_1`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_tel2_receive', { name: `L:A380X_RMP#index#_TEL_RX_2`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_int_receive', { name: `L:A380X_RMP#index#_INT_RX`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_cab_receive', { name: `L:A380X_RMP#index#_CAB_RX`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_pa_receive', { name: `L:A380X_RMP#index#_PA_RX`, type: SimVarValueType.Bool, indexed: true }],
      ['rmp_amu_rad_nav_receive', { name: `L:A380X_RMP#index#_RAD_NAV_RX`, type: SimVarValueType.Bool, indexed: true }],

      ['rmp_amu_vhf1_volume', { name: `L:A380X_RMP#index#_VHF_VOL_1`, type: SimVarValueType.Number, indexed: true }],
      ['rmp_amu_vhf2_volume', { name: `L:A380X_RMP#index#_VHF_VOL_2`, type: SimVarValueType.Number, indexed: true }],
      ['rmp_amu_vhf3_volume', { name: `L:A380X_RMP#index#_VHF_VOL_3`, type: SimVarValueType.Number, indexed: true }],
      ['rmp_amu_hf1_volume', { name: `L:A380X_RMP#index#_HF_VOL_1`, type: SimVarValueType.Number, indexed: true }],
      ['rmp_amu_hf2_volume', { name: `L:A380X_RMP#index#_HF_VOL_2`, type: SimVarValueType.Number, indexed: true }],
      ['rmp_amu_tel1_volume', { name: `L:A380X_RMP#index#_TEL_VOL_1`, type: SimVarValueType.Number, indexed: true }],
      ['rmp_amu_tel2_volume', { name: `L:A380X_RMP#index#_TEL_VOL_2`, type: SimVarValueType.Number, indexed: true }],
      ['rmp_amu_int_volume', { name: `L:A380X_RMP#index#_INT_VOL`, type: SimVarValueType.Number, indexed: true }],
      ['rmp_amu_cab_volume', { name: `L:A380X_RMP#index#_CAB_VOL`, type: SimVarValueType.Number, indexed: true }],
      ['rmp_amu_pa_volume', { name: `L:A380X_RMP#index#_PA_VOL`, type: SimVarValueType.Number, indexed: true }],
      [
        'rmp_amu_rad_nav_volume',
        { name: `L:A380X_RMP#index#_RAD_NAV_VOL`, type: SimVarValueType.Number, indexed: true },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
