//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
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
import { InternalKbdKeyEvent, OitSimvars } from './OitSimvarPublisher';
import { InteractionMode } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { OitAvncsHeader } from './Pages/NssAvncs/OitAvncsHeader';
import { OitAvncsFooter } from './Pages/NssAvncs/OitAvncsFooter';
import { OitAvncsLoadingScreen } from './Pages/NssAvncs/OitAvncsLoadingScreen';
import { OitAvncsLogin } from './Pages/NssAvncs/OitAvncsLogin';
import { AnsuOps } from './System/AnsuOps';

interface OitAvncsContainerProps {
  readonly bus: EventBus;
  readonly displayUnitRef: NodeReference<OitDisplayUnit>;
  readonly captOrFo: 'CAPT' | 'FO';
  readonly avncsOrFltOps: Subscribable<OisDomain>;
  readonly ansu: AnsuOps;
}

export abstract class OitAvncsContainer extends DisplayComponent<OitAvncsContainerProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subscriptions = [] as Subscription[];

  private readonly sub = this.props.bus.getSubscriber<OitSimvars>();

  #uiService = new OitUiService(this.props.captOrFo);

  get uiService() {
    return this.#uiService;
  }

  get ansu() {
    return this.props.ansu;
  }

  public readonly hEventConsumer = this.props.bus.getSubscriber<InternalKbdKeyEvent>().on('kbdKeyEvent');
  public readonly interactionMode = Subject.create<InteractionMode>(InteractionMode.Touchscreen);

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly ansuPowered = ConsumerSubject.create(this.sub.on('nssAnsu1Healthy'), false);

  private readonly hideContent = MappedSubject.create(
    ([mode, powered]) => mode === 'flt-ops' || !powered,
    this.props.avncsOrFltOps,
    this.ansuPowered,
  );

  private readonly hideContainer = this.props.avncsOrFltOps.map((mode) => mode === 'flt-ops');

  private readonly renderedUri = Subject.create<OitUriInformation | null>(null);

  private readonly activePageRef = FSComponent.createRef<HTMLDivElement>();

  private activePage: VNode = (<OitNotFound uiService={this.uiService} />);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.uiService.activeUri.sub((uri) => {
        this.activeUriChanged(uri);
      }),
      this.ansuPowered.sub((powered) => {
        if (!powered) {
          this.uiService.navigateTo('nss-avncs');
        }
      }),
      this.ansuPowered,
      this.hideContent,
      this.hideContainer,
    );

    this.uiService.navigateTo('nss-avncs');
  }

  private activeUriChanged(uri: OitUriInformation) {
    if (
      (uri.uri.match(/nss-avncs\/company-com\/\S*/gm) &&
        this.renderedUri.get()?.uri.match(/nss-avncs\/company-com/gm)) ||
      (uri.uri.match(/nss-avncs\/a380x-systems\/\S*/gm) &&
        this.renderedUri.get()?.uri.match(/nss-avncs\/a380x-systems/gm))
    ) {
      // Handle special case for company-com, where the sub-navigation is handled by the component with their own navigator and we're already on the right parent page.
      return;
    }

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
    this.renderedUri.set(uri);
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
      <div ref={this.topRef} class={{ 'oit-main': true, hidden: this.hideContainer }}>
        <div class={{ 'oit-page-container': true, hidden: this.hideContent }}>
          <OitAvncsHeader bus={this.props.bus} uiService={this.uiService} avncsOrFltOps={this.props.avncsOrFltOps} />
          <div ref={this.activePageRef} class="mfd-navigator-container" />
          <OitAvncsFooter uiService={this.uiService} avncsOrFltOps={this.props.avncsOrFltOps} />
        </div>
        <OitAvncsLogin bus={this.props.bus} uiService={this.uiService} captOrFo={this.props.captOrFo} />
        <OitAvncsLoadingScreen bus={this.props.bus} captOrFo={this.props.captOrFo} />
      </div>
    );
  }
}
