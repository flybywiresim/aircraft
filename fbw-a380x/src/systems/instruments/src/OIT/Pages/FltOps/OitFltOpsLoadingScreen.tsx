//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { OitSimvars } from '../../OitSimvarPublisher';

interface OitFltOpsLoadingScreenProps {
  readonly bus: EventBus;
  readonly captOrFo: 'CAPT' | 'FO';
}

export class OitFltOpsLoadingScreen extends DisplayComponent<OitFltOpsLoadingScreenProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subscriptions = [] as Subscription[];

  private readonly sub = this.props.bus.getSubscriber<OitSimvars & ClockEvents>();

  private readonly laptopPowered = ConsumerSubject.create(
    this.sub.on(this.props.captOrFo === 'CAPT' ? 'laptopCaptPowered' : 'laptopFoPowered'),
    false,
  );

  /** in seconds */
  private readonly remainingStartupTime = Subject.create(24);
  private readonly totalStartupTime = Subject.create(24);

  private readonly progressBarFillWidth = MappedSubject.create(
    ([remaining, total]) => (1 - remaining / total) * 40,
    this.remainingStartupTime,
    this.totalStartupTime,
  ).map((t) => `${t}%`);

  private readonly screenHidden = MappedSubject.create(
    ([powered, remaining]) => !powered || remaining <= 0,
    this.laptopPowered,
    this.remainingStartupTime,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.sub
        .on('realTime')
        .atFrequency(4)
        .handle(() => {
          // Update loading progress bar
          if (this.laptopPowered.get() && this.remainingStartupTime.get() > 0) {
            this.remainingStartupTime.set(Math.max(0, this.remainingStartupTime.get() - 0.25));
          }
        }),
      this.laptopPowered.sub((powered) => {
        this.totalStartupTime.set(powered ? parseInt(NXDataStore.getLegacy('CONFIG_SELF_TEST_TIME', '12')) * 2 : 0);
        this.remainingStartupTime.set(powered ? this.totalStartupTime.get() : 0);
      }, true),
    );

    this.subscriptions.push(this.progressBarFillWidth);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <div class={{ 'oit-flt-ops-loading-screen-container': true, hidden: this.screenHidden }}>
          <div class="FbwTail" />
          <div class="LoadingProgressBarBackground" />
          <div
            class="LoadingProgressBarFill"
            style={{
              width: this.progressBarFillWidth,
            }}
          />
        </div>
      </>
    );
  }
}
