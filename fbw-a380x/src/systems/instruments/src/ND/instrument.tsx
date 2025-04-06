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
  MappedSubject,
  Subject,
} from '@microsoft/msfs-sdk';
import {
  A380EfisNdRangeValue,
  a380EfisRangeSettings,
  a380NdModeChange,
  a380NdRangeChange,
  a380TerrainThresholdPadValue,
  ArincEventBus,
  BtvSimvarPublisher,
  EfisNdMode,
  EfisSide,
  FcuBusPublisher,
  FcuSimVars,
  FmsOansSimvarPublisher,
} from '@flybywiresim/fbw-sdk';
import { NDComponent } from '@flybywiresim/navigation-display';
import { a380EfisZoomRangeSettings, A380EfisZoomRangeValue, Oanc, OansControlEvents } from '@flybywiresim/oanc';

import { ContextMenu, ContextMenuElement } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/ContextMenu';
import { MouseCursor, MouseCursorColor } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/MouseCursor';
import { EraseSymbolsDialog, OansControlPanel } from './OansControlPanel';
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
import { ResetPanelSimvarPublisher, ResetPanelSimvars } from '../MsfsAvionicsCommon/providers/ResetPanelPublisher';
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

  private readonly resetPanelPublisher: ResetPanelSimvarPublisher;

  private readonly adirsValueProvider: AdirsValueProvider<NDSimvars>;

  private readonly simplaneValueProvider: SimplaneValueProvider;

  private readonly clock: Clock;

  public readonly controlPanelRef = FSComponent.createRef<OansControlPanel>();

  private readonly contextMenuVisible = Subject.create(false);

  private readonly contextMenuX = Subject.create(0);

  private readonly contextMenuY = Subject.create(0);

  private readonly controlPanelVisible = Subject.create(false);

  private readonly eraseAllCrossesDialogVisible = Subject.create(false);

  private readonly eraseAllFlagsDialogVisible = Subject.create(false);

  private readonly eraseCrossIndex = Subject.create<number | null>(null);

  private readonly eraseFlagIndex = Subject.create<number | null>(null);

  private oansContextMenuItems = Subject.create(this.getOansContextMenu(false, false));

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
    this.resetPanelPublisher = new ResetPanelSimvarPublisher(this.bus);

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
    this.backplane.addPublisher('resetPanel', this.resetPanelPublisher);

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
          <NDComponent
            bus={this.bus}
            side={this.efisSide}
            rangeValues={a380EfisRangeSettings}
            terrainThresholdPaddingText={a380TerrainThresholdPadValue}
            rangeChangeMessage={a380NdRangeChange}
            modeChangeMessage={a380NdModeChange}
            mapOptions={{ waypointBoxing: true }}
          />
          <ContextMenu
            ref={this.contextMenuRef}
            opened={this.contextMenuOpened}
            idPrefix="contextMenu"
            values={this.oansContextMenuItems}
          />
          <EraseSymbolsDialog
            visible={MappedSubject.create(
              ([crosses, flags, oans]) => crosses && !flags && oans,
              this.eraseAllCrossesDialogVisible,
              this.eraseAllFlagsDialogVisible,
              this.oansShown,
            )}
            confirmAction={() =>
              this.bus.getPublisher<OansControlEvents>().pub('oans_erase_all_crosses', true, true, false)
            }
            hideDialog={() => this.eraseAllCrossesDialogVisible.set(false)}
            isCross={true}
          />
          <EraseSymbolsDialog
            visible={MappedSubject.create(
              ([crosses, flags, oans]) => !crosses && flags && oans,
              this.eraseAllCrossesDialogVisible,
              this.eraseAllFlagsDialogVisible,
              this.oansShown,
            )}
            confirmAction={() =>
              this.bus.getPublisher<OansControlEvents>().pub('oans_erase_all_flags', true, true, false)
            }
            hideDialog={() => this.eraseAllFlagsDialogVisible.set(false)}
            isCross={false}
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
            color={this.oansShown.map((it) => (it ? MouseCursorColor.Magenta : MouseCursorColor.Yellow))}
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
      this.oansRef.instance.labelContainerRef.instance.addEventListener('dblclick', (e) => {
        this.bus
          .getPublisher<OansControlEvents>()
          .pub('oans_query_symbols_at_cursor', { side: this.efisSide, cursorPosition: [e.clientX, e.clientY] });
        this.contextMenuPositionTriggered.set({ x: e.clientX, y: e.clientY });
        this.contextMenuRef.instance.display(e.clientX, e.clientY);
      });

      this.oansRef.instance.labelContainerRef.instance.addEventListener('click', () => {
        this.contextMenuRef.instance.hideMenu();
      });
    }

    const sub = this.bus.getSubscriber<FcuSimVars & OansControlEvents & ResetPanelSimvars>();

    this.oansNotAvailable.setConsumer(sub.on('oans_not_avail'));

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

    sub.on('oans_answer_symbols_at_cursor').handle((symbols) => {
      if (symbols.side === this.efisSide) {
        this.eraseCrossIndex.set(symbols.cross);
        this.eraseFlagIndex.set(symbols.flag);
        this.oansContextMenuItems.set(this.getOansContextMenu(symbols.cross !== null, symbols.flag !== null));
      }
    });
  }

  private updateNdOansVisibility() {
    if (this.efisCpRange === -1 && [EfisNdMode.PLAN, EfisNdMode.ARC, EfisNdMode.ROSE_NAV].includes(this.efisNdMode)) {
      this.bus.getPublisher<OansControlEvents>().pub('nd_show_oans', { side: this.efisSide, show: true }, true, false);
      this.oansShown.set(true);
    } else {
      this.bus.getPublisher<OansControlEvents>().pub('nd_show_oans', { side: this.efisSide, show: false }, true, false);
      this.oansShown.set(false);
    }
  }

  getOansContextMenu(hasCross: boolean, hasFlag: boolean): ContextMenuElement[] {
    const crossIndex = this.eraseCrossIndex.get();
    const flagIndex = this.eraseFlagIndex.get();
    return [
      {
        name: hasCross ? 'DELETE CROSS' : 'ADD CROSS',
        disabled: false,
        onPressed: () =>
          hasCross && crossIndex !== null
            ? this.bus.getPublisher<OansControlEvents>().pub('oans_erase_cross_id', crossIndex)
            : this.bus
                .getPublisher<OansControlEvents>()
                .pub('oans_add_cross_at_cursor', [
                  this.contextMenuPositionTriggered.get().x,
                  this.contextMenuPositionTriggered.get().y,
                ]),
      },
      {
        name: hasFlag ? 'DELETE FLAG' : 'ADD FLAG',
        disabled: false,
        onPressed: () =>
          hasFlag && flagIndex !== null
            ? this.bus.getPublisher<OansControlEvents>().pub('oans_erase_flag_id', flagIndex)
            : this.bus
                .getPublisher<OansControlEvents>()
                .pub('oans_add_flag_at_cursor', [
                  this.contextMenuPositionTriggered.get().x,
                  this.contextMenuPositionTriggered.get().y,
                ]),
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
        disabled: false,
        onPressed: () => this.eraseAllCrossesDialogVisible.set(true),
      },
      {
        name: 'ERASE ALL FLAGS',
        disabled: false,
        onPressed: () => this.eraseAllFlagsDialogVisible.set(true),
      },
      {
        name: 'CENTER ON ACFT',
        disabled: false,
        onPressed: async () => {
          this.bus.getPublisher<OansControlEvents>().pub('oans_center_on_acft', true, true, false);
        },
      },
    ];
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
