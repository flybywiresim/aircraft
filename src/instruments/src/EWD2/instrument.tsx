import { Clock, EventBus, FSComponent } from 'msfssdk';
import { EWDComponent } from './EWD';
import { EWDSimvarPublisher } from './shared/EWDSimvarPublisher';

import './style.scss';

class A32NX_EWD extends BaseInstrument {
    private bus: EventBus;

    private simVarPublisher: EWDSimvarPublisher;

    private readonly clock: Clock;

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
        this.simVarPublisher = new EWDSimvarPublisher(this.bus);
        this.clock = new Clock(this.bus);
    }

    get templateID(): string {
        return 'A32NX_EWD';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.clock.init();

        this.simVarPublisher.subscribe('acEssBus');
        this.simVarPublisher.subscribe('ewdPotentiometer');

        FSComponent.render(<EWDComponent bus={this.bus} instrument={this} />, document.getElementById('EWD_CONTENT'));
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
            this.clock.onUpdate();
        }
    }
}

registerInstrument('a32nx-ewd', A32NX_EWD);
