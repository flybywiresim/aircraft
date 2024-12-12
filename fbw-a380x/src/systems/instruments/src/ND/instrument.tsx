// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Clock,
  ConsumerSubject,
  FsBaseInstrument,
  FSComponent,
  FsInstrument,
  HEventPublisher,
  InstrumentBackplane,
  Subject,
  Subscribable,
  Wait,
} from '@microsoft/msfs-sdk';
import {
  A380EfisNdRangeValue,
  a380EfisRangeSettings,
  ArincEventBus,
  BtvSimvarPublisher,
  EfisNdMode,
  EfisSide,
  FcuBusPublisher,
  FcuSimVars,
  FmsOansSimvarPublisher,
} from '@flybywiresim/fbw-sdk';
import { NDComponent } from '@flybywiresim/navigation-display';
import {
  a380EfisZoomRangeSettings,
  A380EfisZoomRangeValue,
  Oanc,
  OansControlEvents,
  ZOOM_TRANSITION_TIME_MS,
} from '@flybywiresim/oanc';

import { ContextMenu, ContextMenuElement } from 'instruments/src/MFD/pages/common/ContextMenu';
import { MouseCursor } from 'instruments/src/MFD/pages/common/MouseCursor';
import { OansControlPanel } from './OansControlPanel';
import { FmsSymbolsPublisher } from './FmsSymbolsPublisher';
import { NDSimvarPublisher, NDSimvars } from './NDSimvarPublisher';
import { AdirsValueProvider } from '../MsfsAvionicsCommon/AdirsValueProvider';
import { FmsDataPublisher } from '../MsfsAvionicsCommon/providers/FmsDataPublisher';
import { VorBusPublisher } from '../MsfsAvionicsCommon/providers/VorBusPublisher';
import { TcasBusPublisher } from '../MsfsAvionicsCommon/providers/TcasBusPublisher';
import { FGDataPublisher } from '../MsfsAvionicsCommon/providers/FGDataPublisher';
import { NDControlEvents } from './NDControlEvents';
import { CdsDisplayUnit, DisplayUnitID, getDisplayIndex } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { EgpwcBusPublisher } from '../MsfsAvionicsCommon/providers/EgpwcBusPublisher';
import { DmcPublisher } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { FMBusPublisher } from '../MsfsAvionicsCommon/providers/FMBusPublisher';
import { RopRowOansPublisher } from '@flybywiresim/msfs-avionics-common';
import { SimplaneValueProvider } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';

import './style.scss';
import './oans-style.scss';
import { VerticalDisplayDummy } from 'instruments/src/ND/VerticalDisplay';

declare type MousePosition = {
  x: number;
  y: number;
};

class NDInstrument implements FsInstrument {
  public readonly instrument!: BaseInstrument;

  private readonly efisSide: EfisSide;

  private readonly bus: ArincEventBus;

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher: NDSimvarPublisher;

  private readonly fcuBusPublisher: FcuBusPublisher;

  private readonly fmsDataPublisher: FmsDataPublisher;

  private readonly fmsOansSimvarPublisher: FmsOansSimvarPublisher;

  private readonly ropRowOansPublisher: RopRowOansPublisher;

  private readonly btvSimvarPublisher: BtvSimvarPublisher;

  private readonly fgDataPublisher: FGDataPublisher;

  private readonly fmBusPublisher: FMBusPublisher;

  private readonly fmsSymbolsPublisher: FmsSymbolsPublisher;

  private readonly vorBusPublisher: VorBusPublisher;

  private readonly tcasBusPublisher: TcasBusPublisher;

  private readonly dmcPublisher: DmcPublisher;

  private readonly egpwcBusPublisher: EgpwcBusPublisher;

  private readonly hEventPublisher: HEventPublisher;

  private readonly adirsValueProvider: AdirsValueProvider<NDSimvars>;

  private readonly simplaneValueProvider: SimplaneValueProvider;

  private readonly clock: Clock;

  public readonly controlPanelRef = FSComponent.createRef<OansControlPanel>();

  private readonly contextMenuVisible = Subject.create(false);

  private readonly contextMenuX = Subject.create(0);

  private readonly contextMenuY = Subject.create(0);

  private readonly controlPanelVisible = Subject.create(false);

