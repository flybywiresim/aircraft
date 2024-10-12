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

export enum RadioNavSelector {
  Adf1,
  Adf2,
  Ls,
  Vor1,
  Vor2,
  Mkr,
}

interface BaseAudioControlLocalVarEvents {
  /** Whether the VHF knob is toggled to the receive position. */
  vhf_receive: boolean;
  /** VHF audio volume. */
  vhf_volume_knob: number;
  /** Whether the HF knob is toggled to the receive position. */
  hf_receive: boolean;
  /** HF audio volume. */
  hf_volume_knob: number;
  /** Whether the TEL knob is toggled to the receive position. */
  tel_receive: boolean;
  /** TEL audio volume. */
  tel_volume_knob: number;
  /** Whether the INT knob is toggled to the receive position. */
  int_receive: boolean;
  /** Interphone audio volume. */
  int_volume_knob: number;
  /** Whether the CAB knob is toggled to the receive position. */
  cab_receive: boolean;
  /** CAB audio volume. */
  cab_volume_knob: number;
  /** Whether the PA knob is toggled to the receive position. */
  pa_receive: boolean;
  /** PA audio volume. */
  pa_volume_knob: number;
  /** Whether the radio nav knob is toggled to the receive position. */
  radio_nav_receive: boolean;
  /** Backup radio nav audio volume. */
  radio_nav_volume_knob: number;
  /** The position of the backup radio nav selector, used to select which navaid to listen to. */
  radio_nav_selector_knob: RadioNavSelector;
  vhf_transmit: boolean;
  hf_transmit: boolean;
  tel_transmit: boolean;
  /** Whether the mech interphone is transmitting. */
  int_transmit: boolean;
  cab_transmit: boolean;
  pa_transmit: boolean;
  /** Whether the RAD NAV signal has the ident filtered out (for voice reception). */
  radio_nav_filter: boolean;
}

type IndexedLocalVarTopics =
  | 'vhf_receive'
  | 'vhf_transmit'
  | 'vhf_volume_knob'
  | 'hf_receive'
  | 'hf_transmit'
  | 'hf_volume_knob'
  | 'tel_receive'
  | 'tel_transmit'
  | 'tel_volume_knob';

type AudioControlIndexedLocalVarEvents = {
  [P in keyof Pick<
    BaseAudioControlLocalVarEvents,
    IndexedLocalVarTopics
  > as IndexedEventType<P>]: BaseAudioControlLocalVarEvents[P];
};

export interface AudioControlLocalVarEvents extends BaseAudioControlLocalVarEvents, AudioControlIndexedLocalVarEvents {}

export class AudioControlLocalVarPublisher extends SimVarPublisher<AudioControlLocalVarEvents> {
  /**
   * Create an FuelSystemSimvarPublisher
   * @param bus The EventBus to publish to
   * @param rmpIndex  The index of the RMP
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, rmpIndex: 1 | 2 | 3, pacer?: PublishPacer<AudioControlLocalVarEvents>) {
    const simvars = new Map<keyof AudioControlLocalVarEvents, SimVarPublisherEntry<any>>([
      [
        'vhf_receive',
        { name: `L:A380X_RMP_${rmpIndex}_VHF_VOL_RX_SWITCH_#index#`, type: SimVarValueType.Number, indexed: true },
      ],
      ['vhf_transmit', { name: `L:A380X_RMP_${rmpIndex}_VHF_TX_#index#`, type: SimVarValueType.Number, indexed: true }],
      [
        'vhf_volume_knob',
        { name: `L:A380X_RMP_${rmpIndex}_VHF_VOL_#index#`, type: SimVarValueType.Number, indexed: true },
      ],
      [
        'hf_receive',
        { name: `L:A380X_RMP_${rmpIndex}_HF_VOL_RX_SWITCH_#index#`, type: SimVarValueType.Number, indexed: true },
      ],
      ['hf_transmit', { name: `L:A380X_RMP_${rmpIndex}_HF_TX_#index#`, type: SimVarValueType.Number, indexed: true }],
      [
        'hf_volume_knob',
        { name: `L:A380X_RMP_${rmpIndex}_HF_VOL_#index#`, type: SimVarValueType.Number, indexed: true },
      ],
      [
        'tel_receive',
        { name: `L:A380X_RMP_${rmpIndex}_TEL_VOL_RX_SWITCH_#index#`, type: SimVarValueType.Number, indexed: true },
      ],
      ['tel_transmit', { name: `L:A380X_RMP_${rmpIndex}_TEL_TX_#index#`, type: SimVarValueType.Number, indexed: true }],
      [
        'tel_volume_knob',
        { name: `L:A380X_RMP_${rmpIndex}_TEL_VOL_#index#`, type: SimVarValueType.Number, indexed: true },
      ],
      ['int_receive', { name: `L:A380X_RMP_${rmpIndex}_INT_VOL_VOL_RX_SWITCH`, type: SimVarValueType.Number }],
      ['int_transmit', { name: `L:A380X_RMP_${rmpIndex}_INT_TX`, type: SimVarValueType.Number }],
      ['int_volume_knob', { name: `L:A380X_RMP_${rmpIndex}_INT_VOL`, type: SimVarValueType.Number }],
      ['cab_receive', { name: `L:A380X_RMP_${rmpIndex}_CAB_VOL_RX_SWITCH`, type: SimVarValueType.Number }],
      ['cab_transmit', { name: `L:A380X_RMP_${rmpIndex}_CAB_TX`, type: SimVarValueType.Number }],
      ['cab_volume_knob', { name: `L:A380X_RMP_${rmpIndex}_CAB_VOL`, type: SimVarValueType.Number }],
      ['pa_receive', { name: `L:A380X_RMP_${rmpIndex}_PA_VOL_RX_SWITCH`, type: SimVarValueType.Number }],
      ['pa_transmit', { name: `L:A380X_RMP_${rmpIndex}_PA_TX`, type: SimVarValueType.Number }],
      ['pa_volume_knob', { name: `L:A380X_RMP_${rmpIndex}_PA_VOL`, type: SimVarValueType.Number }],
      ['radio_nav_receive', { name: `L:A380X_RMP_${rmpIndex}_NAV_VOL_RX_SWITCH`, type: SimVarValueType.Number }],
      ['radio_nav_filter', { name: `L:A380X_RMP_${rmpIndex}_NAV_FILTER`, type: SimVarValueType.Number }],
      ['radio_nav_volume_knob', { name: `L:A380X_RMP_${rmpIndex}_NAV_VOL`, type: SimVarValueType.Number }],
      ['radio_nav_selector_knob', { name: `L:A380X_RMP_${rmpIndex}_NAV_SELECT`, type: SimVarValueType.Enum }],
    ]);

    super(simvars, bus, pacer);
  }
}
