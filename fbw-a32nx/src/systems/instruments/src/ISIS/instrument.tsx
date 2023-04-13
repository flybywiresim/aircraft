import './style.scss';
import { Clock, EventBus, FSComponent } from '@microsoft/msfs-sdk';
import { ISISSimvarPublisher } from './shared/ISISSimvarPublisher';
import { ISISComponent } from './ISISComponent';

class A32NX_ISIS extends BaseInstrument {
    private readonly bus: EventBus;

    private readonly simVarPublisher: ISISSimvarPublisher;

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
        this.simVarPublisher = new ISISSimvarPublisher(this.bus);
        this.clock = new Clock(this.bus);
    }

    get templateID(): string {
        return 'A32NX_ISIS';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    /*   public onInteractionEvent(args: string[]): void {

        this.hEventPublisher.dispatchHEvent(args[0]);
    } */

    public connectedCallback(): void {
        super.connectedCallback();

        this.simVarPublisher.subscribe('roll');
        this.simVarPublisher.subscribe('pitch');
        this.simVarPublisher.subscribe('dcEssLive');
        this.simVarPublisher.subscribe('dcHotLive');
        this.simVarPublisher.subscribe('ias');

        FSComponent.render(<ISISComponent bus={this.bus} />, document.getElementById('ISIS_CONTENT'));

        // Remove "instrument didn't load" text
        document.getElementById('ISIS_CONTENT').querySelector(':scope > h1').remove();
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
                this.clock.init();
            }
            this.gameState = gamestate;
        } else {
            this.simVarPublisher.onUpdate();
            this.clock.onUpdate();
        }
    }
}

registerInstrument('a32nx-isis', A32NX_ISIS);