  private oansContextMenuItems: Subscribable<ContextMenuElement[]> = Subject.create([
    {
      name: 'ADD CROSS',
      disabled: true,
      onPressed: () =>
        console.log(
          `ADD CROSS at (${this.contextMenuPositionTriggered.get().x}, ${this.contextMenuPositionTriggered.get().y})`,
        ),
    },
    {
      name: 'ADD FLAG',
      disabled: true,
      onPressed: () =>
        console.log(
          `ADD FLAG at (${this.contextMenuPositionTriggered.get().x}, ${this.contextMenuPositionTriggered.get().y})`,
        ),
    },
    {
      name: 'MAP DATA',
      disabled: false,
      onPressed: () => {
        if (this.controlPanelRef.getOrDefault()) {
          this.controlPanelVisible.set(!this.controlPanelVisible.get());
        }
      },
    },
    {
      name: 'ERASE ALL CROSSES',
      disabled: true,
      onPressed: () => console.log('ERASE ALL CROSSES'),
    },
    {
      name: 'ERASE ALL FLAGS',
      disabled: true,
      onPressed: () => console.log('ERASE ALL FLAGS'),
    },
    {
      name: 'CENTER ON ACFT',
      disabled: false,
      onPressed: async () => {
        if (this.oansRef.getOrDefault() !== null) {
          await this.oansRef.instance.enablePanningTransitions();
          this.oansRef.instance.panOffsetX.set(0);
          this.oansRef.instance.panOffsetY.set(0);
          await Wait.awaitDelay(ZOOM_TRANSITION_TIME_MS);
          await this.oansRef.instance.disablePanningTransitions();
        }
      },
    },
  ]);

  private contextMenuRef = FSComponent.createRef<ContextMenu>();

  private contextMenuOpened = Subject.create<boolean>(false);

  private contextMenuPositionTriggered = Subject.create<MousePosition>({ x: 0, y: 0 });

  private mouseCursorRef = FSComponent.createRef<MouseCursor>();

  private topRef = FSComponent.createRef<HTMLDivElement>();

  private efisNdMode = EfisNdMode.ARC;

  private efisCpRange: A380EfisNdRangeValue = 10;

  private oansRef = FSComponent.createRef<Oanc<A380EfisZoomRangeValue>>();

  private cursorVisible = Subject.create<boolean>(true);

  private readonly oansNotAvailable = ConsumerSubject.create(null, true);

  private readonly oansShown = Subject.create(false);

  constructor() {
    const side: EfisSide = getDisplayIndex() === 1 ? 'L' : 'R';
    const stateSubject = Subject.create<'L' | 'R'>(side);
    this.efisSide = side;

    this.bus = new ArincEventBus();

    this.simVarPublisher = new NDSimvarPublisher(this.bus);
    this.fcuBusPublisher = new FcuBusPublisher(this.bus, side);
    this.fmsDataPublisher = new FmsDataPublisher(this.bus, stateSubject);
    this.fmsOansSimvarPublisher = new FmsOansSimvarPublisher(this.bus);
    this.ropRowOansPublisher = new RopRowOansPublisher(this.bus);
    this.btvSimvarPublisher = new BtvSimvarPublisher(this.bus);
    this.fgDataPublisher = new FGDataPublisher(this.bus);
    this.fmBusPublisher = new FMBusPublisher(this.bus);
    this.fmsSymbolsPublisher = new FmsSymbolsPublisher(this.bus, side);
    this.vorBusPublisher = new VorBusPublisher(this.bus);
    this.tcasBusPublisher = new TcasBusPublisher(this.bus);
    this.dmcPublisher = new DmcPublisher(this.bus);
    this.egpwcBusPublisher = new EgpwcBusPublisher(this.bus, side);
    this.hEventPublisher = new HEventPublisher(this.bus);

    this.adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher, side);
    this.simplaneValueProvider = new SimplaneValueProvider(this.bus);

    this.clock = new Clock(this.bus);

    this.backplane.addPublisher('ndSimVars', this.simVarPublisher);
    this.backplane.addPublisher('fcu', this.fcuBusPublisher);
    this.backplane.addPublisher('fms', this.fmsDataPublisher);
    this.backplane.addPublisher('fms-oans', this.fmsOansSimvarPublisher);
    this.backplane.addPublisher('rop-row-oans', this.ropRowOansPublisher);
    this.backplane.addPublisher('btv', this.btvSimvarPublisher);
    this.backplane.addPublisher('fg', this.fgDataPublisher);
    this.backplane.addPublisher('fms-arinc', this.fmBusPublisher);
    this.backplane.addPublisher('fms-symbols', this.fmsSymbolsPublisher);
    this.backplane.addPublisher('vor', this.vorBusPublisher);
    this.backplane.addPublisher('tcas', this.tcasBusPublisher);
    this.backplane.addPublisher('dmc', this.dmcPublisher);
    this.backplane.addPublisher('egpwc', this.egpwcBusPublisher);
    this.backplane.addPublisher('hEvent', this.hEventPublisher);

    this.backplane.addInstrument('Simplane', this.simplaneValueProvider);
    this.backplane.addInstrument('clock', this.clock);

