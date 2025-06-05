//  Copyright (c) 2024-2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  EventBus,
  HEventPublisher,
  InstrumentBackplane,
  FsInstrument,
  FsBaseInstrument,
  ClockPublisher,
  Subject,
} from '@microsoft/msfs-sdk';
import { FmcService } from 'instruments/src/MFD/FMC/FmcService';
import { FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { MfdComponent } from './MFD';
import { MfdSimvarPublisher } from './shared/MFDSimvarPublisher';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { A380Failure } from '@failures';
import { FGDataPublisher } from '../MsfsAvionicsCommon/providers/FGDataPublisher';
import { FmsMfdPublisher } from '../MsfsAvionicsCommon/providers/FmsMfdPublisher';
import { ResetPanelSimvarPublisher } from '../MsfsAvionicsCommon/providers/ResetPanelPublisher';

class MfdInstrument implements FsInstrument {
  private readonly bus = new EventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher = new MfdSimvarPublisher(this.bus);

  private readonly fgDataPublisher = new FGDataPublisher(this.bus);

  private readonly fmsDataPublisher = new FmsMfdPublisher(this.bus);

  private readonly clockPublisher = new ClockPublisher(this.bus);

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly resetPanelPublisher = new ResetPanelSimvarPublisher(this.bus);

  private readonly mfdCaptRef = FSComponent.createRef<MfdComponent>();

  private readonly mfdFoRef = FSComponent.createRef<MfdComponent>();

  private readonly fmcService: FmcServiceInterface;

  private readonly fmcAFailed = Subject.create(false);
  private readonly fmcBFailed = Subject.create(false);
  private readonly fmcCFailed = Subject.create(false);

  private readonly failuresConsumer = new FailuresConsumer();

  constructor(public readonly instrument: BaseInstrument) {
    this.backplane.addPublisher('mfd', this.simVarPublisher);
    this.backplane.addPublisher('hEvent', this.hEventPublisher);
    this.backplane.addPublisher('clock', this.clockPublisher);
    this.backplane.addPublisher('fg', this.fgDataPublisher);
    this.backplane.addPublisher('fms', this.fmsDataPublisher);
    this.backplane.addPublisher('resetPanel', this.resetPanelPublisher);

    this.fmcService = new FmcService(
      this.bus,
      this.mfdCaptRef.getOrDefault(),
      this.fmcAFailed,
      this.fmcBFailed,
      this.fmcCFailed,
    );

    this.doInit();
  }

  public doInit(): void {
    this.backplane.init();

    const mfd = document.getElementById('MFD_CONTENT');
    if (mfd) {
      mfd.style.display = 'flex';
      mfd.style.flexDirection = 'row';
      mfd.style.height = '1024';
    }

    FSComponent.render(
      <div id="MFD_LEFT_PARENT_DIV" style="width: 768px; position: relative; margin-right: 110px;" />,
      document.getElementById('MFD_CONTENT'),
    );
    FSComponent.render(
      <div id="MFD_RIGHT_PARENT_DIV" style="width: 768px; position: relative;" />,
      document.getElementById('MFD_CONTENT'),
    );
    FSComponent.render(
      <MfdComponent captOrFo="CAPT" ref={this.mfdCaptRef} bus={this.bus} fmcService={this.fmcService} />,
      document.getElementById('MFD_LEFT_PARENT_DIV'),
    );
    FSComponent.render(
      <MfdComponent captOrFo="FO" ref={this.mfdFoRef} bus={this.bus} fmcService={this.fmcService} />,
      document.getElementById('MFD_RIGHT_PARENT_DIV'),
    );

    // Update MFD reference for deduplication etc.
    if (this.fmcService.master) {
      this.fmcService.master.mfdReference = this.mfdCaptRef.instance;
    }

    // Navigate to initial page
    this.mfdCaptRef.instance.uiService.navigateTo('fms/data/status');
    this.mfdFoRef.instance.uiService.navigateTo('fms/data/status');

    // Remove "instrument didn't load" text
    mfd?.querySelector(':scope > h1')?.remove();

    this.failuresConsumer.register(A380Failure.FmcA);
    this.failuresConsumer.register(A380Failure.FmcB);
    this.failuresConsumer.register(A380Failure.FmcC);
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    this.backplane.onUpdate();
    this.failuresConsumer.update();
    this.fmcAFailed.set(this.failuresConsumer.isActive(A380Failure.FmcA));
    this.fmcBFailed.set(this.failuresConsumer.isActive(A380Failure.FmcB));
    this.fmcCFailed.set(this.failuresConsumer.isActive(A380Failure.FmcC));
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

class A380X_MFD extends FsBaseInstrument<MfdInstrument> {
  public constructInstrument(): MfdInstrument {
    return new MfdInstrument(this);
  }

  public get isInteractive(): boolean {
    return true;
  }

  public get templateID(): string {
    return 'A380X_MFD';
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

registerInstrument('a380x-mfd', A380X_MFD);
