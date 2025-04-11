//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { PermanentData } from './StatusArea';
import { AtcMailbox } from './AtcMailbox';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyablePage';
import { SdPages } from '@shared/EcamSystemPages';

import './style.scss';
import '../index.scss';
import { CruisePage } from './Pages/Cruise/CruisePage';
import { SDSimvars } from './SDSimvarPublisher';

export interface SDProps {
  readonly bus: EventBus;
}

export interface SdPageProps extends ComponentProps {
  readonly bus: EventBus;
  readonly visible: Subscribable<boolean>;
}

export class SD extends DisplayComponent<SDProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars>();

  private readonly pageToShow = ConsumerSubject.create(this.sub.on('sdPageToShow'), 0);

  private readonly pageVisible = Array(16)
    .fill(1)
    .map(() => Subject.create(false));

  private readonly pageRef = Array(16)
    .fill(1)
    .map(() => FSComponent.createRef<DestroyableComponent<SdPageProps>>());

  // holds all page objects, make sure this is in line with the enum in EcamSystemPages.ts
  private readonly sdPages: DestroyableComponent<SdPageProps>[] = [
    <></>, // ENG
    <></>, // APU
    <></>, // BLEED
    <></>, // COND
    <></>, // PRESS
    <></>, // DOOR
    <></>, // ELEC AC
    <></>, // ELEC DC
    <></>, // FUEL
    <></>, // WHEEL
    <></>, // HYD
    <></>, // FCTL
    <></>, // CB
    <CruisePage ref={this.pageRef[13]} bus={this.props.bus} visible={this.pageVisible[13]} />,
    <></>, // STATUS
    <CruisePage ref={this.pageRef[13]} bus={this.props.bus} visible={this.pageVisible[15]} />, // TODO video page
  ];

  // Once a page is ported, add its enum value here
  private readonly indicesToShowInV2 = [SdPages.Crz];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.pageToShow.sub((v) => {
      for (const page of this.pageRef) {
        page.instance.pauseSubscriptions();
      }

      for (const page of this.pageVisible) {
        page.set(false);
      }

      // Check if valid page index
      if (v >= 0 && v < this.sdPages.length) {
        // Check whether page is already ported
        if (this.indicesToShowInV2.includes(v)) {
          this.pageRef[v].instance.resumeSubscriptions();
          this.pageVisible[v].set(true);
        }
      }
    }, true);
  }

  destroy(): void {
    super.destroy();
  }

  render(): VNode | null {
    return (
      <CdsDisplayUnit bus={this.props.bus} displayUnitId={DisplayUnitID.Sd}>
        {this.sdPages}
        <PermanentData bus={this.props.bus} />
        <AtcMailbox bus={this.props.bus} />
      </CdsDisplayUnit>
    );
  }
}
