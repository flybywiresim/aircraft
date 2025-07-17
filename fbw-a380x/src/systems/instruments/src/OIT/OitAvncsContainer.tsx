//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  DisplayComponent,
  EventBus,
  FSComponent,
  NodeReference,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { OisDomain } from './OIT';
import { OitUiService, OitUriInformation } from './OitUiService';
import { OitDisplayUnit } from './OitDisplayUnit';
import { avncsPageForUrl } from './OitPageDirectory';
import { OitNotFound } from './Pages/OitNotFound';
import { InternalKbdKeyEvent } from './OitSimvarPublisher';
import { InteractionMode } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { OitAvncsHeader } from './Pages/nss-avncs/OitAvncsHeader';
import { OitAvncsFooter } from './Pages/nss-avncs/OitAvncsFooter';

interface OitAvncsContainerProps {
  readonly bus: EventBus;
  readonly displayUnitRef: NodeReference<OitDisplayUnit>;
  readonly captOrFo: 'CAPT' | 'FO';
  readonly avncsOrFltOps: Subscribable<OisDomain>;
}

export abstract class OitAvncsContainer extends DisplayComponent<OitAvncsContainerProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subscriptions = [] as Subscription[];

  #uiService = new OitUiService(this.props.captOrFo, this.props.bus);

  get uiService() {
    return this.#uiService;
  }

  public readonly hEventConsumer = this.props.bus.getSubscriber<InternalKbdKeyEvent>().on('kbdKeyEvent');
  public readonly interactionMode = Subject.create<InteractionMode>(InteractionMode.Touchscreen);

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  // Don't add this to the subscriptions, as it is used while container is hidden.
  private readonly hideContainer = this.props.avncsOrFltOps.map((mode) => mode === 'flt-ops');

  private readonly activePageRef = FSComponent.createRef<HTMLDivElement>();

  private activePage: VNode = (<OitNotFound uiService={this.uiService} />);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.hideContainer.sub((hidden) => {
      if (hidden) {
        for (const s of this.subscriptions) {
          s.pause();
        }
      } else {
        for (const s of this.subscriptions) {
          s.resume();
        }
      }
    });

    this.subscriptions.push(
      this.uiService.activeUri.sub((uri) => {
        this.activeUriChanged(uri);
      }),
    );

    this.uiService.navigateTo('nss-avncs');
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
      this.activePage = avncsPageForUrl(`${uri.sys}/${uri.page}`, this.props.bus, this.uiService, this);
    } else {
      this.activePage = avncsPageForUrl(`${uri.sys}`, this.props.bus, this.uiService, this);
    }

    FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    for (const s of this.subscriptions) {
      s.destroy();
    }

    this.hideContainer.destroy();

    super.destroy();
  }

  render(): VNode {
    return (
      <div ref={this.topRef} class={{ 'oit-main': true, hidden: this.hideContainer }}>
        <OitAvncsHeader uiService={this.uiService} avncsOrFltOps={this.props.avncsOrFltOps} />
        <div ref={this.activePageRef} class="mfd-navigator-container" />
        <OitAvncsFooter uiService={this.uiService} avncsOrFltOps={this.props.avncsOrFltOps} />
      </div>
    );
  }
}
