//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
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
import { OitFltOpsHeader } from './Pages/flt-ops/OitFltOpsHeader';
import { OitNotFound } from './Pages/OitNotFound';
import { OitFltOpsFooter } from './Pages/flt-ops/OitFltOpsFooter';
import { OisLaptop } from './OisLaptop';
import { InternalKbdKeyEvent } from './OitSimvarPublisher';
import { InteractionMode } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';

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

  #uiService = new OitUiService(this.props.captOrFo, this.props.bus);

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

  // Don't add this to the subscriptions, as it is used while container is hidden.
  private readonly hideContainer = this.props.avncsOrFltOps.map((mode) => mode === 'nss-avncs');

  private readonly activePageRef = FSComponent.createRef<HTMLDivElement>();

  private activePage: VNode = (<OitNotFound uiService={this.uiService} />);

  private readonly showChartsSimvar = `L:A32NX_OIS_${getDisplayIndex()}_SHOW_CHARTS`;
  private readonly showOfpSimvar = `L:A32NX_OIS_${getDisplayIndex()}_SHOW_OFP`;

  // Don't add this to the subscriptions, as it is used while container is hidden.
  private overlaySub: MappedSubscribable<void> | undefined = undefined;

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

    this.overlaySub = MappedSubject.create(
      ([uri, displayFailed, displayPowered, operationMode]) => {
        // Activate EFB overlay if on charts or flt-folder page
        SimVar.SetSimVarValue(
          this.showChartsSimvar,
          SimVarValueType.Bool,
          uri.uri === 'flt-ops/charts' && operationMode === 'flt-ops' && !displayFailed && displayPowered,
        );
        SimVar.SetSimVarValue(
          this.showOfpSimvar,
          SimVarValueType.Bool,
          uri.uri === 'flt-ops/flt-folder' && operationMode === 'flt-ops' && !displayFailed && displayPowered,
        );
      },
      this.uiService.activeUri,
      this.props.displayUnitRef.instance.failed,
      this.props.displayUnitRef.instance.powered,
      this.props.avncsOrFltOps,
    );

    this.subscriptions.push(
      this.uiService.activeUri.sub((uri) => {
        this.activeUriChanged(uri);
      }),
    );

    this.uiService.navigateTo('flt-ops/sts');
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

    this.hideContainer.destroy();
    this.overlaySub?.destroy();

    super.destroy();
  }

  render(): VNode {
    return (
      <div ref={this.topRef} class={{ 'oit-main': true, hidden: this.hideContainer }}>
        <OitFltOpsHeader uiService={this.uiService} avncsOrFltOps={this.props.avncsOrFltOps} />
        <div ref={this.activePageRef} class="mfd-navigator-container" />
        <OitFltOpsFooter uiService={this.uiService} avncsOrFltOps={this.props.avncsOrFltOps} />
      </div>
    );
  }
}
