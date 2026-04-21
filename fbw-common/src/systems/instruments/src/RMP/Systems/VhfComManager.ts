// @ts-strict-ignore
// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  EventBus,
  GameStateProvider,
  IndexedEvents,
  Instrument,
  MutableSubscribable,
  SimVarValueType,
  Subject,
  Subscription,
  Wait,
} from '@microsoft/msfs-sdk';

import { Arinc429SignStatusMatrix, Arinc429Word, RadioUtils } from '@flybywiresim/fbw-sdk';
import { FrequencyMode, VhfComIndices } from '../../../../shared/src/RadioTypes';

import { RmpState, RmpStateControllerEvents } from './RmpStateControllerTypes';
import { RmpUtils } from '../RmpUtils';

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
  // FIXME ATSU should supply this. Use SITA worldwide primary frequency until then.
  private static readonly DATA_FREQUENCY = 0x131_550_0;
  private static readonly EMERGENCY_FREQUENCY = 0x121_500_0;

  private readonly sub = this.bus.getSubscriber<RmpStateControllerEvents & VhfComManagerControlEvents>();

  private readonly pub = this.bus.getPublisher<VhfComManagerDataEvents>();

  private readonly activeFrequency = Subject.create<number | null>(null);

  private readonly standbyFrequency = Subject.create<number | null>(null);

  private readonly activeMode = Subject.create<FrequencyMode>(
    this.index === 3 ? FrequencyMode.Data : FrequencyMode.Frequency,
  );

  private readonly standbyMode = Subject.create<FrequencyMode>(
    this.index === 3 ? FrequencyMode.Data : FrequencyMode.Frequency,
  );

  private readonly activeDataTopic: keyof VhfComManagerDataEvents = `vhf_com_active_frequency_${this.index}`;
  private readonly activeFrequencyLocalVar = `L:FBW_RMP_FREQUENCY_ACTIVE_${this.index}` as const;

  private readonly activeModeDataTopic: keyof VhfComManagerDataEvents = `vhf_com_active_mode_${this.index}`;
  private readonly activeModeLocalVar = `L:FBW_RMP_MODE_ACTIVE_${this.index}` as const;

  private readonly standbyDataTopic: keyof VhfComManagerDataEvents = `vhf_com_standby_frequency_${this.index}`;
  private readonly standbyFrequencyLocalVar = `L:FBW_RMP_FREQUENCY_STANDBY_${this.index}` as const;

  private readonly standbyModeDataTopic: keyof VhfComManagerDataEvents = `vhf_com_standby_mode_${this.index}`;
  private readonly standbyModeLocalVar = `L:FBW_RMP_MODE_STANDBY_${this.index}` as const;

  private readonly standbyControlTopic: keyof VhfComManagerControlEvents = `vhf_com_set_standby_frequency_${this.index}`;

  private readonly standbyModeControlTopic: keyof VhfComManagerControlEvents = `vhf_com_set_standby_mode_${this.index}`;

  private readonly swapControlTopic: keyof VhfComManagerControlEvents = `vhf_com_swap_frequencies_${this.index}`;

  private readonly subs: Subscription[] = [
    this.activeFrequency.sub(this.onActiveFrequencyChanged.bind(this), false, true),
    this.standbyFrequency.sub(this.onStandbyFrequencyChanged.bind(this), false, true),
    this.activeMode.sub(this.onActiveModeChanged.bind(this), false, true),
    this.standbyMode.sub(this.onStandbyModeChanged.bind(this), false, true),
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

    // Initial load from sim variables (flt file) on RMP 1 only
    if (this.rmpIndex === 1) {
      Wait.awaitSubscribable(GameStateProvider.get(), (v) => v === GameState.ingame, true).then(() => {
        // VHF3 default is data mode
        if (this.index === 3) {
          SimVar.SetSimVarValue(this.activeFrequencyLocalVar, 'Frequency BCD32', VhfComManager.DATA_FREQUENCY);
          SimVar.SetSimVarValue(this.activeModeLocalVar, SimVarValueType.Enum, FrequencyMode.Data);
        } else {
          SimVar.SetSimVarValue(
            this.activeFrequencyLocalVar,
            'Frequency BCD32',
            SimVar.GetSimVarValue(`COM ACTIVE FREQUENCY:${this.index}`, 'Frequency BCD32'),
          );
        }

        SimVar.SetSimVarValue(
          this.standbyFrequencyLocalVar,
          'Frequency BCD32',
          SimVar.GetSimVarValue(`COM STANDBY FREQUENCY:${this.index}`, 'Frequency BCD32'),
        );
      });
    }
  }

  /** @inheritdoc */
  onUpdate(): void {
    if (this.rmpState.get() !== RmpState.On && this.powerOffRelayValue && this.powerOffRelayVar) {
      this.powerOffRelayValue.set(SimVar.GetSimVarValue(this.powerOffRelayVar, 'number'));
    }

    this.updateInterRmpBus();
  }

  private updateInterRmpBus(): void {
    this.activeFrequency.set(SimVar.GetSimVarValue(this.activeFrequencyLocalVar, 'Frequency BCD32'));
    this.activeMode.set(SimVar.GetSimVarValue(this.activeModeLocalVar, SimVarValueType.Enum));
    this.standbyFrequency.set(SimVar.GetSimVarValue(this.standbyFrequencyLocalVar, 'Frequency BCD32'));
    this.standbyMode.set(SimVar.GetSimVarValue(this.standbyModeLocalVar, SimVarValueType.Enum));
  }

  private onActiveModeChanged(mode: FrequencyMode): void {
    this.pub.pub(this.activeModeDataTopic, mode);
  }

  private onActiveFrequencyChanged(frequency: number): void {
    if (frequency < 1) {
      Arinc429Word.toSimVarValue(this.tuningVar, 0, Arinc429SignStatusMatrix.NoComputedData);
    } else {
      Arinc429Word.toSimVarValue(
        this.tuningVar,
        RadioUtils.packBcd32VhfComFrequencyToArinc(frequency),
        Arinc429SignStatusMatrix.NormalOperation,
      );
    }
    this.pub.pub(this.activeDataTopic, frequency > 0 ? frequency : null);
  }

  private onStandbyModeChanged(mode: FrequencyMode): void {
    this.pub.pub(this.standbyModeDataTopic, mode);
  }

  private onStandbyFrequencyChanged(frequency: number | null): void {
    this.pub.pub(this.standbyDataTopic, frequency > 0 ? frequency : null);
  }

  /**
   * Sets the active frequency.
   * @param frequency Frequency in BCD32.
   */
  public setActiveFrequency(frequency: number): void {
    if (this.rmpState.get() === RmpState.On) {
      SimVar.SetSimVarValue(this.activeFrequencyLocalVar, 'Frequency BCD32', frequency);
    }
  }

  /**
   * Sets the active mode.
   * @param mode New mode.
   */
  public setActiveMode(mode: FrequencyMode): void {
    if (this.rmpState.get() === RmpState.On) {
      SimVar.SetSimVarValue(this.activeModeLocalVar, SimVarValueType.Enum, mode);

      switch (mode) {
        case FrequencyMode.Data:
          SimVar.SetSimVarValue(this.activeFrequencyLocalVar, 'Frequency BCD32', VhfComManager.DATA_FREQUENCY);
          break;
        case FrequencyMode.Emergency:
          SimVar.SetSimVarValue(this.activeFrequencyLocalVar, 'Frequency BCD32', VhfComManager.EMERGENCY_FREQUENCY);
          break;
      }
    }
  }

  /**
   * Sets the standby frequency.
   * @param frequency Frequency in BCD32.
   */
  public setStandbyFrequency(frequency: number): void {
    if (this.rmpState.get() === RmpState.On) {
      SimVar.SetSimVarValue(this.standbyFrequencyLocalVar, 'Frequency BCD32', frequency);
    }
  }

  /**
   * Sets the standby mode.
   * @param mode New mode.
   */
  public setStandbyMode(mode: FrequencyMode): void {
    if (this.rmpState.get() === RmpState.On) {
      SimVar.SetSimVarValue(this.standbyModeLocalVar, SimVarValueType.Enum, mode);

      switch (mode) {
        case FrequencyMode.Data:
          SimVar.SetSimVarValue(this.standbyFrequencyLocalVar, 'Frequency BCD32', VhfComManager.DATA_FREQUENCY);
          break;
        case FrequencyMode.Emergency:
          SimVar.SetSimVarValue(this.standbyFrequencyLocalVar, 'Frequency BCD32', VhfComManager.EMERGENCY_FREQUENCY);
          break;
      }
    }
  }

  public swapFrequencies(): void {
    if (this.rmpState.get() === RmpState.On) {
      RmpUtils.swapVhfFrequency(this.index);
    }
  }
}
