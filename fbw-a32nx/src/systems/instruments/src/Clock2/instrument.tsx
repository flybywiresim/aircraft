import { EventBus, FSComponent } from 'msfssdk';
import { ClockSimvarPublisher } from 'instruments/src/Clock2/shared/ClockSimvarPublisher';
import { ClockRoot } from './Clock';

// eslint-disable-next-line camelcase
class A32NX_Clock extends BaseInstrument {
    private bus: EventBus;

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
    }

    get templateID(): string {
        return 'A32NX_Clock';
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.simVarPublisher.subscribe('ltsTest');

        FSComponent.render(<ClockRoot bus={this.bus} />, document.getElementById('Clock_CONTENT'));
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

registerInstrument('a32nx-clock', A32NX_Clock);
