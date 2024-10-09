// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  DebounceTimer,
  EventBus,
  Instrument,
  MutableSubscribable,
  SimVarValueType,
  Subject,
} from '@microsoft/msfs-sdk';
import { KeypadEvents, SystemKeys } from './KeypadController';
import { AudioControlLocalVarEvents } from '../Data/AudioControlPublisher';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

/** Manages the external interfaces to the AMUs. */
export class AudioControlManager implements Instrument {
  /** Time to debounce the RX on in ms. */
  private static readonly RX_DEBOUNCE_TIME = 380;

  private readonly sub = this.bus.getSubscriber<AudioControlLocalVarEvents & KeypadEvents>();

  private readonly offsideRmpIndices = [this.rmpIndex === 1 ? 2 : 1, this.rmpIndex === 3 ? 1 : 3];

  private readonly keyEventMap: Record<
    any, // TODO fix type
    { localVar: string; syncVars: string[]; state: MutableSubscribable<boolean> }
  > = {
    [SystemKeys.Vhf1Call]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_VHF_TX_1`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_VHF_TX_1`),
      state: Subject.create(false),
    },
    [SystemKeys.Vhf2Call]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_VHF_TX_2`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_VHF_TX_2`),
      state: Subject.create(false),
    },
    [SystemKeys.Vhf3Call]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_VHF_TX_3`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_VHF_TX_3`),
      state: Subject.create(false),
    },
    [SystemKeys.Hf1Call]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_HF_TX_1`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_HF_TX_1`),
      state: Subject.create(false),
    },
    [SystemKeys.Hf2Call]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_HF_TX_2`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_HF_TX_2`),
      state: Subject.create(false),
    },
    [SystemKeys.Tel1Call]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_TEL_TX_1`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_TEL_TX_1`),
      state: Subject.create(false),
    },
    [SystemKeys.Tel2Call]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_TEL_TX_2`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_TEL_TX_2`),
      state: Subject.create(false),
    },
    [SystemKeys.MechCall]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_INT_TX`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_INT_TX`),
      state: Subject.create(false),
    },
    [SystemKeys.CabCall]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_CAB_TX`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_CAB_TX`),
      state: Subject.create(false),
    },
    [SystemKeys.PaCall]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_PA_TX`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_PA_TX`),
      state: Subject.create(false),
    },
    [SystemKeys.Voice]: {
      localVar: `L:A380X_RMP_${this.rmpIndex}_NAV_FILTER`,
      syncVars: this.offsideRmpIndices.map((v) => `L:A380X_RMP_${v}_NAV_FILTER`),
      state: Subject.create(false),
    },
  };

  private readonly rxDefs: { switchTopic: keyof AudioControlLocalVarEvents; rxLocalVar: string }[] = [
    {
      switchTopic: 'vhf_receive_1',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_VHF_VOL_RX_1`,
    },
    {
      switchTopic: 'vhf_receive_2',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_VHF_VOL_RX_2`,
    },
    {
      switchTopic: 'vhf_receive_3',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_VHF_VOL_RX_3`,
    },
    {
      switchTopic: 'hf_receive_1',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_HF_VOL_RX_1`,
    },
    {
      switchTopic: 'hf_receive_2',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_HF_VOL_RX_2`,
    },
    {
      switchTopic: 'tel_receive_1',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_TEL_VOL_RX_1`,
    },
    {
      switchTopic: 'tel_receive_2',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_TEL_VOL_RX_2`,
    },
    {
      switchTopic: 'int_receive',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_INT_VOL_RX`,
    },
    {
      switchTopic: 'cab_receive',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_CAB_VOL_RX`,
    },
    {
      switchTopic: 'pa_receive',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_PA_VOL_RX`,
    },
    {
      switchTopic: 'radio_nav_receive',
      rxLocalVar: `L:A380X_RMP_${this.rmpIndex}_NAV_VOL_RX`,
    },
  ];

  private readonly rxStates = this.rxDefs.map((def) => {
    const debounce = new DebounceTimer();
    return {
      ...def,
      debounce,
      sub: this.sub
        .on(def.switchTopic)
        .whenChanged()
        .handle((v) => {
          if (v) {
            debounce.schedule(
              () => SimVar.SetSimVarValue(def.rxLocalVar, SimVarValueType.Bool, 1),
              AudioControlManager.RX_DEBOUNCE_TIME,
            );
          } else {
            debounce.clear();
            SimVar.SetSimVarValue(def.rxLocalVar, SimVarValueType.Bool, 0);
          }
        }, true),
    };
  });

  private isSyncEnabled = false;

  private readonly subs = [
    this.sub.on(`keypad_system_key_pressed`).handle(this.onKeyPressed.bind(this), true),
    ...this.rxStates.map((s) => s.sub),
  ];

  constructor(
    private readonly bus: EventBus,
    private readonly rmpIndex: 1 | 2 | 3,
  ) {
    for (const keyEvent of Object.values(this.keyEventMap)) {
      this.subs.push(
        keyEvent.state.sub(
          (v) => {
            SimVar.SetSimVarValue(keyEvent.localVar, SimVarValueType.Bool, v);
            if (this.isSyncEnabled) {
              for (const localVar of keyEvent.syncVars) {
                SimVar.SetSimVarValue(localVar, SimVarValueType.Bool, v);
              }
            }
          },
          true,
          true,
        ),
      );
    }

    NXDataStore.getAndSubscribe('FO_SYNC_EFIS_ENABLED', (_, v) => (this.isSyncEnabled = v === '1'), '0');
  }

  // TODO only two tx can be active at a time

  /** @inheritdoc */
  init(): void {
    for (const sub of this.subs) {
      sub.resume();
    }
  }

  /** @inheritdoc */
  onUpdate(): void {
    // noop
  }

  private onKeyPressed(key: SystemKeys): void {
    const keyEvent = this.keyEventMap[key];
    if (keyEvent) {
      const newState = !keyEvent.state.get();

      if (newState && key !== SystemKeys.Voice) {
        // clear all others as only one can be on
        for (const k of Object.keys(this.keyEventMap)) {
          if (k !== key) {
            this.keyEventMap[k].state.set(false);
          }
        }
      }

      // now set ours on
      keyEvent.state.set(newState);
    }
  }
}
