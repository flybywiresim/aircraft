//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ComponentProps,
  Consumer,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  HEvent,
  MappedSubject,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { DatabaseItem, Fix, Waypoint } from '@flybywiresim/fbw-sdk';

import { MouseCursor } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/MouseCursor';

import { MfdMsgList } from 'instruments/src/MFD/pages/FMS/MfdMsgList';
import { ActiveUriInformation, MfdUiService } from 'instruments/src/MFD/pages/common/MfdUiService';
import { MfdFmsFplnDuplicateNames } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnDuplicateNames';
import { headerForSystem, pageForUrl } from 'instruments/src/MFD/MfdPageDirectory';
import { FmsDisplayInterface } from '@fmgc/flightplanning/interface/FmsDisplayInterface';
import { FmsErrorType } from '@fmgc/FmsError';
import { FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { InternalKccuKeyEvent, MfdSimvars } from './shared/MFDSimvarPublisher';
import { MfdFmsPageNotAvail } from 'instruments/src/MFD/pages/FMS/MfdFmsPageNotAvail';

import './pages/common/style.scss';
import { InteractionMode } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';

export const getDisplayIndex = () => {
  const url = document.getElementsByTagName('a380x-mfd')[0].getAttribute('url');
  return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

export interface AbstractMfdPageProps extends ComponentProps {
  pageTitle?: string;
  bus: EventBus;
  mfd: FmsDisplayInterface & MfdDisplayInterface;
  fmcService: FmcServiceInterface;
}

interface MfdComponentProps extends ComponentProps {
  bus: EventBus;
  fmcService: FmcServiceInterface;
  captOrFo: 'CAPT' | 'FO';
}

// TODO integrate in fmgc's DisplayInterface
export interface MfdDisplayInterface {
  get uiService(): MfdUiService;

  hEventConsumer: Consumer<string>;

  interactionMode: Subscribable<InteractionMode>;

  openMessageList(): void;

  get positionMonitorFix(): Fix | null;

  set positionMonitorFix(fix: Fix | null);
}

export class MfdComponent
  extends DisplayComponent<MfdComponentProps>
  implements FmsDisplayInterface, MfdDisplayInterface
{
  private readonly subs: Subscription[] = [];

  private readonly sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

  #uiService = new MfdUiService(this.props.captOrFo, this.props.bus);

  get uiService() {
    return this.#uiService;
  }

  public readonly hEventConsumer = this.props.bus.getSubscriber<InternalKccuKeyEvent>().on('kccuKeyEvent');

  public readonly interactionMode = Subject.create<InteractionMode>(InteractionMode.Touchscreen);

  private readonly fmsDataKnob = ConsumerSubject.create(this.sub.on('fmsDataKnob').whenChanged(), 0);

  private readonly fmcAIsHealthy = ConsumerSubject.create(this.sub.on('fmcAIsHealthy').whenChanged(), true);

  private readonly fmcBIsHealthy = ConsumerSubject.create(this.sub.on('fmcBIsHealthy').whenChanged(), true);

  private readonly activeFmsSource = MappedSubject.create(
    ([knob, a, b]) => {
      const capt = a ? 'FMS 1' : 'FMS 1-C';
      const fo = b ? 'FMS 2' : 'FMS 2-C';

      switch (knob) {
        case 0:
          return fo;
        case 1:
          return this.props.captOrFo === 'CAPT' ? capt : fo;
        case 2:
          return capt;
        default:
          return 'FMS 1';
      }
    },
    this.fmsDataKnob,
    this.fmcAIsHealthy,
    this.fmcBIsHealthy,
  );

  private readonly mouseCursorRef = FSComponent.createRef<MouseCursor>();

  private readonly topRef = FSComponent.createRef<HTMLDivElement>();

  private readonly activePageRef = FSComponent.createRef<HTMLDivElement>();

  private activePage: VNode | null = null;

  private readonly activeHeaderRef = FSComponent.createRef<HTMLDivElement>();

  private activeHeader: VNode | null = null;

  private readonly messageListOpened = Subject.create<boolean>(false);

  private readonly duplicateNamesOpened = Subject.create<boolean>(false);

  private readonly duplicateNamesRef = FSComponent.createRef<MfdFmsFplnDuplicateNames>();

  private posMonitorFix: Fix | null = null;

  get positionMonitorFix(): Fix | null {
    return this.posMonitorFix;
  }

  set positionMonitorFix(fix: Fix | null) {
    this.posMonitorFix = fix;
  }

  // Necessary to enable mouse interaction
  get isInteractive(): boolean {
    return true;
  }

  public openMessageList() {
    this.messageListOpened.set(true);
  }

  /**
   * Called when a flight plan uplink is in progress
   */
  onUplinkInProgress() {
    this.props.fmcService.master?.onUplinkInProgress();
  }

  /**
   * Called when a flight plan uplink is done
   */
  onUplinkDone() {
    this.props.fmcService.master?.onUplinkDone();
  }

  /**
   * Calling this function with a message should display the message in the FMS' message area,
   * such as the scratchpad or a dedicated error line. The FMS error type given should be translated
   * into the appropriate message for the UI
   *
   * @param errorType the message to show
   */
  showFmsErrorMessage(errorType: FmsErrorType) {
    this.props.fmcService.master?.showFmsErrorMessage(errorType);
  }

  /**
   * Calling this function with an array of items should display a UI allowing the user to
   * select the right item from a list of duplicates, and return the one chosen by the user or
   * `undefined` if the operation is cancelled.
   *
   * @param items the items to de-duplicate
   *
   * @returns the chosen item
   */
  async deduplicateFacilities<T extends DatabaseItem<any>>(items: T[]): Promise<T | undefined> {
    if (items.length > 1) {
      return new Promise((resolve) => {
        this.duplicateNamesRef.instance.deduplicateFacilities(items, resolve);
      });
    }
    return items[0];
  }

  /**
   * Calling this function should show a UI allowing the pilot to create a new waypoint with the ident
   * provided
   *
   * @param ident the identifier the waypoint should have
   *
   * @returns the created waypoint, or `undefined` if the operation is cancelled
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createNewWaypoint(ident: string): Promise<Waypoint | undefined> {
    // TODO navigate to DATA/NAVAID --> PILOT STORED NAVAIDS --> NEW NAVAID
    return undefined;
  }

  /**
   * Checks whether a waypoint is currently in use
   * @param waypoint the waypoint to look for
   */
  async isWaypointInUse(waypoint: Waypoint): Promise<boolean> {
    return this.props.fmcService.master?.isWaypointInUse(waypoint) ?? false;
  }

  public async onAfterRender(node: VNode): Promise<void> {
    super.onAfterRender(node);

    const isCaptainSide = this.props.captOrFo === 'CAPT';

    this.subs.push(
      this.props.bus
        .getSubscriber<MfdSimvars>()
        .on(isCaptainSide ? 'kccuOnL' : 'kccuOnR')
        .whenChanged()
        .handle((it) => this.interactionMode.set(it ? InteractionMode.Kccu : InteractionMode.Touchscreen)),
    );

    this.subs.push(
      this.props.bus
        .getSubscriber<HEvent>()
        .on('hEvent')
        .handle((eventName) => {
          this.props.fmcService.master?.acInterface.onEvent(eventName);

          if (eventName.startsWith(this.props.captOrFo === 'CAPT' ? 'A32NX_KCCU_L' : 'A32NX_KCCU_R')) {
            const key = eventName.substring(13);

            this.props.bus.getPublisher<InternalKccuKeyEvent>().pub('kccuKeyEvent', key, false);

            switch (key) {
              case 'DIR':
                this.uiService.navigateTo('fms/active/f-pln-direct-to');
                break;
              case 'PERF':
                this.uiService.navigateTo('fms/active/perf');
                break;
              case 'INIT':
                this.uiService.navigateTo('fms/active/init');
                break;
              case 'NAVAID':
                this.uiService.navigateTo('fms/position/navaids');
                break;
              case 'MAILBOX': // Move cursor to SD mail box
                break;
              case 'FPLN':
                this.uiService.navigateTo('fms/active/f-pln/top');
                break;
              case 'DEST':
                this.uiService.navigateTo('fms/active/f-pln/dest');
                break;
              case 'SECINDEX':
                this.uiService.navigateTo('fms/sec/index');
                break;
              case 'SURV':
                this.uiService.navigateTo('surv/controls');
                break;
              case 'ATCCOM':
                this.uiService.navigateTo('atccom/connect');
                break;
              case 'ND': // Move cursor to ND
                break;
              case 'CLRINFO':
                this.props.fmcService.master?.clearLatestFmsErrorMessage();
                break;
              default:
                break;
            }
          }
        }),
    );

    this.subs.push(
      this.uiService.activeUri.sub((uri) => {
        this.activeUriChanged(uri);
      }),
    );

    this.topRef.instance.addEventListener('mousemove', this.onMouseMoveHandler);

    this.subs.push(this.fmsDataKnob, this.fmcAIsHealthy, this.fmcBIsHealthy, this.activeFmsSource);
  }

  private onMouseMove(ev: MouseEvent) {
    this.mouseCursorRef.getOrDefault()?.updatePosition(ev.clientX, ev.clientY);
  }

  private onMouseMoveHandler = this.onMouseMove.bind(this);

  private activeUriChanged(uri: ActiveUriInformation) {
    if (!this.props.fmcService.master) {
      return;
    }

    // Remove and destroy old header
    if (this.activeHeaderRef.getOrDefault()) {
      while (this.activeHeaderRef.instance.firstChild) {
        this.activeHeaderRef.instance.removeChild(this.activeHeaderRef.instance.firstChild);
      }
    }

    if (this.activeHeader && this.activeHeader.instance instanceof DisplayComponent) {
      this.activeHeader.instance.destroy();
    }

    // Remove and destroy old MFD page
    if (this.activePageRef.getOrDefault()) {
      while (this.activePageRef.instance.firstChild) {
        this.activePageRef.instance.removeChild(this.activePageRef.instance.firstChild);
      }
    }
    if (this.activePage && this.activePage.instance instanceof DisplayComponent) {
      this.activePage.instance.destroy();
    }

    // Different systems use different navigation bars
    this.activeHeader = headerForSystem(
      uri.sys,
      this,
      this.props.fmcService.master.fmgc.data.atcCallsign,
      this.activeFmsSource,
      this.uiService,
    );

    // Mapping from URL to page component
    if (uri.page) {
      this.activePage = pageForUrl(
        `${uri.sys}/${uri.category}/${uri.page}`,
        this.props.bus,
        this,
        this.props.fmcService,
      );
    } else {
      this.activePage = pageForUrl(`${uri.sys}/${uri.category}`, this.props.bus, this, this.props.fmcService);
    }

    FSComponent.render(this.activeHeader, this.activeHeaderRef.getOrDefault());
    FSComponent.render(this.activePage, this.activePageRef?.getOrDefault());

    SimVar.SetSimVarValue(`L:A380X_MFD_${this.props.captOrFo === 'CAPT' ? 'L' : 'R'}_ACTIVE_PAGE`, 'string', uri.uri);
  }

  fmcChanged() {
    // Will be called if the FMC providing all the data has changed.
  }

  destroy(): void {
    this.topRef.getOrDefault()?.removeEventListener('mousemove', this.onMouseMoveHandler);
    this.mouseCursorRef.getOrDefault()?.destroy();
    this.duplicateNamesRef.getOrDefault()?.destroy();

    for (const s of this.subs) {
      s.destroy();
    }

    this.mouseCursorRef.instance.destroy();
    this.duplicateNamesRef.instance.destroy();

    if (this.activeHeader && this.activeHeader.instance instanceof DisplayComponent) {
      this.activeHeader.instance.destroy();
    }
    if (this.activePage && this.activePage.instance instanceof DisplayComponent) {
      this.activePage.instance.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <CdsDisplayUnit
        bus={this.props.bus}
        displayUnitId={this.props.captOrFo === 'CAPT' ? DisplayUnitID.CaptMfd : DisplayUnitID.FoMfd}
      >
        <div class="mfd-main" ref={this.topRef}>
          <div ref={this.activeHeaderRef} />
          <MfdFmsPageNotAvail
            bus={this.props.bus}
            fmcService={this.props.fmcService}
            captOrFo={this.props.captOrFo}
            requestedSystem={this.uiService.activeUri.map((uri) => uri.sys)}
          />
          <MfdMsgList visible={this.messageListOpened} bus={this.props.bus} fmcService={this.props.fmcService} />
          <MfdFmsFplnDuplicateNames
            ref={this.duplicateNamesRef}
            visible={this.duplicateNamesOpened}
            fmcService={this.props.fmcService}
          />
          <div ref={this.activePageRef} class="mfd-navigator-container" />
          <MouseCursor isDoubleScreenMfd side={Subject.create(this.props.captOrFo)} ref={this.mouseCursorRef} />
        </div>
      </CdsDisplayUnit>
    );
  }
}
