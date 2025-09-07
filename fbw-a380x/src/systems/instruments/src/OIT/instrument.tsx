//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  EventBus,
  HEventPublisher,
  InstrumentBackplane,
  FsInstrument,
  FsBaseInstrument,
  ClockPublisher,
} from '@microsoft/msfs-sdk';
import { AdrBusPublisher, FwcBusPublisher, FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { OIT } from './OIT';
import { OitSimvarPublisher } from './OitSimvarPublisher';
import { OisLaptop } from './OisLaptop';
import { AircraftNetworkServerUnit } from './System/AircraftNetworkServerUnit';
import { AnsuOps } from './System/AnsuOps';
import { ResetPanelSimvarPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/ResetPanelPublisher';

class OitInstrument implements FsInstrument {
  private readonly bus = new EventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly clockPublisher = new ClockPublisher(this.bus);

  private readonly oitSimvarPublisher = new OitSimvarPublisher(this.bus);

  private readonly adrPublisher = new AdrBusPublisher(this.bus);

  private readonly fwcPublisher = new FwcBusPublisher(this.bus);

  private readonly resetPanelPublisher = new ResetPanelSimvarPublisher(this.bus);

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly failuresConsumer = new FailuresConsumer();

  private readonly laptop = new OisLaptop(
    this.bus,
    this.instrument.instrumentIndex === 1 ? 1 : 2,
    this.failuresConsumer,
  );

  private readonly avncsAnsu = new AnsuOps(this.bus, 1, 'nss-avncs', this.failuresConsumer);
  private readonly fltOpsAnsu = new AircraftNetworkServerUnit(this.bus, 1, 'flt-ops', this.failuresConsumer);

  constructor(public readonly instrument: BaseInstrument) {
    this.hEventPublisher = new HEventPublisher(this.bus);

    this.backplane.addPublisher('hEvent', this.hEventPublisher);
    this.backplane.addPublisher('clock', this.clockPublisher);
    this.backplane.addPublisher('oitSimvar', this.oitSimvarPublisher);
    this.backplane.addPublisher('adr', this.adrPublisher);
    this.backplane.addPublisher('fwc', this.fwcPublisher);
    this.backplane.addPublisher('resetPanel', this.resetPanelPublisher);
    this.backplane.addInstrument('Laptop', this.laptop);
    this.backplane.addInstrument('nssAnsu', this.avncsAnsu, true);
    this.backplane.addInstrument('fltOpsAnsu', this.fltOpsAnsu, true);

    this.doInit();
  }

  public doInit(): void {
    this.backplane.init();

    const oit = document.getElementById('OIT_CONTENT');

    FSComponent.render(
      <OIT
        bus={this.bus}
        instrument={this.instrument}
        captOrFo={this.instrument.instrumentIndex === 1 ? 'CAPT' : 'FO'}
        failuresConsumer={this.failuresConsumer}
        laptop={this.laptop}
        avncsAnsu={this.avncsAnsu}
      />,
      document.getElementById('OIT_CONTENT'),
    );

    // Remove "instrument didn't load" text
    oit?.querySelector(':scope > h1')?.remove();
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    this.backplane.onUpdate();
    this.failuresConsumer.update();
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public onGameStateChanged(_oldState: GameState, _newState: GameState): void {
    // noop
  }

  public onFlightStart(): void {
    // noop
  }

  public onSoundEnd(_soundEventId: Name_Z): void {
    // noop
  }

  public onPowerOn(): void {
    // noop
  }

  public onPowerOff(): void {
    // noop
  }
}

class A380X_OIT extends FsBaseInstrument<OitInstrument> {
  public constructInstrument(): OitInstrument {
    return new OitInstrument(this);
  }

  public get isInteractive(): boolean {
    return true;
  }

  public get templateID(): string {
    return 'A380X_OIT';
  }

  /** @inheritdoc */
  public onPowerOn(): void {
    super.onPowerOn();

    this.fsInstrument.onPowerOn();
  }

  /** @inheritdoc */
  public onShutDown(): void {
    super.onShutDown();

    this.fsInstrument.onPowerOff();
  }
}

registerInstrument('a380x-oit', A380X_OIT);
