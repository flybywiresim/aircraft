// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  EventBus,
  GameStateProvider,
  IndexedEvents,
  Instrument,
  MutableSubscribable,
  Subject,
  Subscription,
  Wait,
} from '@microsoft/msfs-sdk';

import { Arinc429SignStatusMatrix, Arinc429Word, RadioUtils } from '@flybywiresim/fbw-sdk';
import { FrequencyMode, VhfComIndices } from '../../../../shared/src/RadioTypes';

import { InterRmpBusEvents } from './InterRmpBus';
import { RmpState, RmpStateControllerEvents } from './RmpStateControllerTypes';

interface VhfComManagerIndexedDataEventsRoot {
  vhf_com_active_frequency: number | null;
  vhf_com_standby_frequency: number | null;
  vhf_com_active_mode: FrequencyMode | null;
  vhf_com_standby_mode: FrequencyMode | null;
}

/** VHF RMP internal state events. */
export type VhfComManagerDataEvents = IndexedEvents<VhfComManagerIndexedDataEventsRoot, VhfComIndices>;

interface VhfComManagerIndexedControlEventsRoot {
  vhf_com_set_standby_frequency: number | null;
  vhf_com_set_standby_mode: FrequencyMode | null;
  vhf_com_swap_frequencies: unknown;
}

export type VhfComManagerControlEvents = IndexedEvents<VhfComManagerIndexedControlEventsRoot, VhfComIndices>;

/** Manages the external interfaces to other RMPs and to the transceiver for one VHF COM radio. */
export class VhfComManager implements Instrument {
  private readonly sub = this.bus.getSubscriber<
    InterRmpBusEvents & RmpStateControllerEvents & VhfComManagerControlEvents
  >();

  private readonly pub = this.bus.getPublisher<InterRmpBusEvents & VhfComManagerDataEvents>();

  private readonly activeFrequency = Subject.create<number | null>(null);

  private readonly standbyFrequency = Subject.create<number | null>(null);

  private readonly activeMode = Subject.create<FrequencyMode>(
    this.index === 3 ? FrequencyMode.Data : FrequencyMode.Frequency,
  );

  private readonly standbyMode = Subject.create<FrequencyMode>(
    this.index === 3 ? FrequencyMode.Data : FrequencyMode.Frequency,
  );

  private readonly activeDataTopic: keyof VhfComManagerDataEvents = `vhf_com_active_frequency_${this.index}`;

  private readonly activeModeDataTopic: keyof VhfComManagerDataEvents = `vhf_com_active_mode_${this.index}`;

  private readonly standbyDataTopic: keyof VhfComManagerDataEvents = `vhf_com_standby_frequency_${this.index}`;

  private readonly standbyModeDataTopic: keyof VhfComManagerDataEvents = `vhf_com_standby_mode_${this.index}`;

  private readonly activeSyncTopic: keyof InterRmpBusEvents = `inter_rmp_set_vhf_active_${this.index}`;

  private readonly activeModeSyncTopic: keyof InterRmpBusEvents = `inter_rmp_set_vhf_active_mode_${this.index}`;

  private readonly standbySyncTopic: keyof InterRmpBusEvents = `inter_rmp_set_vhf_standby_${this.index}`;

  private readonly standbyModeSyncTopic: keyof InterRmpBusEvents = `inter_rmp_set_vhf_standby_mode_${this.index}`;

  private readonly standbyControlTopic: keyof VhfComManagerControlEvents = `vhf_com_set_standby_frequency_${this.index}`;

  private readonly standbyModeControlTopic: keyof VhfComManagerControlEvents = `vhf_com_set_standby_mode_${this.index}`;

  private readonly swapControlTopic: keyof VhfComManagerControlEvents = `vhf_com_swap_frequencies_${this.index}`;

  private readonly activeSyncSub = this.sub.on(this.activeSyncTopic).handle(this.onReceiveActive.bind(this), true);

  private readonly activeModeSyncSub = this.sub
    .on(this.activeModeSyncTopic)
    .handle(this.onReceiveActiveMode.bind(this), true);

  private readonly standbySyncSub = this.sub.on(this.standbySyncTopic).handle(this.onReceiveStandby.bind(this), true);

  private readonly standbyModeSyncSub = this.sub
    .on(this.standbyModeSyncTopic)
    .handle(this.onReceiveStandbyMode.bind(this), true);

  private readonly subs: Subscription[] = [
    this.activeSyncSub,
    this.activeModeSyncSub,
    this.standbySyncSub,
    this.standbyModeSyncSub,
    this.activeFrequency.sub(this.onActiveFrequencyChanged.bind(this), false, true),
    this.standbyFrequency.sub(this.onStandbyFrequencyChanged.bind(this), false, true),
    this.sub.on(this.standbyControlTopic).handle(this.setStandbyFrequency.bind(this)),
    this.sub.on(this.standbyModeControlTopic).handle(this.setStandbyMode.bind(this)),
    this.sub.on(this.swapControlTopic).handle(this.swapFrequencies.bind(this)),
  ];

  private readonly tuningVar: string;

  private readonly powerOffRelayVar?: string;

  private readonly powerOffRelayValue?: MutableSubscribable<number>;

  private readonly powerOffRelaySub?: Subscription;

  private readonly rmpState = ConsumerSubject.create(this.sub.on('rmp_state'), RmpState.OffStandby);

