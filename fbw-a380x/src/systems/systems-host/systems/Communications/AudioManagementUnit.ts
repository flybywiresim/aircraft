// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  EventBus,
  Instrument,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscribable,
} from '@microsoft/msfs-sdk';
import { RadioNavSelectedNavaid, RmpAmuBusEvents } from 'systems-host/systems/Communications/RmpAmuBusPublisher';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { A380Failure } from '@failures';

export type AmuIndex = 1 | 2;

export enum ComIndex {
  Vhf1 = 1,
  Vhf2 = 2,
  Vhf3 = 3,
}

/**
 * An audio management unit that controls the MSFS audio systems.
 * AMU1 primarily covers the captain's side, while AMU2 covers the F/O's side.
 */
export class AudioManagementUnit implements Instrument {
  private readonly sub = this.bus.getSubscriber<RmpAmuBusEvents>();

  private readonly onsideRmpIndex = this.index;
  private readonly offsideRmpIndex = this.index === 2 ? 1 : 2;

  private readonly mainPowerVar = 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED';

  private readonly _isHealthy = Subject.create(false);
  public readonly isHealthy = this._isHealthy as Subscribable<boolean>;

  private readonly failureKey = this.index === 2 ? A380Failure.AudioManagementUnit2 : A380Failure.AudioManagementUnit1;

  // TODO hook up
  private readonly onsideRmpSwitchedOn = Subject.create(true);
  private readonly rmp3SwitchedOn = Subject.create(true);

  private readonly activeRmpIndex = MappedSubject.create(
    ([onsideHealthy, rmp3Healthy]) => (onsideHealthy ? this.onsideRmpIndex : rmp3Healthy ? 3 : this.offsideRmpIndex),
    this.onsideRmpSwitchedOn,
    this.rmp3SwitchedOn,
  );

  private readonly vhf1Receive = ConsumerSubject.create(null, false);
  private readonly vhf2Receive = ConsumerSubject.create(null, false);
  private readonly vhf3Receive = ConsumerSubject.create(null, false);
  private readonly vhf1Transmit = ConsumerSubject.create(null, false);
  private readonly vhf2Transmit = ConsumerSubject.create(null, false);
  private readonly vhf3Transmit = ConsumerSubject.create(null, false);
  private readonly vhf1Volume = ConsumerSubject.create(null, 0);
  private readonly vhf2Volume = ConsumerSubject.create(null, 0);
  private readonly vhf3Volume = ConsumerSubject.create(null, 0);

  private readonly navaidReceive = ConsumerSubject.create(null, false);
  private readonly navaidVoiceFilter = ConsumerSubject.create(null, false);
  private readonly navaidVolume = ConsumerSubject.create(null, 0);
  private readonly navaidSelected = ConsumerSubject.create(null, RadioNavSelectedNavaid.Adf1);

  constructor(
    private readonly bus: EventBus,
    private readonly index: AmuIndex,
    private readonly failuresConsumer: FailuresConsumer,
  ) {}

  /** @inheritdoc */
  init(): void {
    this.activeRmpIndex.sub((rmpIndex) => {
      this.vhf1Receive.setConsumer(this.sub.on(`rmp_amu_vhf1_receive_${rmpIndex}`));
      this.vhf2Receive.setConsumer(this.sub.on(`rmp_amu_vhf2_receive_${rmpIndex}`));
      this.vhf3Receive.setConsumer(this.sub.on(`rmp_amu_vhf3_receive_${rmpIndex}`));
      this.vhf1Transmit.setConsumer(this.sub.on(`rmp_amu_vhf1_transmit_${rmpIndex}`));
      this.vhf2Transmit.setConsumer(this.sub.on(`rmp_amu_vhf2_transmit_${rmpIndex}`));
      this.vhf3Transmit.setConsumer(this.sub.on(`rmp_amu_vhf3_transmit_${rmpIndex}`));
      this.vhf1Volume.setConsumer(this.sub.on(`rmp_amu_vhf1_volume_${rmpIndex}`));
      this.vhf2Volume.setConsumer(this.sub.on(`rmp_amu_vhf2_volume_${rmpIndex}`));
      this.vhf3Volume.setConsumer(this.sub.on(`rmp_amu_vhf3_volume_${rmpIndex}`));
      this.navaidReceive.setConsumer(this.sub.on(`rmp_amu_nav_receive_${rmpIndex}`));
      this.navaidVoiceFilter.setConsumer(this.sub.on(`rmp_amu_nav_filter_${rmpIndex}`));
      this.navaidVolume.setConsumer(this.sub.on(`rmp_amu_nav_volume_${rmpIndex}`));
      this.navaidSelected.setConsumer(this.sub.on(`rmp_amu_nav_sel_${rmpIndex}`));
    }, true);

    this.failuresConsumer.register(this.failureKey);
  }

  /** @inheritdoc */
  onUpdate(): void {
    const failed = this.failuresConsumer.isActive(this.failureKey);
    const powered = SimVar.GetSimVarValue(this.mainPowerVar, SimVarValueType.Bool) > 0;
    this._isHealthy.set(!failed && powered);
  }

  public getActiveNavAudio(): RadioNavSelectedNavaid {
    return this.navaidSelected.get();
  }

  public isNavVoiceFiltered(): boolean {
    return this.navaidVoiceFilter.get();
  }

  public isNavOutputOn(): boolean {
    return this.navaidReceive.get();
  }

  public getNavVolume(): number {
    return this.navaidVolume.get();
  }

  public getSelectedComTransmitter(): ComIndex | null {
    switch (true) {
      case this.vhf1Transmit.get():
        return ComIndex.Vhf1;
      case this.vhf2Transmit.get():
        return ComIndex.Vhf2;
      case this.vhf3Transmit.get():
        return ComIndex.Vhf3;
      default:
        return null;
    }
  }

  public isComReceiveOn(index: ComIndex): boolean {
    switch (index) {
      case ComIndex.Vhf1:
        return this.vhf1Receive.get();
      case ComIndex.Vhf2:
        return this.vhf2Receive.get();
      case ComIndex.Vhf3:
        return this.vhf3Receive.get();
    }
  }

  public getComVolume(index: ComIndex): number {
    switch (index) {
      case ComIndex.Vhf1:
        return this.vhf1Volume.get();
      case ComIndex.Vhf2:
        return this.vhf2Volume.get();
      case ComIndex.Vhf3:
        return this.vhf3Volume.get();
    }
  }
}
