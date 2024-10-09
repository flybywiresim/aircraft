// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  EventBus,
  FSComponent,
  NodeReference,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';

import { RmpPage } from './RmpPage';
import { VhfComPage } from '../Pages/VhfCom/VhfComPage';
import { KeypadEvents, SystemKeys } from 'instruments/src/RMP/Systems/KeypadController';
import { TransponderPage } from 'instruments/src/RMP/Pages/Transponder/TransponderPage';

export interface RmpPageStackProps extends ComponentProps {
  bus: EventBus;
}

type Pages = 'vhf' | 'transponder';

type PageData = {
  route: string;
  ref: NodeReference<RmpPage>;
};

export class RmpPageStack extends DisplayComponent<RmpPageStackProps> {
  private readonly pages: Record<Pages, PageData> = {
    vhf: {
      route: '/vhf',
      ref: FSComponent.createRef<RmpPage>(),
    },
    transponder: {
      route: '/transponder',
      ref: FSComponent.createRef<RmpPage>(),
    },
  };

  private previousPage: Pages | null = null;
  private readonly activePage = Subject.create<Pages>('vhf');

  onAfterRender(): void {
    this.activePage.sub((v) => {
      if (this.previousPage) {
        this.pages[this.previousPage].ref.instance.setActive(false);
      }
      this.previousPage = v;
      this.pages[v].ref.instance.setActive(true);
    }, true);

    const sub = this.props.bus.getSubscriber<KeypadEvents>();
    sub
      .on('keypad_page_key_pressed')
      .handle((key) => this.pages[this.activePage.get()].ref.instance.onKeyPressed?.(key));
    sub
      .on('keypad_page_key_released')
      .handle((key) => this.pages[this.activePage.get()].ref.instance.onKeyReleased?.(key));
    sub.on('keypad_system_key_pressed').handle((key) => {
      switch (key) {
        case SystemKeys.VhfPage:
          this.navigateTo('/vhf');
          break;
        case SystemKeys.SquawkPage:
          this.navigateTo('/transponder');
          break;
      }
    });
  }

  private navigateTo(route: string): void {
    for (const page of Object.keys(this.pages) as Pages[]) {
      if (this.pages[page].route === route) {
        this.activePage.set(page);
        return;
      }
    }
    console.warn('Invalid route:', route);
  }

  /** @inheritdoc */
  render(): VNode | null {
    return (
      <div class="rmp-pages">
        <VhfComPage ref={this.pages.vhf.ref} bus={this.props.bus} />
        <TransponderPage ref={this.pages.transponder.ref} bus={this.props.bus} />
      </div>
    );
  }
}