  constructor(
    private readonly bus: EventBus,
    public readonly index: VhfComIndices,
    private readonly rmpIndex: 1 | 2 | 3,
  ) {
    let isPrimary = false;
    switch (this.index) {
      case VhfComIndices.Vhf1:
        isPrimary = this.rmpIndex === 1;
        break;
      case VhfComIndices.Vhf2:
        isPrimary = this.rmpIndex === 2;
        break;
      case VhfComIndices.Vhf3:
        isPrimary = this.rmpIndex === 1;
        break;
    }
    this.tuningVar = `L:FBW_RMP${this.rmpIndex}_${isPrimary ? 'PRIMARY' : 'BACKUP'}_VHF${this.index}_FREQUENCY`;
    if (isPrimary) {
      this.powerOffRelayVar = `L:FBW_RMP3_BACKUP_VHF${this.index}_FREQUENCY`;
      this.powerOffRelayValue = Subject.create(0);
      this.powerOffRelaySub = this.powerOffRelayValue.sub(
        (v) => SimVar.SetSimVarValue(this.tuningVar, 'string', v.toString()),
        false,
        true,
      );
    }
  }

  /** @inheritdoc */
  init(): void {
    this.rmpState.sub((rmpState) => {
      console.log('rmpState', RmpState[rmpState]);
      if (rmpState === RmpState.On) {
        this.powerOffRelaySub?.pause();
      }

      for (const sub of this.subs) {
        if (rmpState === RmpState.On) {
          sub.resume(true);
        } else {
          sub.pause();
        }
      }

      if (rmpState !== RmpState.On) {
        Arinc429Word.toSimVarValue(this.tuningVar, 0, Arinc429SignStatusMatrix.FailureWarning);
        this.powerOffRelayValue?.set(0);
        this.powerOffRelaySub?.resume();
      }
    }, true);

    Wait.awaitSubscribable(GameStateProvider.get(), (v) => v === GameState.ingame, true).then(() => {
      this.activeFrequency.set(SimVar.GetSimVarValue(`COM ACTIVE FREQUENCY:${this.index}`, 'Frequency BCD32'));
      this.standbyFrequency.set(SimVar.GetSimVarValue(`COM STANDBY FREQUENCY:${this.index}`, 'Frequency BCD32'));
    });
  }

  /** @inheritdoc */
  onUpdate(): void {
    if (this.rmpState.get() !== RmpState.On && this.powerOffRelayValue && this.powerOffRelayVar) {
      this.powerOffRelayValue.set(SimVar.GetSimVarValue(this.powerOffRelayVar, 'number'));
    }
  }

  private onReceiveStandby(frequency: number): void {
    this.standbyFrequency.set(frequency);
  }

  private onReceiveStandbyMode(mode: FrequencyMode): void {
    this.standbyMode.set(mode);
  }

  private onReceiveActive(frequency: number): void {
    this.activeFrequency.set(frequency);
  }

  private onReceiveActiveMode(mode: FrequencyMode): void {
    this.activeMode.set(mode);
  }

  private onActiveModeChanged(mode: FrequencyMode | null): void {
    this.pub.pub(this.activeModeDataTopic, mode);
  }

  private onActiveFrequencyChanged(frequency: number | null): void {
    if (frequency === null) {
      Arinc429Word.toSimVarValue(this.tuningVar, 0, Arinc429SignStatusMatrix.NoComputedData);
    } else {
      Arinc429Word.toSimVarValue(
        this.tuningVar,
        RadioUtils.packBcd32VhfComFrequencyToArinc(frequency),
        Arinc429SignStatusMatrix.NormalOperation,
      );
    }
    this.pub.pub(this.activeDataTopic, frequency);
  }

  private onStandbyModeChanged(mode: FrequencyMode | null): void {
    this.pub.pub(this.standbyModeDataTopic, mode);
  }

  private onStandbyFrequencyChanged(frequency: number | null): void {
    this.pub.pub(this.standbyDataTopic, frequency);
  }

  /**
   * Sets the active frequency.
   * @param frequency Frequency in BCD32.
   */
  public setActiveFrequency(frequency: number): void {
    if (this.rmpState.get() === RmpState.On) {
      this.pub.pub(this.activeSyncTopic, frequency, true, true);
    }
  }

  /**
   * Sets the active mode.
   * @param mode New mode.
   */
  public setActiveMode(mode: FrequencyMode | null): void {
    if (this.rmpState.get() === RmpState.On) {
      this.pub.pub(this.activeModeSyncTopic, mode, true, true);
    }
  }

  /**
   * Sets the standby frequency.
   * @param frequency Frequency in BCD32.
   */
  public setStandbyFrequency(frequency: number): void {
    if (this.rmpState.get() === RmpState.On) {
      this.pub.pub(this.standbySyncTopic, frequency, true, true);
    }
  }

  /**
   * Sets the standby mode.
   * @param mode New mode.
   */
  public setStandbyMode(mode: FrequencyMode | null): void {
    if (this.rmpState.get() === RmpState.On) {
      this.pub.pub(this.standbyModeSyncTopic, mode, true, true);
    }
  }

  public swapFrequencies(): void {
    if (this.rmpState.get() === RmpState.On) {
      const newStandbyFreq = this.activeFrequency.get();
      const newActiveFreq = this.standbyFrequency.get();
      if (newStandbyFreq !== null && newActiveFreq !== null) {
        this.pub.pub(this.activeSyncTopic, newActiveFreq, true, true);
        this.pub.pub(this.standbySyncTopic, newStandbyFreq, true, true);
      }

      const newStandbyMode = this.activeMode.get();
      const newActiveMode = this.standbyMode.get();
      if (newStandbyMode !== null && newActiveMode !== null) {
        this.pub.pub(this.activeModeSyncTopic, newActiveMode, true, true);
        this.pub.pub(this.standbyModeSyncTopic, newStandbyMode, true, true);
      }
    }
  }
}
