/// <reference types="msfstypes/Pages/VCockpit/Instruments/Shared/BaseInstrument" />

import { EventBus } from '../data/EventBus';
import { PublishPacer } from '../data/EventBusPacer';
import { BasePublisher } from './BasePublishers';

/**
 * An event fired when the screen state changes.
 */
export interface ScreenStateEvent {
  /** The current screen state. */
  current: ScreenState;

  /** The previous screen state. */
  previous: ScreenState | undefined;
}

/**
 * Events from the VCockpit BaseInstrument framework.
 */
export interface InstrumentEvents {

  /** An event fired when the instrument is powered on or off. */
  'vc_powered': boolean,

  /** An event fired when the screen state changes. */
  'vc_screen_state': ScreenStateEvent,

  /** An event fired when the game state changes. */
  'vc_game_state': GameState

  /** An event fired when the flight is started */
  'vc_flight_start': boolean,
}

/**
 * A publisher for VCockpit BaseInstrument events.
 */
export class BaseInstrumentPublisher extends BasePublisher<InstrumentEvents> {
  private lastGameState: GameState | undefined = undefined;
  private lastIsPowered: boolean | undefined = undefined;
  private lastScreenState: ScreenState | undefined = undefined;

  private hasFlightStarted = false;

  /**
   * Creates an instance of BasePublisher.
   * @param instrument The BaseInstrument instance.
   * @param bus The common event bus.
   * @param pacer An optional pacer to control the rate of publishing.
   */
  public constructor(private readonly instrument: BaseInstrument, bus: EventBus, pacer: PublishPacer<InstrumentEvents> | undefined = undefined) {
    super(bus, pacer);
  }

  /** @inheritdoc */
  public startPublish(): void {
    super.startPublish();
  }

  /** @inheritdoc */
  public stopPublish(): void {
    super.stopPublish();
  }

  /** @inheritdoc */
  public onUpdate(): void {
    if (!this.isPublishing()) {
      return;
    }

    this.updateFromGameState(this.instrument.getGameState());
    this.updateFromPowered((this.instrument as any).isStarted); // Big hack here since there is no other way to get the isStarted state from BaseInstrument
    this.updateFromScreenState((this.instrument as any).screenState); // Another big hack
  }

  /**
   * Updates this publisher from the current game state.
   * @param gameState The current game state.
   */
  private updateFromGameState(gameState: GameState): void {
    if (this.lastGameState === gameState) {
      return;
    }

    this.lastGameState = gameState;
    this.publish('vc_game_state', gameState);

    if (!this.hasFlightStarted && gameState === GameState.ingame) {
      this.publish('vc_flight_start', true);
    }
  }

  /**
   * Updates this publisher from the current powered state.
   * @param isPowered The current powered state.
   */
  private updateFromPowered(isPowered: boolean): void {
    if (this.lastIsPowered === isPowered) {
      return;
    }

    this.lastIsPowered = isPowered;
    this.publish('vc_powered', isPowered);
  }

  /**
   * Updates this publisher from the current screen state.
   * @param screenState The current screen state.
   */
  private updateFromScreenState(screenState: ScreenState): void {
    if (this.lastScreenState === screenState) {
      return;
    }

    const lastScreenState = this.lastScreenState;
    this.lastScreenState = screenState;
    this.publish('vc_screen_state', { current: screenState, previous: lastScreenState });
  }
}