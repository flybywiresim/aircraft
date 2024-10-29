// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  FSComponent,
  HEventPublisher,
  InstrumentBackplane,
  Subject,
  SubscribableMapFunctions,
  Wait,
} from '@microsoft/msfs-sdk';
import {
  A320EfisZoomRangeValue,
  ContextMenuItemData,
  OANC_RENDER_HEIGHT,
  OANC_RENDER_WIDTH,
  Oanc,
  ZOOM_TRANSITION_TIME_MS,
  a320EfisZoomRangeSettings,
} from '@flybywiresim/oanc';
import { EfisSide, FcuBusPublisher } from '@flybywiresim/fbw-sdk';
import { ContextMenu } from './Components/ContextMenu';
import { getDisplayIndex } from '../MsfsAvionicsCommon/displayUnit';
import { ControlPanel } from './Components/ControlPanel';

import './styles.scss';

class A32NX_OANC extends BaseInstrument {
  private readonly efisSide: EfisSide;

  private bus: EventBus;

  private readonly backplane = new InstrumentBackplane();

  private readonly fcuBusPublisher: FcuBusPublisher;

  private readonly hEventPublisher: HEventPublisher;

  /**
   * "mainmenu" = 0
   * "loading" = 1
   * "briefing" = 2
   * "ingame" = 3
   */
  private gameState = 0;

  private oancRef = FSComponent.createRef<Oanc<A320EfisZoomRangeValue>>();

  public readonly controlPanelRef = FSComponent.createRef<ControlPanel>();

  private readonly contextMenuItems: ContextMenuItemData[] = [
    { name: 'ADD CROSS', disabled: true },
    { name: 'ADD FLAG', disabled: true },
    {
      name: 'MENU',
      onPressed: () => {
        this.controlPanelVisible.set(!this.controlPanelVisible.get());
        this.contextMenuVisible.set(false);
      },
    },
    { name: 'ERASE ALL CROSSES', disabled: true },
    { name: 'ERASE ALL FLAGS', disabled: true },
    {
      name: 'CENTER ON ACFT',
      disabled:
        this.oancRef.getOrDefault() !== null
          ? this.oancRef.instance.aircraftWithinAirport.map(SubscribableMapFunctions.not())
          : true,
      onPressed: async () => {
        if (this.oancRef.getOrDefault() !== null) {
          await this.oancRef.instance.enablePanningTransitions();
          this.oancRef.instance.panOffsetX.set(0);
          this.oancRef.instance.panOffsetY.set(0);
          await Wait.awaitDelay(ZOOM_TRANSITION_TIME_MS);
          await this.oancRef.instance.disablePanningTransitions();
        }
      },
    },
  ];

  private readonly contextMenuVisible = Subject.create(false);

  private readonly contextMenuX = Subject.create(0);

  private readonly contextMenuY = Subject.create(0);

  private readonly controlPanelVisible = Subject.create(false);

  private readonly oansMessageScreenRef = FSComponent.createRef<HTMLDivElement>();

  constructor() {
    super();
    this.efisSide = getDisplayIndex() === 1 ? 'L' : 'R';
    this.bus = new EventBus();
    this.fcuBusPublisher = new FcuBusPublisher(this.bus, 'L');
    this.hEventPublisher = new HEventPublisher(this.bus);
  }

  get templateID(): string {
    return 'A32NX_OANC';
  }

  get isInteractive(): boolean {
    return true;
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.backplane.addPublisher('fcu', this.fcuBusPublisher);
    this.backplane.addPublisher('hEvent', this.hEventPublisher);

    this.backplane.init();

    FSComponent.render(
      <div
        class="oanc-container"
        style={`width: ${OANC_RENDER_WIDTH}px; height: ${OANC_RENDER_HEIGHT}px; overflow: hidden`}
      >
        <div ref={this.oansMessageScreenRef} class="oanc-message-screen">
          PLEASE WAIT
        </div>
        <Oanc
          bus={this.bus}
          side={this.efisSide}
          ref={this.oancRef}
          contextMenuVisible={this.contextMenuVisible}
          contextMenuItems={this.contextMenuItems}
          contextMenuX={this.contextMenuX}
          contextMenuY={this.contextMenuY}
          messageScreenRef={this.oansMessageScreenRef}
          zoomValues={a320EfisZoomRangeSettings}
        />
        <ControlPanel
          ref={this.controlPanelRef}
          amdbClient={this.oancRef.instance.amdbClient}
          isVisible={this.controlPanelVisible}
          onSelectAirport={(icao) => this.oancRef.instance.loadAirportMap(icao)}
          closePanel={() => this.controlPanelVisible.set(false)}
          onZoomIn={() => this.oancRef.instance.handleZoomIn()}
          onZoomOut={() => this.oancRef.instance.handleZoomOut()}
        />
        <ContextMenu
          isVisible={this.contextMenuVisible}
          x={this.contextMenuX}
          y={this.contextMenuY}
          items={this.contextMenuItems}
          closeMenu={() => this.contextMenuVisible.set(false)}
        />
      </div>,
      document.getElementById('OANC_CONTENT'),
    );

    // Remove "instrument didn't load" text
    document.getElementById('OANC_CONTENT').querySelector(':scope > h1').remove();
  }

  public Update(): void {
    super.Update();

    if (this.gameState !== 3) {
      const gamestate = this.getGameState();
      if (gamestate === 3) {
        this.backplane.onUpdate();
      }
      this.gameState = gamestate;
    } else {
      this.backplane.onUpdate();
    }

    if (this.oancRef.getOrDefault()) {
      this.oancRef.instance.Update();
    }
  }
}

registerInstrument('a32nx-oanc', A32NX_OANC);
