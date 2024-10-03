// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DebounceTimer,
  EventBus,
  MappedSubject,
  ObjectSubject,
  Subject,
  Subscribable,
} from '@microsoft/msfs-sdk';

import {
  Arinc429LocalVarConsumerSubject,
  FrequencyMode,
  RadioChannelType,
  RadioUtils,
  VhfComIndices,
} from '@flybywiresim/fbw-sdk';
import { VhfComManagerControlEvents, VhfComManagerDataEvents } from '@flybywiresim/rmp';
import { RmpMessageControlEvents } from '../../Systems/RmpMessageManager';
import { AudioControlLocalVarEvents } from '../../Data/AudioControlPublisher';
import { VhfRadioEvents } from '../../Data/VhfRadioPublisher';
import { FlasherEvents } from '../..//Systems/Flasher';

export enum ReceptionMode {
  Off,
  Receive,
  TransmitOnly,
}

export const StandbyModeTitles: Record<FrequencyMode, string> = {
  [FrequencyMode.Frequency]: 'STBY',
  [FrequencyMode.Data]: '',
  [FrequencyMode.Emergency]: 'EMER',
};

export interface StandbyDigit {
  digit: Subscribable<string>;
  isPilotEntered: Subscribable<boolean>;
}

// FIXME make all the data pausable when the page is not active

interface StandbyEntry {
  /** Entered characters. */
  entered: string;
  /** The number of digits the entry is shifted to the right if auto-completed, else 0. */
  entryOffset: number;
  /** Text displayed in the field. */
  displayed: string;
  /** BCD32 frequency, or 0 if no completed (auto or manual) entry yet. */
  frequency: number;
}

export class VhfComController {
  private static readonly EMPTY_FREQUENCY = '---.---';

  private static readonly EMPTY_STANDBY_ENTRY: StandbyEntry = {
    entered: '',
    entryOffset: 0,
    displayed: VhfComController.EMPTY_FREQUENCY,
    frequency: 0,
  };

  private static readonly TRANSMIT_ONLY_FLASH_TIME = 2_000;

  private readonly standbyControlTopic: keyof VhfComManagerControlEvents = `vhf_com_set_standby_frequency_${this.vhfIndex}`;

  private readonly standbyModeControlTopic: keyof VhfComManagerControlEvents = `vhf_com_set_standby_mode_${this.vhfIndex}`;

  private readonly swapControlTopic: keyof VhfComManagerControlEvents = `vhf_com_swap_frequencies_${this.vhfIndex}`;

  private readonly audioSub = this.bus.getSubscriber<AudioControlLocalVarEvents>();
  private readonly vhfSub = this.bus.getSubscriber<VhfComManagerDataEvents & VhfRadioEvents>();
  private readonly flashSub = this.bus.getSubscriber<FlasherEvents>();
  private readonly vhfPub = this.bus.getPublisher<VhfComManagerControlEvents>();
  private readonly messagePub = this.bus.getPublisher<RmpMessageControlEvents>();

  private readonly flash1Hz = ConsumerSubject.create(this.flashSub.on('flash_1hz'), false);

  private readonly _activeFrequency = ConsumerSubject.create<number | null>(
    this.vhfSub.on(`vhf_com_active_frequency_${this.vhfIndex}`),
    null,
  );
  public activeFrequency = this._activeFrequency as Subscribable<number | null>;

  private readonly radioFrequency = Arinc429LocalVarConsumerSubject.create(
    this.vhfSub.on(`vhf_radio_frequency_${this.vhfIndex}`),
    0,
  );

  private readonly _standbyFrequency = ConsumerSubject.create<number | null>(
    this.vhfSub.on(`vhf_com_standby_frequency_${this.vhfIndex}`),
    null,
  );
  public readonly standbyFrequency = this._standbyFrequency as Subscribable<number | null>;

