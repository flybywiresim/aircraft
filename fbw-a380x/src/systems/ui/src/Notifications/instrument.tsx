import { EventBus, FSComponent, HEventPublisher } from '@microsoft/msfs-sdk';
import { NotificationsRoot } from '@flybywiresim/notifications';

import './Notification.scss';

// eslint-disable-next-line camelcase
class A380X_Notifications extends BaseInstrument {
  private bus: EventBus;

  private readonly hEventPublisher: HEventPublisher;

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
    this.hEventPublisher = new HEventPublisher(this.bus);
  }

  get templateID(): string {
    return 'A380X_Notifications';
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.hEventPublisher.startPublish();

    FSComponent.render(<NotificationsRoot bus={this.bus} />, document.getElementById('Notifications_CONTENT'));

    // Remove "instrument didn't load" text
    document?.getElementById('Notifications_CONTENT')?.querySelector(':scope > h1')?.remove();
  }

  public Update(): void {
    super.Update();

    if (this.gameState !== 3) {
      const gamestate = this.getGameState();
      if (gamestate === 3) {
        // this.simVarPublisher.startPublish();
      }
      this.gameState = gamestate;
    } else {
      // this.simVarPublisher.onUpdate();
    }
  }
}

registerInstrument('a380x-notifications', A380X_Notifications);
