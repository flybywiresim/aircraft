//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ClockEvents, ComponentProps, DisplayComponent, EventBus, FSComponent, VNode } from '@microsoft/msfs-sdk';

import './style.scss';
import { OitSimvars } from 'instruments/src/OIT/OitSimvarPublisher';
import { OitUiService, OitUriInformation } from 'instruments/src/OIT/OitUiService';
import { OitNotFound } from 'instruments/src/OIT/pages/OitNotFound';
import { pageForUrl } from 'instruments/src/OIT/OitPageDirectory';
import { OitHeader } from 'instruments/src/OIT/OitHeader';

export interface AbstractOitPageProps extends ComponentProps {
  bus: EventBus;
  oit: OIT;
}

export interface OitProps {
  readonly bus: EventBus;
  readonly instrument: BaseInstrument;
  captOrFo: 'CAPT' | 'FO';
}

export class OIT extends DisplayComponent<OitProps> {
  private readonly sub = this.props.bus.getSubscriber<ClockEvents & OitSimvars>();

  #uiService = new OitUiService(this.props.captOrFo, this.props.bus);

  get uiService() {
    return this.#uiService;
  }

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly activePageRef = FSComponent.createRef<HTMLDivElement>();

  private activePage: VNode = (<OitNotFound bus={this.props.bus} oit={this} />);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.uiService.activeUri.sub((uri) => {
      this.activeUriChanged(uri);
    });

    this.uiService.navigateTo('flt-ops'); // should be /sts
  }

  private activeUriChanged(uri: OitUriInformation) {
    // Remove and destroy old OIT page
    if (this.activePageRef.getOrDefault()) {
      while (this.activePageRef.instance.firstChild) {
        this.activePageRef.instance.removeChild(this.activePageRef.instance.firstChild);
      }
    }
    if (this.activePage && this.activePage.instance instanceof DisplayComponent) {
      this.activePage.instance.destroy();
    }

    // Mapping from URL to page component
    if (uri.page) {
      this.activePage = pageForUrl(`${uri.sys}/${uri.page}`, this.props.bus, this);
    } else {
      this.activePage = pageForUrl(`${uri.sys}`, this.props.bus, this);
    }

    FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());
  }

  destroy(): void {
    super.destroy();
  }

  render(): VNode | null {
    return (
      <div ref={this.topRef} class="oit-main">
        <OitHeader uiService={this.uiService} oit={this} />
        <div ref={this.activePageRef} class="mfd-navigator-container" />
      </div>
    );
  }
}