  // FIXME use the delayed var
  private isReceiveOn = ConsumerSubject.create(this.audioSub.on(`vhf_receive_${this.vhfIndex}`), false);

  public isTransmitOn = ConsumerSubject.create(this.audioSub.on(`vhf_transmit_${this.vhfIndex}`), false);

  private readonly _receptionMode = MappedSubject.create(
    ([rx, tx]) => {
      if (rx) {
        return ReceptionMode.Receive;
      }
      if (tx) {
        return ReceptionMode.TransmitOnly;
      }
      return ReceptionMode.Off;
    },
    this.isReceiveOn,
    this.isTransmitOn,
  );
  public receptionMode = this._receptionMode as Subscribable<ReceptionMode>;

  private readonly _standbyDigits = Array.from({ length: 6 }, () => ({
    digit: Subject.create('-'),
    isPilotEntered: Subject.create(false),
  }));
  public readonly standbyDigits = this._standbyDigits as StandbyDigit[];

  private readonly standbyEntry = ObjectSubject.create<StandbyEntry>({ ...VhfComController.EMPTY_STANDBY_ENTRY });

  public readonly standbyEntryInProgress = Subject.create(false);
  private readonly isStandbyEntryInvalid = Subject.create(false);

  public isStandbyAmber = MappedSubject.create(
    ([standbyFreq, isInvalid]) => isInvalid || standbyFreq === null,
    this.standbyFrequency,
    this.isStandbyEntryInvalid,
  ) as Subscribable<boolean>;

  private readonly activeMode = ConsumerSubject.create(
    this.vhfSub.on(`vhf_com_active_mode_${this.vhfIndex}`),
    this.vhfIndex === 3 ? FrequencyMode.Data : FrequencyMode.Frequency,
  );

  private readonly standbyModesAvailable =
    this.vhfIndex === 3
      ? [FrequencyMode.Data, FrequencyMode.Emergency, FrequencyMode.Frequency]
      : [FrequencyMode.Frequency];
  private readonly standbyMode = ConsumerSubject.create(
    this.vhfSub.on(`vhf_com_standby_mode_${this.vhfIndex}`),
    this.vhfIndex === 3 ? FrequencyMode.Data : FrequencyMode.Frequency,
  );
  public readonly standbyModeTitle = this.standbyMode.map((v) =>
    v === null ? '' : StandbyModeTitles[v],
  ) as Subscribable<string>;
  public readonly isStandbyModeDownNotAvailable = this.standbyMode.map(
    (v) => v === null || v <= 0,
  ) as Subscribable<boolean>;
  public readonly isStandbyModeUpNotAvailable = this.standbyMode.map(
    (v) => v === null || v >= this.standbyModesAvailable.length - 1,
  ) as Subscribable<boolean>;

  public isRadioFailed = this.radioFrequency.map((v) => v.isFailureWarning()) as Subscribable<boolean>;

  public readonly activeText = MappedSubject.create(
    ([rmpFrequency, mode, failed]) => {
      if (mode === FrequencyMode.Data) {
        return rmpFrequency === null || failed ? '----' : 'DATA';
      }
      return rmpFrequency === null || failed ? VhfComController.EMPTY_FREQUENCY : RadioUtils.formatBcd32(rmpFrequency);
    },
    this.activeFrequency,
    this.activeMode,
    this.isRadioFailed,
  ) as Subscribable<string>;

  private readonly transmitOnlyFlashing = Subject.create(false);

  private readonly transmitOnlyFlashingTimer = new DebounceTimer();

  public readonly isLoudspeakerHidden = MappedSubject.create(
    ([receptionMode, transmitOnlyFlashing, flash1Hz]) =>
      receptionMode === ReceptionMode.Off ||
      (receptionMode === ReceptionMode.TransmitOnly && transmitOnlyFlashing && !flash1Hz),
    this.receptionMode,
    this.transmitOnlyFlashing,
    this.flash1Hz,
  ) as Subscribable<boolean>;

