// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ClockPublisher,
  FsBaseInstrument,
  FSComponent,
  FsInstrument,
  HEventPublisher,
  InstrumentBackplane,
  Subject,
} from '@microsoft/msfs-sdk';

import { ArincEventBus, VhfComIndices } from '@flybywiresim/fbw-sdk';
import { RmpState, RmpStateControllerEvents, VhfComManager } from '@flybywiresim/rmp';

import { RmpMessages } from './Components/RmpMessages';
import { RmpPageStack } from './Components/RmpPageStack';
import { Flasher } from './Systems/Flasher';
import { A380xRmpStateController } from './Systems/RmpStateController';
import { KeypadController } from './Systems/KeypadController';
import { RmpMessageManager } from './Systems/RmpMessageManager';
import { AudioControlManager } from './Systems/AudioControlManager';
import { AudioControlLocalVarPublisher } from './Data/AudioControlPublisher';
import { VhfRadioPublisher } from './Data/VhfRadioPublisher';
import { TransponderPublisher } from './Data/TransponderPublisher';
import { TransmitMessageMonitor } from './Systems/TransmitMessageMonitor';

import './style.scss';

class RmpInstrument implements FsInstrument {
  private readonly bus = new ArincEventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly clockPublisher = new ClockPublisher(this.bus);

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly rmpIndex = this.instrument.instrumentIndex as 1 | 2 | 3;

  private readonly stateController = new A380xRmpStateController(this.bus, this.rmpIndex);

  private readonly vhfControllers = [
    new VhfComManager(this.bus, VhfComIndices.Vhf1, this.rmpIndex),
    new VhfComManager(this.bus, VhfComIndices.Vhf2, this.rmpIndex),
    new VhfComManager(this.bus, VhfComIndices.Vhf3, this.rmpIndex),
  ];

  private readonly flasher = new Flasher(this.bus);

  private readonly messageManager = new RmpMessageManager(this.bus, this.rmpIndex);

  private readonly keypadController = new KeypadController(this.bus, this.rmpIndex);

  private readonly audioControlManager = new AudioControlManager(this.bus, this.rmpIndex);

  private readonly audioControlPublisher = new AudioControlLocalVarPublisher(this.bus, this.rmpIndex);

  private readonly vhfRadioPublisher = new VhfRadioPublisher(this.bus);

  private readonly transponderPublisher = new TransponderPublisher(this.bus);

  private readonly transmitMessageMonitor = new TransmitMessageMonitor(this.bus);

  private readonly screenOff = Subject.create(true);

  constructor(public readonly instrument: BaseInstrument) {
    if (
      this.instrument.instrumentIndex !== 1 &&
      this.instrument.instrumentIndex !== 2 &&
      this.instrument.instrumentIndex !== 3
    ) {
      throw new Error('Invalid RMP index (panel.cfg)!');
    }

    this.backplane.addPublisher('ClockPublisher', this.clockPublisher);
    this.backplane.addPublisher('HEventPublisher', this.hEventPublisher);

    this.backplane.addInstrument('RmpStateController', this.stateController);
    this.backplane.addInstrument('AudioControlManager', this.audioControlManager);
    this.backplane.addPublisher('AudioControlPublisher', this.audioControlPublisher);
    this.backplane.addPublisher('VhfRadioPublisher', this.vhfRadioPublisher);
    this.backplane.addPublisher('TransponderPublisher', this.transponderPublisher);
    this.backplane.addInstrument('TransmitMessageMonitor', this.transmitMessageMonitor);

    for (const vhf of this.vhfControllers) {
      this.backplane.addInstrument(`VhfController${vhf.index}`, vhf, true);
    }

    this.doInit();
  }

  private doInit(): void {
    this.backplane.init();

    FSComponent.render(
      <div
        class={{
          'rmp-content': true,
          hidden: this.screenOff,
        }}
      >
        <RmpPageStack bus={this.bus} />
        <RmpMessages bus={this.bus} />
        {/* <RefImages /> */}
      </div>,
      document.getElementById('RMP_CONTENT'),
    );

    // Remove "instrument didn't load" text
    document.getElementById('RMP_CONTENT')!.querySelector(':scope > h1')!.remove();

    this.bus
      .getSubscriber<RmpStateControllerEvents>()
      .on('rmp_state')
      .handle((v) => this.screenOff.set(v !== RmpState.On));
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    this.backplane.onUpdate();
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

class A380X_RMP extends FsBaseInstrument<RmpInstrument> {
  public constructInstrument(): RmpInstrument {
    return new RmpInstrument(this);
  }

  public get isInteractive(): boolean {
    // FIXME set to false when finished with ref images
    return true;
  }

  public get templateID(): string {
    return 'A380X_RMP';
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

registerInstrument('a380x-rmp', A380X_RMP);
