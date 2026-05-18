//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  ConsumerSubject,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { PermanentData } from './StatusArea';
import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { SdPages } from '@shared/SdPages';

import './style.scss';
import '../index.scss';
import { SDSimvars } from './SDSimvarPublisher';
import { StatusPage } from './Pages/Status/StatusPage';
import { FctlPage } from './Pages/Fctl/FctlPage';

export interface SDProps {
  readonly bus: EventBus;
}

export interface SdPageProps extends ComponentProps {
  readonly bus: EventBus;
  readonly visible: Subscribable<boolean>;
}

export class SD extends DestroyableComponent<SDProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars>();

  private readonly pageToShow = ConsumerSubject.create(this.sub.on('sdPageToShow'), 0);

  private readonly pageVisible = Array(16)
    .fill(1)
    .map(() => Subject.create(false));

  private readonly anyPageVisibleStyle = MappedSubject.create(
    (vis) => (vis.some((v) => v === true) ? 'visible' : 'hidden'),
    ...this.pageVisible,
  );

  private readonly pageRef = Array(16)
    .fill(1)
    .map(() => FSComponent.createRef<DestroyableComponent<SdPageProps>>());

  // holds all page objects, make sure this is in line with the enum in EcamSystemPages.ts
  private readonly sdPages: DestroyableComponent<SdPageProps>[] = [
    null, // ENG
    null, // BLEED
    null, // PRESS
    null, // ELEC
    null, // HYD
    null, // FUEL
    null, // APU
    null, // COND
    null, // DOOR
    null, // WHEEL
    <FctlPage ref={this.pageRef[SdPages.FCTL]} bus={this.props.bus} visible={this.pageVisible[SdPages.FCTL]} />,
    null, // CRZ
    <StatusPage ref={this.pageRef[SdPages.STS]} bus={this.props.bus} visible={this.pageVisible[SdPages.STS]} />,
  ];

  // Once a page is ported, add its enum value here
  private readonly indicesToShowInV2 = [SdPages.STS, SdPages.FCTL];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.pageToShow.sub((v) => {
        for (const pageVisible of this.pageVisible) {
          pageVisible.set(false);
        }

        for (const page of this.pageRef) {
          page.getOrDefault()?.pauseSubscriptions();
        }

        // Check if valid page index
        if (v >= 0 && v < this.sdPages.length && this.sdPages[v] !== null) {
          // Check whether page is already ported
          if (this.indicesToShowInV2.includes(v)) {
            this.pageRef[v].getOrDefault()?.resumeSubscriptions();
            this.pageVisible[v].set(true);
          }
        }
      }, true),
    );

    this.subscriptions.push(this.pageToShow, this.anyPageVisibleStyle);
  }

  render(): VNode | null {
    return (
      <div class="sd">
        {this.sdPages}
        <div class="sd-content-area-blocker" style={{ visibility: this.anyPageVisibleStyle }} />
        <PermanentData bus={this.props.bus} />
      </div>
    );
  }
}
