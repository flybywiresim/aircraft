// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Clock,
  FsBaseInstrument,
  FSComponent,
  FsInstrument,
  HEventPublisher,
  InstrumentBackplane,
  Subject,
} from '@microsoft/msfs-sdk';
import { a320EfisRangeSettings, a320TerrainThresholdPadValue, ArincEventBus, EfisSide } from '@flybywiresim/fbw-sdk';
import { NDComponent } from '@flybywiresim/navigation-display';

import { NDSimvarPublisher, NDSimvars } from './NDSimvarPublisher';
import { AdirsValueProvider } from '../MsfsAvionicsCommon/AdirsValueProvider';
import { FmsDataPublisher } from '../MsfsAvionicsCommon/providers/FmsDataPublisher';
import { FmsSymbolsPublisher } from './FmsSymbolsPublisher';
import { VorBusPublisher } from '../MsfsAvionicsCommon/providers/VorBusPublisher';
import { TcasBusPublisher } from '../MsfsAvionicsCommon/providers/TcasBusPublisher';
import { FGDataPublisher } from '../MsfsAvionicsCommon/providers/FGDataPublisher';
import { NDControlEvents } from './NDControlEvents';
import { DisplayUnit, getDisplayIndex } from '../MsfsAvionicsCommon/displayUnit';
import { EgpwcBusPublisher } from '../MsfsAvionicsCommon/providers/EgpwcBusPublisher';
import { DmcPublisher } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { FMBusPublisher } from '../MsfsAvionicsCommon/providers/FMBusPublisher';
import { FcuBusPublisher } from '../MsfsAvionicsCommon/providers/FcuBusPublisher';

import './style.scss';

class NDInstrument implements FsInstrument {
  public readonly instrument: BaseInstrument;

  private readonly efisSide: EfisSide;

  private readonly bus: ArincEventBus;

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher: NDSimvarPublisher;

  private readonly fcuBusPublisher: FcuBusPublisher;

  private readonly fmsDataPublisher: FmsDataPublisher;

  private readonly fgDataPublisher: FGDataPublisher;

  private readonly fmBusPublisher: FMBusPublisher;

  private readonly fmsSymbolsPublisher: FmsSymbolsPublisher;

  private readonly vorBusPublisher: VorBusPublisher;

  private readonly tcasBusPublisher: TcasBusPublisher;

  private readonly dmcPublisher: DmcPublisher;

  private readonly egpwcBusPublisher: EgpwcBusPublisher;

  private readonly hEventPublisher;

  private readonly adirsValueProvider: AdirsValueProvider<NDSimvars>;

  private readonly clock: Clock;

  private displayBrightness = Subject.create(0);

  private displayFailed = Subject.create(false);

  private displayPowered = Subject.create(false);

  constructor() {
    const side: EfisSide = getDisplayIndex() === 1 ? 'L' : 'R';
    const stateSubject = Subject.create<'L' | 'R'>(side);
    this.efisSide = side;

    this.bus = new ArincEventBus();

    this.simVarPublisher = new NDSimvarPublisher(this.bus);
    this.fcuBusPublisher = new FcuBusPublisher(this.bus, side);
    this.fmsDataPublisher = new FmsDataPublisher(this.bus, stateSubject);
    this.fgDataPublisher = new FGDataPublisher(this.bus);
    this.fmBusPublisher = new FMBusPublisher(this.bus);
    this.fmsSymbolsPublisher = new FmsSymbolsPublisher(this.bus, side);
    this.vorBusPublisher = new VorBusPublisher(this.bus);
    this.tcasBusPublisher = new TcasBusPublisher(this.bus);
    this.dmcPublisher = new DmcPublisher(this.bus);
    this.egpwcBusPublisher = new EgpwcBusPublisher(this.bus, side);
    this.hEventPublisher = new HEventPublisher(this.bus);

    this.adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher, side);

    this.clock = new Clock(this.bus);

    this.backplane.addPublisher('ndSimVars', this.simVarPublisher);
    this.backplane.addPublisher('fcu', this.fcuBusPublisher);
    this.backplane.addPublisher('fms', this.fmsDataPublisher);
    this.backplane.addPublisher('fg', this.fgDataPublisher);
    this.backplane.addPublisher('fms-arinc', this.fmBusPublisher);
    this.backplane.addPublisher('fms-symbols', this.fmsSymbolsPublisher);
    this.backplane.addPublisher('vor', this.vorBusPublisher);
    this.backplane.addPublisher('tcas', this.tcasBusPublisher);
    this.backplane.addPublisher('dmc', this.dmcPublisher);
    this.backplane.addPublisher('egpwc', this.egpwcBusPublisher);

    this.backplane.addInstrument('clock', this.clock);

    this.doInit();
  }

  private doInit(): void {
    this.backplane.init();

    this.adirsValueProvider.start();

    const sub = this.bus.getSubscriber<NDSimvars>();

    const isCaptainSide = getDisplayIndex() === 1;

    sub
      .on(isCaptainSide ? 'potentiometerCaptain' : 'potentiometerFo')
      .whenChanged()
      .handle((value) => {
        this.displayBrightness.set(value);
      });

    sub
      .on(isCaptainSide ? 'elec' : 'elecFo')
      .whenChanged()
      .handle((value) => {
        this.displayPowered.set(value);
      });

    FSComponent.render(
      <DisplayUnit
        bus={this.bus}
        brightness={this.displayBrightness}
        powered={this.displayPowered}
        failed={this.displayFailed}
        normDmc={getDisplayIndex()}
      >
        <NDComponent
          bus={this.bus}
          side={this.efisSide}
          rangeValues={a320EfisRangeSettings}
          terrainThresholdPaddingText={a320TerrainThresholdPadValue}
        />
      </DisplayUnit>,
      document.getElementById('ND_CONTENT'),
    );

    // Remove "instrument didn't load" text
    document.getElementById('ND_CONTENT').querySelector(':scope > h1').remove();
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    this.backplane.onUpdate();
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

class A32NX_ND extends FsBaseInstrument<NDInstrument> {
  constructInstrument(): NDInstrument {
    return new NDInstrument();
  }

  get isInteractive(): boolean {
    return false;
  }

  get templateID(): string {
    return 'A32NX_ND';
  }
}

registerInstrument('a32nx-nd', A32NX_ND);