  public readonly transceiverName = `VHF${this.vhfIndex}`;

  constructor(
    private readonly bus: EventBus,
    private readonly vhfIndex: VhfComIndices,
    private readonly isRowSelected: Subscribable<boolean>,
  ) {
    this.isStandbyEntryInvalid.sub(
      (v) => v && this.messagePub.pub('rmp_message_set', `${this.transceiverName} FREQ NOT VALID`),
    );
    this.isRowSelected.sub((v) => !v && this.standbyEntry.set(VhfComController.EMPTY_STANDBY_ENTRY));

    MappedSubject.create(this.standbyEntry, this.standbyFrequency).sub(([entry, frequency]) => {
      this.isStandbyEntryInvalid.set(
        entry.frequency !== 0 && entry.frequency !== 0x1100000 && !RadioUtils.isValidFrequency(entry.frequency),
      );
      const entryInProgress = entry.entered.length > 0;
      this.standbyEntryInProgress.set(entryInProgress);

      const displayString = entryInProgress
        ? entry.displayed
        : frequency === null
          ? '------'
          : RadioUtils.formatBcd32(frequency, '');
      for (let i = 0; i < 6; i++) {
        const displayDigit = this._standbyDigits[i];
        displayDigit.digit.set(displayString[i] ?? '_');
        displayDigit.isPilotEntered.set(
          entryInProgress && i >= entry.entryOffset && i < entry.entryOffset + entry.entered.length,
        );
      }
    });

    this.receptionMode.sub((mode) => {
      if (mode === ReceptionMode.TransmitOnly) {
        this.transmitOnlyFlashing.set(true);
        this.transmitOnlyFlashingTimer.schedule(
          () => this.transmitOnlyFlashing.set(false),
          VhfComController.TRANSMIT_ONLY_FLASH_TIME,
        );
      }
    });
  }

  public onAdkPressed(): void {
    this.vhfPub.pub(this.swapControlTopic, undefined, false, false);
  }

  public onLskPressed(): void {
    if (this.standbyEntry.get().entered.length < 1) {
      this.messagePub.pub('rmp_message_set', `${this.transceiverName} FREQ NOT COMPLETED`);
      return;
    }

    // then check validity and send if valid
    const standbyFreq = this.standbyEntry.get().frequency;
    if (RadioUtils.isValidFrequency(standbyFreq)) {
      this.vhfPub.pub(this.standbyControlTopic, standbyFreq);
    } else {
      this.messagePub.pub('rmp_message_set', `${this.transceiverName} STBY REVERTED TO PREV ENTRY`);
    }
    this.standbyEntry.set(VhfComController.EMPTY_STANDBY_ENTRY);
  }

  /*

      17 = 17_.___ invalid amber "VHFx FREQ NOT VALID"
      18 = 118.000
      187 = 118.700
      1875 = 118.750
      8 = 118.000
      87 = 118.700
      875 = 118.750

      // TODO 13x.xxx not auto-completed?
      3 = 13_.___
      37 = 137.___ amber = "VHFx FREQ NOT VALID"

      pushing a digit does nothing when not valid

      CLR a digit = that digit and ones after go to _
      CLR all digits = "VHFx STBY REVERTED TO PREV ENTRY"
      entry cannot shift left with subsequent digits, but can shift right (e.g. 1 => 18)!!

    */

