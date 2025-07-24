//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  MappedSubscribable,
  NodeReference,
  SimVarValueType,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { OisDomain } from './OIT';
import { OitUiService, OitUriInformation } from './OitUiService';
import { getDisplayIndex, OitDisplayUnit } from './OitDisplayUnit';
import { fltOpsPageForUrl } from './OitPageDirectory';
import { OitFltOpsHeader } from './Pages/FltOps/OitFltOpsHeader';
import { OitNotFound } from './Pages/OitNotFound';
import { OitFltOpsFooter } from './Pages/FltOps/OitFltOpsFooter';
import { OisLaptop } from './OisLaptop';
import { InternalKbdKeyEvent, OitSimvars } from './OitSimvarPublisher';
import { InteractionMode } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { OitFltOpsLoadingScreen } from './Pages/FltOps/OitFltOpsLoadingScreen';
import { OitFltOpsLogin } from './Pages/FltOps/OitFltOpsLogin';

interface OitFltOpsContainerProps {
  readonly bus: EventBus;
  readonly laptop: OisLaptop;
  readonly displayUnitRef: NodeReference<OitDisplayUnit>;
  readonly captOrFo: 'CAPT' | 'FO';
  readonly avncsOrFltOps: Subscribable<OisDomain>;
}

export abstract class OitFltOpsContainer extends DisplayComponent<OitFltOpsContainerProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subscriptions = [] as Subscription[];

  private readonly sub = this.props.bus.getSubscriber<OitSimvars>();

  #uiService = new OitUiService(this.props.captOrFo);

  get uiService() {
    return this.#uiService;
  }

  get laptop() {
    return this.props.laptop;
  }

  get laptopData() {
    return this.props.laptop.data;
  }

  public readonly hEventConsumer = this.props.bus.getSubscriber<InternalKbdKeyEvent>().on('kbdKeyEvent');
  public readonly interactionMode = Subject.create<InteractionMode>(InteractionMode.Touchscreen);

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly laptopPowered = ConsumerSubject.create(
    this.sub.on(this.props.captOrFo === 'CAPT' ? 'laptopCaptPowered' : 'laptopFoPowered'),
    false,
  );

  private readonly hideContent = MappedSubject.create(
    ([mode, powered]) => mode === 'nss-avncs' || !powered,
    this.props.avncsOrFltOps,
    this.laptopPowered,
  );

  private readonly hideContainer = this.props.avncsOrFltOps.map((mode) => mode === 'nss-avncs');

  private readonly activePageRef = FSComponent.createRef<HTMLDivElement>();

  private activePage: VNode = (<OitNotFound uiService={this.uiService} />);

  private readonly showChartsSimvar = `L:A32NX_OIS_${getDisplayIndex()}_SHOW_CHARTS`;
  private readonly showOfpSimvar = `L:A32NX_OIS_${getDisplayIndex()}_SHOW_OFP`;

  private overlaySub: MappedSubscribable<void> | undefined;

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.overlaySub = MappedSubject.create(
      ([uri, displayFailed, displayPowered, laptopPowered, operationMode]) => {
        // Activate EFB overlay if on charts or flt-folder page
        SimVar.SetSimVarValue(
          this.showChartsSimvar,
          SimVarValueType.Bool,
          uri.uri === 'flt-ops/charts' &&
            operationMode === 'flt-ops' &&
            !displayFailed &&
            displayPowered &&
            laptopPowered,
        );
        SimVar.SetSimVarValue(
          this.showOfpSimvar,
          SimVarValueType.Bool,
          uri.uri === 'flt-ops/flt-folder' &&
            operationMode === 'flt-ops' &&
            !displayFailed &&
            displayPowered &&
            laptopPowered,
        );
      },
      this.uiService.activeUri,
      this.props.displayUnitRef.instance.failed,
      this.props.displayUnitRef.instance.powered,
      this.laptopPowered,
      this.props.avncsOrFltOps,
    );

    this.subscriptions.push(
      this.uiService.activeUri.sub((uri) => {
        this.activeUriChanged(uri);
      }),
      this.overlaySub,
      this.laptopPowered,
      this.hideContent,
      this.hideContainer,
    );

    this.uiService.navigateTo('flt-ops');
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
      this.activePage = fltOpsPageForUrl(`${uri.sys}/${uri.page}`, this.props.bus, this.uiService, this);
    } else {
      this.activePage = fltOpsPageForUrl(`${uri.sys}`, this.props.bus, this.uiService, this);
    }

    FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());
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
        <div ref={this.topRef} class={{ 'oit-main': true, hidden: this.hideContainer }}>
          <div class={{ 'oit-page-container': true, hidden: this.hideContent }}>
            <OitFltOpsHeader uiService={this.uiService} avncsOrFltOps={this.props.avncsOrFltOps} />
            <div ref={this.activePageRef} class="mfd-navigator-container" />
            <OitFltOpsFooter uiService={this.uiService} avncsOrFltOps={this.props.avncsOrFltOps} />
          </div>
          <OitFltOpsLogin bus={this.props.bus} uiService={this.uiService} captOrFo={this.props.captOrFo} />
          <OitFltOpsLoadingScreen bus={this.props.bus} captOrFo={this.props.captOrFo} />
        </div>
      </>
    );
  }
}
