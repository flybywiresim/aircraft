//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './style.scss';
import { InternalKbdKeyEvent } from './OitSimvarPublisher';
import { OitUiService, OitUriInformation } from './OitUiService';
import { OitNotFound } from './Pages/OitNotFound';
import { pageForUrl } from './OitPageDirectory';
import { OitHeader } from './OitHeader';
import { OitFooter } from './OitFooter';
import { getDisplayIndex, OitDisplayUnit, OitDisplayUnitID } from './OitDisplayUnit';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { OisLaptop } from './OisLaptop';
import { InteractionMode } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';

export interface AbstractOitPageProps extends ComponentProps {
  bus: EventBus;
  oit: OIT;
}

export type OisOperationMode = 'nss' | 'flt-ops';

export interface OitProps {
  readonly bus: EventBus;
  readonly instrument: BaseInstrument;
  readonly captOrFo: 'CAPT' | 'FO';
  readonly failuresConsumer: FailuresConsumer;
  readonly laptop: OisLaptop;
}

export class OIT extends DisplayComponent<OitProps> {
  private readonly subscriptions: Subscription[] = [];

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

  public readonly operationMode = Subject.create<OisOperationMode>('flt-ops');

  public readonly hEventConsumer = this.props.bus.getSubscriber<InternalKbdKeyEvent>().on('kbdKeyEvent');

  public readonly interactionMode = Subject.create<InteractionMode>(InteractionMode.Touchscreen);

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly displayUnitRef = FSComponent.createRef<OitDisplayUnit>();

  private readonly activePageRef = FSComponent.createRef<HTMLDivElement>();

  private activePage: VNode = (<OitNotFound bus={this.props.bus} oit={this} />);

  private readonly showChartsSimvar = `L:A32NX_OIS_${getDisplayIndex()}_SHOW_CHARTS`;
  private readonly showOfpSimvar = `L:A32NX_OIS_${getDisplayIndex()}_SHOW_OFP`;

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.uiService.activeUri.sub((uri) => {
        this.activeUriChanged(uri);
      }),
      MappedSubject.create(
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
        this.displayUnitRef.instance.failed,
        this.displayUnitRef.instance.powered,
        this.operationMode,
      ),
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
      this.activePage = pageForUrl(`${uri.sys}/${uri.page}`, this.props.bus, this);
    } else {
      this.activePage = pageForUrl(`${uri.sys}`, this.props.bus, this);
    }

    FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode | null {
    return (
      <OitDisplayUnit
        ref={this.displayUnitRef}
        bus={this.props.bus}
        displayUnitId={this.props.captOrFo === 'CAPT' ? OitDisplayUnitID.CaptOit : OitDisplayUnitID.FoOit}
        failuresConsumer={this.props.failuresConsumer}
        nssOrFltOps={this.operationMode}
      >
        <div ref={this.topRef} class="oit-main">
          <OitHeader uiService={this.uiService} oit={this} />
          <div ref={this.activePageRef} class="mfd-navigator-container" />
          <OitFooter uiService={this.uiService} oit={this} />
        </div>
      </OitDisplayUnit>
    );
  }
}