  public onDigitEntered(digit: number): void {
    const standbyEntry = this.standbyEntry.get();
    // 1 = 1__.___
    if (standbyEntry.entered.length === 0 && digit === 1) {
      this.standbyEntry.set({
        entered: '1',
        entryOffset: 0,
        displayed: '1_____',
        frequency: 0,
      });
      return;
    }
    if (standbyEntry.entered.length >= 6 || this.isStandbyEntryInvalid.get()) {
      return;
    }

    const entered = `${standbyEntry.entered}${digit}`;
    let frequency = parseInt(entered, 16) << (4 + 4 * (6 - entered.length));

    // FIXME ensure entryOffset can never decrease
    if (RadioUtils.isValidFrequency(frequency) || entered.length === 6) {
      this.standbyEntry.set({
        entered,
        entryOffset: 0,
        displayed: entered.padEnd(6, '0'),
        frequency,
      });
      return;
    }

    const channelInfo = RadioUtils.CHANNEL_TYPES[RadioChannelType.VhfCom8_33_25];

    // there doesn't seem to be any auto-fill for leading 13
    // FIXME should we handle leading 13 similarly?
    if (entered.charAt(0) === '3') {
      frequency = 0x1000000 | (frequency >> 4);
      if (entered.length < 5 && frequency < channelInfo.max) {
        frequency = 0;
      }
      this.standbyEntry.set({
        entered,
        entryOffset: 1,
        displayed: `1${entered.padEnd(5, '_')}`,
        frequency,
      });
      return;
    }

    // try shift 1 right, filling leading 1, see if valid
    // then try shift 2 right, filling leading 11, see if valid
    for (let i = 0; i < 3; i++) {
      if (i > 0) {
        frequency >>>= 4;
        frequency |= 0x1000000;
        if (RadioUtils.isValidFrequency(frequency)) {
          this.standbyEntry.set({
            entered,
            entryOffset: i,
            displayed: RadioUtils.formatBcd32(frequency, ''),
            frequency,
          });
          return;
        }
      }
      // we need to handle the case where the entry could be valid with the correct channel spacing applied
      if (standbyEntry.entryOffset + entered.length === 5) {
        const channelMask = 0xff;
        for (const chan of channelInfo.channels) {
          if ((chan & 0xf00) !== (frequency & 0xf00)) {
            continue;
          }
          frequency &= ~channelMask;
          frequency |= chan;
          if (RadioUtils.isValidFrequency(frequency)) {
            this.standbyEntry.set({
              entered,
              entryOffset: i,
              displayed: RadioUtils.formatBcd32(frequency, ''),
              frequency,
            });
            return;
          }
        }
      }
    }

    frequency = parseInt(entered, 16) << (4 + 4 * (6 - entered.length));
    this.standbyEntry.set({
      entered,
      entryOffset: 0,
      displayed: RadioUtils.formatBcd32(frequency, '').slice(0, entered.length).padEnd(6, '_'),
      frequency,
    });
  }

  public onClear(singleDigit = true): void {
    const standbyEntry = this.standbyEntry.get().entered;
    if (standbyEntry.length === 0) {
      return;
    }
    this.standbyEntry.set(VhfComController.EMPTY_STANDBY_ENTRY);
    if (singleDigit && standbyEntry.length > 1) {
      // simply lovely hack
      for (let i = 0; i < standbyEntry.length - 1; i++) {
        this.onDigitEntered(parseInt(standbyEntry[i]));
      }
      const newEntry = this.standbyEntry.get();
      this.standbyEntry.set({
        displayed: newEntry.displayed.slice(0, newEntry.entryOffset + newEntry.entered.length).padEnd(6, '_'),
      });
    } else if (standbyEntry.length === 1) {
      this.messagePub.pub('rmp_message_set', `${this.transceiverName} STBY REVERTED TO PREV ENTRY`);
    }
  }

  public onUpPressed(): void {
    const oldMode = this.standbyMode.get();
    if (this.isStandbyModeUpNotAvailable.get() || oldMode == null) {
      return;
    }

    this.vhfPub.pub(this.standbyModeControlTopic, oldMode + 1, false, false);
  }

  public onDownPressed(): void {
    const oldMode = this.standbyMode.get();
    if (this.isStandbyModeDownNotAvailable.get() || oldMode == null) {
      return;
    }

    this.vhfPub.pub(this.standbyModeControlTopic, oldMode - 1, false, false);
  }
}
