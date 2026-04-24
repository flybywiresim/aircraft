// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import {
  ConsumerSubject,
  DebounceTimer,
  EventBus,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { FwsSoundManager } from './FwsSoundManager';
import { PseudoFWC } from './PseudoFWC';
import { UpdateThrottler } from '../../../../../../fbw-common/src/systems/shared/src';
import { A32NXElectricalSystemEvents } from '@shared/publishers/A32NXElectricalSystemPublisher';

export class FwsManager {
  /** Time to inhibit master warnings and cautions during startup in ms */
  private static readonly FWC_STARTUP_TIME = 5000;
  private static readonly FWC_PROCESSING_INTERVAL_MS = 60;
  /** Process twice as fast as the main FWC due to time sensitivity regarding sounds and to prevent potential cycle delays */
  private static readonly FWC_SOUND_PROCESSING_INTERVAL_MS = FwsManager.FWC_PROCESSING_INTERVAL_MS / 2;
  private readonly fwsSoundManager: FwsSoundManager;
  private readonly pseudoFwc: PseudoFWC;

  private readonly fwsSoundUpdateThrottler = new UpdateThrottler(FwsManager.FWC_SOUND_PROCESSING_INTERVAL_MS);
  private readonly fwsUpdateThrottler = new UpdateThrottler(FwsManager.FWC_PROCESSING_INTERVAL_MS); // has to be > 100 due to pulse nodes
  private readonly acEssBusPowered = ConsumerSubject.create(
    this.bus.getSubscriber<A32NXElectricalSystemEvents>().on('a32nx_elec_ac_ess_bus_is_powered'),
    false,
  );
  private readonly acBus2Powered = ConsumerSubject.create(
    this.bus.getSubscriber<A32NXElectricalSystemEvents>().on('a32nx_elec_ac_2_bus_is_powered'),
    false,
  );
  /* Since we only have one FWC, combine the power source of both FWC 1 and FWC 2*/
  private readonly fwcHasPowerSource = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.acEssBusPowered,
    this.acBus2Powered,
  );
  private readonly startupTimer = new DebounceTimer();
  private readonly startupCompleted = Subject.create(false);

  constructor(private readonly bus: EventBus) {
    this.fwsSoundManager = new FwsSoundManager(bus, this.startupCompleted);
    this.pseudoFwc = new PseudoFWC(bus, this.fwsSoundManager, this.startupCompleted);
  }

  public init() {
    this.pseudoFwc.init();
    this.fwcHasPowerSource.sub((v) => {
      //FIXME this should take into account startup time and also possible transient power loss. Should also stop fws execution?.
      if (v) {
        this.startupTimer.schedule(() => {
          this.startupCompleted.set(true);
          console.log('FWC startup completed.');
        }, FwsManager.FWC_STARTUP_TIME);
      } else {
        this.startupTimer.clear();
        this.startupCompleted.set(false);
        console.log('FWC shut down.');
      }
    });
  }

  public update(deltaTime: number): void {
    const fwsDeltaTime = this.fwsUpdateThrottler.canUpdate(deltaTime);
    if (fwsDeltaTime !== -1 && deltaTime !== 0) {
      this.pseudoFwc.update(fwsDeltaTime);
    }
    const soundDeltaTime = this.fwsSoundUpdateThrottler.canUpdate(deltaTime);
    if (soundDeltaTime !== -1 && deltaTime !== 0) {
      this.fwsSoundManager.onUpdate(soundDeltaTime);
    }
  }
}
