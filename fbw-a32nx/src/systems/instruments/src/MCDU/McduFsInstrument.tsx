//  Copyright (c) 2025 FlyByWire Simulations
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
} from '@microsoft/msfs-sdk';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { A320_Neo_CDU_MainDisplay } from './legacy_pages/A320_Neo_CDU_MainDisplay';

import './mcdu.scss';

export class McduFsInstrument implements FsInstrument {
  private static readonly INIT_DURATION = 1000;

  protected readonly bus = new EventBus();

  private readonly isPowered = Subject.create(false);

  private readonly backplane = new InstrumentBackplane();
  private readonly clock = new Clock(this.bus);
  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly failuresConsumer = new FailuresConsumer('A32NX');

  //private readonly isFailedKey = A320Failure.Mcdu1;
  private readonly isFailed = Subject.create(false);

  private readonly isOperating = Subject.create(false);
  private readonly initTimer = new DebounceTimer();

  private readonly legacyFms = new A320_Neo_CDU_MainDisplay(this.bus);

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

    this.doInit();
  }

  /** @inheritdoc */
  private renderComponents(): void {
    FSComponent.render(
      <>
        <div id="BackglowCDU"></div>
        <div id="Mainframe"></div>
      </>,
      document.getElementById('MCDU_CONTENT'),
    );

    // Remove "instrument didn't load" text
    document.getElementById('MCDU_CONTENT')?.querySelector(':scope > h1')?.remove();
  }

  /** @inheritdoc */
  public Update(): void {
    this.failuresConsumer.update();
    // this.isFailed.set(this.failuresConsumer.isActive(this.isFailedKey));;

    this.backplane.onUpdate();

    // TODO deltaTime
    this.legacyFms.onUpdate(20);
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
    this.legacyFms.onPowerOn();
  }

  public onPowerOff(): void {
    this.isPowered.set(false);
  }

  /** Init instrument. */
  private doInit(): void {
    // this.failuresConsumer.register(this.isFailedKey);

    MappedSubject.create(this.isPowered, this.isFailed).sub(([isPowered, isFailed]) => {
      if (isPowered && !isFailed) {
        this.initTimer.schedule(() => this.isOperating.set(true), McduFsInstrument.INIT_DURATION);
      } else {
        this.initTimer.clear();
        this.isOperating.set(false);
      }
    }, true);

    this.backplane.init();

    this.legacyFms.connectedCallback();
  }
}
