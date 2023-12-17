import { Clock, FSComponent, EventBus, HEventPublisher } from '@microsoft/msfs-sdk';
import { PFDComponent } from './PFD';
import { AdirsValueProvider } from './shared/AdirsValueProvider';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { PFDSimvarPublisher } from './shared/PFDSimvarPublisher';
import { SimplaneValueProvider } from './shared/SimplaneValueProvider';

import './style.scss';

class A32NX_PFD extends BaseInstrument {
    private bus: EventBus;

    private simVarPublisher: PFDSimvarPublisher;

    private readonly hEventPublisher;

    private readonly arincProvider: ArincValueProvider;

    private readonly simplaneValueProvider: SimplaneValueProvider;

    private readonly clock: Clock;

    private readonly adirsValueProvider: AdirsValueProvider;

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
        this.simVarPublisher = new PFDSimvarPublisher(this.bus);
        this.hEventPublisher = new HEventPublisher(this.bus);
        this.arincProvider = new ArincValueProvider(this.bus);
        this.simplaneValueProvider = new SimplaneValueProvider(this.bus);
        this.clock = new Clock(this.bus);
        this.adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher);
    }

    get templateID(): string {
        return 'A32NX_PFD';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.arincProvider.init();
        this.clock.init();

        FSComponent.render(<PFDComponent bus={this.bus} instrument={this} />, document.getElementById('PFD_CONTENT'));
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
                this.adirsValueProvider.start();
            }
            this.gameState = gamestate;
        } else {
            this.simVarPublisher.onUpdate();
            this.simplaneValueProvider.onUpdate();
            this.clock.onUpdate();
        }
    }

    protected onFlightStart() {
        super.onFlightStart();
        if (SimVar.GetSimVarValue('L:A32NX_IS_READY', 'number') !== 1) {
            // set ready signal that JS code is initialized and flight is actually started
            // -> user pressed 'READY TO FLY' button
            SimVar.SetSimVarValue('L:A32NX_IS_READY', 'number', 1);
        }
    }
}

registerInstrument('a32nx-pfd', A32NX_PFD);