    this.doInit();
  }

  private doInit(): void {
    this.backplane.init();

    this.adirsValueProvider.start();

    FSComponent.render(
      <div ref={this.topRef}>
        <CdsDisplayUnit
          bus={this.bus}
          displayUnitId={getDisplayIndex() === 1 ? DisplayUnitID.CaptNd : DisplayUnitID.FoNd}
          test={Subject.create(-1)}
          failed={Subject.create(false)}
        >
          <div
            class="oanc-container"
            style={{
              display: this.oansShown.map((v) => (v ? 'block' : 'none')),
            }}
          >
            {/* This flag is rendered by the CDS so it lives here instead of in the OANC */}
            <div
              class="oanc-flag-container amber FontLarge"
              style={{
                visibility: this.oansNotAvailable.map((v) => (v ? 'inherit' : 'hidden')),
              }}
            >
              NOT AVAIL
            </div>

            <div
              style={{
                display: this.oansNotAvailable.map((v) => (v ? 'none' : 'block')),
              }}
            >
              <Oanc
                bus={this.bus}
                side={this.efisSide}
                ref={this.oansRef}
                contextMenuVisible={this.contextMenuVisible}
                contextMenuX={this.contextMenuX}
                contextMenuY={this.contextMenuY}
                zoomValues={a380EfisZoomRangeSettings}
              />
            </div>
          </div>
          <NDComponent bus={this.bus} side={this.efisSide} rangeValues={a380EfisRangeSettings} />
          <ContextMenu
            ref={this.contextMenuRef}
            opened={this.contextMenuOpened}
            idPrefix="contextMenu"
            values={this.oansContextMenuItems}
          />
          <div
            style={{
              display: this.oansShown.map((v) => (v ? 'block' : 'none')),
            }}
          >
            <OansControlPanel
              ref={this.controlPanelRef}
              bus={this.bus}
              side={this.efisSide}
              isVisible={this.controlPanelVisible}
              togglePanel={() => this.controlPanelVisible.set(!this.controlPanelVisible.get())}
            />
          </div>
          <MouseCursor
            ref={this.mouseCursorRef}
            side={Subject.create(this.efisSide === 'L' ? 'CAPT' : 'FO')}
            visible={this.cursorVisible}
          />
          <VerticalDisplayDummy bus={this.bus} side={this.efisSide} />
        </CdsDisplayUnit>
      </div>,
      document.getElementById('ND_CONTENT'),
    );

    // Remove "instrument didn't load" text
    document.getElementById('ND_CONTENT')?.querySelector(':scope > h1')?.remove();

    this.topRef.instance.addEventListener('mousemove', (ev) => {
      if (this.oansRef.getOrDefault() && this.oansRef.instance.isPanning) {
        this.cursorVisible.set(false);
      } else {
        this.mouseCursorRef.instance.updatePosition(ev.clientX, ev.clientY);
        this.cursorVisible.set(true);
      }
    });

    if (this.oansRef?.instance?.labelContainerRef?.instance) {
      this.oansRef.instance.labelContainerRef.instance.addEventListener('contextmenu', (e) => {
        // Not firing right now, use double click
        this.contextMenuPositionTriggered.set({ x: e.clientX, y: e.clientY });
        this.contextMenuRef.instance.display(e.clientX, e.clientY);
      });

      this.oansRef.instance.labelContainerRef.instance.addEventListener('dblclick', (e) => {
        this.contextMenuPositionTriggered.set({ x: e.clientX, y: e.clientY });
        this.contextMenuRef.instance.display(e.clientX, e.clientY);
      });

      this.oansRef.instance.labelContainerRef.instance.addEventListener('click', () => {
        this.contextMenuRef.instance.hideMenu();
      });
    }

    const sub = this.bus.getSubscriber<FcuSimVars & OansControlEvents>();

    this.oansNotAvailable.setConsumer(sub.on('oansNotAvail'));

    sub
      .on('ndMode')
      .whenChanged()
      .handle((mode) => {
        this.efisNdMode = mode;
        this.updateNdOansVisibility();
      });

    sub
      .on('ndRangeSetting')
      .whenChanged()
      .handle((range) => {
        this.efisCpRange = a380EfisRangeSettings[range];
        this.updateNdOansVisibility();
      });
  }

  private updateNdOansVisibility() {
    if (this.efisCpRange === -1 && [EfisNdMode.PLAN, EfisNdMode.ARC, EfisNdMode.ROSE_NAV].includes(this.efisNdMode)) {
      this.bus.getPublisher<OansControlEvents>().pub('ndShowOans', true);
      this.oansShown.set(true);
    } else {
      this.bus.getPublisher<OansControlEvents>().pub('ndShowOans', false);
      this.oansShown.set(false);
    }
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    this.backplane.onUpdate();

    if (this.oansRef.getOrDefault()) {
      this.oansRef.instance.Update();
    }
  }

  public onInteractionEvent(args: string[]): void {
    if (args[0].endsWith(`A32NX_EFIS_${this.efisSide}_CHRONO_PUSHED`)) {
      this.bus.getPublisher<NDControlEvents>().pub('chrono_pushed', undefined);
    }

    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  onGameStateChanged(_oldState: GameState, _newState: GameState) {
    // noop
  }

  onFlightStart() {
    // noop
  }

  onSoundEnd(_soundEventId: Name_Z) {
    // noop
  }
}

class A380X_ND extends FsBaseInstrument<NDInstrument> {
  constructInstrument(): NDInstrument {
    return new NDInstrument();
  }

  get isInteractive(): boolean {
    return true;
  }

  get templateID(): string {
    return 'A380X_ND';
  }
}

registerInstrument('a380x-nd', A380X_ND);
