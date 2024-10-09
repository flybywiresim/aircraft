import { EventBus, FSComponent, HEventPublisher } from '@microsoft/msfs-sdk';
import { ClockRoot, ClockSimvarPublisher } from '@flybywiresim/clock';

import './Clock.scss';

// eslint-disable-next-line camelcase
class A380X_Clock extends BaseInstrument {
  private bus: EventBus;

  private readonly hEventPublisher: HEventPublisher;

  private simVarPublisher: ClockSimvarPublisher;

  /**
   * "mainmenu" = 0
   * "loading" = 1
   * "briefing" = 2
   * "ingame" = 3
   */
  private gameState = 0;

  constructor() {
    super();
    this.bus = new EventBus();
    this.simVarPublisher = new ClockSimvarPublisher(this.bus);
    this.hEventPublisher = new HEventPublisher(this.bus);
  }

  get templateID(): string {
    return 'A380X_Clock';
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.hEventPublisher.startPublish();

    this.simVarPublisher.subscribe('ltsTest');
    this.simVarPublisher.subscribe('dcEssIsPowered');
    this.simVarPublisher.subscribe('dcHot1IsPowered');
    this.simVarPublisher.subscribe('absTime');

    this.simVarPublisher.subscribe('timeOfDay');

    this.simVarPublisher.subscribe('currentUTC');
    this.simVarPublisher.subscribe('dayOfMonth');
    this.simVarPublisher.subscribe('monthOfYear');
    this.simVarPublisher.subscribe('year');

    this.simVarPublisher.subscribe('elapsedKnobPos');

    this.simVarPublisher.subscribe('dc2IsPowered');

    FSComponent.render(<ClockRoot bus={this.bus} />, document.getElementById('Clock_CONTENT'));

    // Remove "instrument didn't load" text
    document?.getElementById('Clock_CONTENT')?.querySelector(':scope > h1')?.remove();
  }

  public Update(): void {
    super.Update();

    if (this.gameState !== 3) {
      const gamestate = this.getGameState();
      if (gamestate === 3) {
        this.simVarPublisher.startPublish();
      }
      this.gameState = gamestate;
    } else {
      this.simVarPublisher.onUpdate();
    }
  }
}

registerInstrument('a380x-clock', A380X_Clock);
