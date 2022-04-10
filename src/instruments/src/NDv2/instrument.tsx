import { Clock, FSComponent, EventBus, HEventPublisher } from 'msfssdk';
import { NDComponent } from './ND';
import { NDSimvarPublisher, NDSimvars } from './NDSimvarPublisher';

import './style.scss';
import { AdirsValueProvider } from '../MsfsAvionicsCommon/AdirsValueProvider';

class A32NX_ND extends BaseInstrument {
    private bus: EventBus;

    private simVarPublisher: NDSimvarPublisher;

    private readonly hEventPublisher;

    private readonly clock: Clock;

    private readonly adirsValueProvider: AdirsValueProvider<NDSimvars>;

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
        this.simVarPublisher = new NDSimvarPublisher(this.bus);
        this.hEventPublisher = new HEventPublisher(this.bus);
        this.clock = new Clock(this.bus);
        this.adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher, 'L');
    }

    get templateID(): string {
        return 'A32NX_ND';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.clock.init();

        this.simVarPublisher.subscribe('elec');
        this.simVarPublisher.subscribe('elecFo');

        this.simVarPublisher.subscribe('potentiometerCaptain');
        this.simVarPublisher.subscribe('potentiometerFo');

        this.simVarPublisher.subscribe('groundSpeed');
        this.simVarPublisher.subscribe('speed');

        FSComponent.render(<NDComponent bus={this.bus} />, document.getElementById('ND_CONTENT'));
    }

    get isInteractive(): boolean {
        return true;
    }

    /**
     * A callback called when the instrument gets a frame update.
     */
    public Update(): void {
        super.Update();

        if (this.gameState !== 3) {
            const gamestate = this.getGameState();
            if (gamestate === 3) {
                this.simVarPublisher.startPublish();
                this.hEventPublisher.startPublish();
            }
            this.gameState = gamestate;
        } else {
            this.simVarPublisher.onUpdate();
            this.clock.onUpdate();
        }
    }
}

registerInstrument('a32nx-pfd', A32NX_ND);
