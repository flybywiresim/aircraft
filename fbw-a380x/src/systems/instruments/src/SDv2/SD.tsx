//  Copyright (c) 2025 FlyByWire Simulations
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
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { PermanentData } from './StatusArea';
import { AtcMailbox } from './AtcMailbox';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { SdPages } from '@shared/EcamSystemPages';

import './style.scss';
import '../index.scss';
import { CruisePage } from './Pages/Cruise/CruisePage';
import { VideoPage } from './Pages/Video/VideoPage';
import { StatusPage } from './Pages/Status/StatusPage';
import { SDSimvars } from './SDSimvarPublisher';

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
    null, // APU
    null, // BLEED
    null, // COND
    null, // PRESS
    null, // DOOR
    null, // ELEC AC
    null, // ELEC DC
    null, // FUEL
    null, // WHEEL
    null, // HYD
    null, // FCTL
    null, // CB
    <CruisePage ref={this.pageRef[SdPages.Crz]} bus={this.props.bus} visible={this.pageVisible[SdPages.Crz]} />,
    <StatusPage ref={this.pageRef[SdPages.Status]} bus={this.props.bus} visible={this.pageVisible[SdPages.Status]} />,
    <VideoPage ref={this.pageRef[SdPages.Video]} bus={this.props.bus} visible={this.pageVisible[SdPages.Video]} />,
  ];

  // Once a page is ported, add its enum value here
  private readonly indicesToShowInV2 = [SdPages.Crz, SdPages.Status, SdPages.Video];

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
      <CdsDisplayUnit bus={this.props.bus} displayUnitId={DisplayUnitID.Sd}>
        {this.sdPages}
        <div class="sd-content-area-blocker" style={{ visibility: this.anyPageVisibleStyle }} />
        <PermanentData bus={this.props.bus} />
        <AtcMailbox bus={this.props.bus} />
      </CdsDisplayUnit>
    );
  }
}
