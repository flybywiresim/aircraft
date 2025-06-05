//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  Clock,
  DebounceTimer,
  EventBus,
  FSComponent,
  FsInstrument,
  HEventPublisher,
  InstrumentBackplane,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
} from '@microsoft/msfs-sdk';
import { FailuresConsumer, MsfsAutopilotAssitancePublisher, MsfsRadioNavigationPublisher } from '@flybywiresim/fbw-sdk';
import { FcuDisplay } from './Components/FcuDisplay';
import { AltitudeManager } from './Managers/AltitudeManager';
import { AutopilotManager } from './Managers/AutopilotManager';
import { BaroManager } from './Managers/BaroManager';
import { HeadingManager } from './Managers/HeadingManager';
import { SpeedManager } from './Managers/SpeedManager';
import { VerticalSpeedManager } from './Managers/VerticalSpeedManager';
import { LsManager } from './Managers/LsManager';
import { FcuPublisher } from './Publishers/FcuPublisher';
import { FGDataPublisher } from '../MsfsAvionicsCommon/providers/FGDataPublisher';
import { OverheadPublisher } from '../MsfsAvionicsCommon/providers/OverheadPublisher';

import './style.scss';

export class FcuFsInstrument implements FsInstrument {
  private static readonly INIT_DURATION = 1000;

  private readonly bus = new EventBus();

  private readonly isPowered = Subject.create(false);

  private readonly backplane = new InstrumentBackplane();
  private readonly clock = new Clock(this.bus);
  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly failuresConsumer = new FailuresConsumer();

  //private readonly isFailedKey = A380Failure.Fcu;
  private readonly isFailed = Subject.create(false);

  private readonly isOperating = Subject.create(false);
  private readonly initTimer = new DebounceTimer();

  /**
   * Creates a new instance of FsInstrument.
   * @param instrument This instrument's parent BaseInstrument.
   * @param config The general avionics configuration object.
   */
  constructor(public readonly instrument: BaseInstrument) {
    // force enable animations
    document.documentElement.classList.add('animationsEnabled');

    this.renderComponents();

    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addPublisher('HEvent', this.hEventPublisher);

    this.backplane.addInstrument('AltitudeManager', new AltitudeManager(this.bus));
    this.backplane.addInstrument('AutopilotManager', new AutopilotManager(this.bus));
    this.backplane.addInstrument('BaroManager1', new BaroManager(this.bus, 1), true);
    this.backplane.addInstrument('HeadingManager', new HeadingManager(this.bus));
    this.backplane.addInstrument('SpeedManager', new SpeedManager(this.bus));
    this.backplane.addInstrument('VerticalSpeedManager', new VerticalSpeedManager(this.bus));
    this.backplane.addInstrument('Lsmanager', new LsManager(this.bus));

    this.backplane.addPublisher('FcuPublisher', new FcuPublisher(this.bus));
    this.backplane.addPublisher('FgBusPublisher', new FGDataPublisher(this.bus));
    this.backplane.addPublisher('OverheadPublisher', new OverheadPublisher(this.bus));
    this.backplane.addPublisher('MsfsAutopilotAssistancePublisher', new MsfsAutopilotAssitancePublisher(this.bus));
    this.backplane.addPublisher('MsfsRadioNavigationPublisher', new MsfsRadioNavigationPublisher(this.bus));

    this.doInit();
  }

  /** @inheritdoc */
  private renderComponents(): void {
    FSComponent.render(
      <FcuDisplay bus={this.bus} isHidden={this.isOperating.map(SubscribableMapFunctions.not())} />,
      document.getElementById('FCU_CONTENT'),
    );

    // Remove "instrument didn't load" text
    document.getElementById('FCU_CONTENT')?.querySelector(':scope > h1')?.remove();
  }

  /** @inheritdoc */
  public Update(): void {
    this.failuresConsumer.update();
    // this.isFailed.set(this.failuresConsumer.isActive(this.isFailedKey));;

    this.backplane.onUpdate();
  }

  /** @inheritdoc */
  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  /** @inheritdoc */
  public onFlightStart(): void {
    // noop and not useful
  }

  /** @inheritdoc */
  public onGameStateChanged(_oldState: GameState, _newState: GameState): void {
    // noop
  }

  /** @inheritdoc */
  public onSoundEnd(_soundEventId: Name_Z): void {
    // noop
  }

  public onPowerOn(): void {
    this.isPowered.set(true);
  }

  public onPowerOff(): void {
    this.isPowered.set(false);
  }

  /** Init instrument. */
  private doInit(): void {
    // this.failuresConsumer.register(this.isFailedKey);

    // FIXME: very dubious code from old FCU
    this.isOperating.sub((v) => {
      if (v) {
        if (!SimVar.GetSimVarValue('AUTOPILOT FLIGHT DIRECTOR ACTIVE:1', 'bool')) {
          SimVar.SetSimVarValue('K:TOGGLE_FLIGHT_DIRECTOR', 'number', 1);
        }
        if (!SimVar.GetSimVarValue('AUTOPILOT FLIGHT DIRECTOR ACTIVE:2', 'bool')) {
          SimVar.SetSimVarValue('K:TOGGLE_FLIGHT_DIRECTOR', 'number', 2);
        }
      }
    });

    MappedSubject.create(this.isPowered, this.isFailed).sub(([isPowered, isFailed]) => {
      if (isPowered && !isFailed) {
        this.initTimer.schedule(() => this.isOperating.set(true), FcuFsInstrument.INIT_DURATION);
      } else {
        this.initTimer.clear();
        this.isOperating.set(false);
      }
    }, true);

    this.backplane.init();
  }
}
