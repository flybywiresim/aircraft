import { Clock, EventBus, FSComponent } from 'msfssdk';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { EWDComponent } from './EWD';
import { EWDSimvarPublisher } from './shared/EWDSimvarPublisher';

import './style.scss';

class A32NX_EWD extends BaseInstrument {
    private bus: EventBus;

    private simVarPublisher: EWDSimvarPublisher;

    private readonly arincProvider: ArincValueProvider;

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
        this.arincProvider = new ArincValueProvider(this.bus);
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

        this.arincProvider.init();
        this.clock.init();

        this.simVarPublisher.subscribe('acEssBus');
        this.simVarPublisher.subscribe('ewdPotentiometer');
        this.simVarPublisher.subscribe('autoThrustLimit');
        this.simVarPublisher.subscribe('autoThrustLimitType');
        this.simVarPublisher.subscribe('autoThrustMode');
        this.simVarPublisher.subscribe('packs1Supplying');
        this.simVarPublisher.subscribe('packs2Supplying');
        this.simVarPublisher.subscribe('engine1AntiIce');
        this.simVarPublisher.subscribe('engine1Fadec');
        this.simVarPublisher.subscribe('engine1N1');
        this.simVarPublisher.subscribe('engine1State');
        this.simVarPublisher.subscribe('engine2AntiIce');
        this.simVarPublisher.subscribe('engine2Fadec');
        this.simVarPublisher.subscribe('engine2N1');
        this.simVarPublisher.subscribe('engine2State');
        this.simVarPublisher.subscribe('wingAntiIce');
        this.simVarPublisher.subscribe('apuBleedPressure');
        this.simVarPublisher.subscribe('left1LandingGear');
        this.simVarPublisher.subscribe('right1LandingGear');
        this.simVarPublisher.subscribe('throttle1Position');
        this.simVarPublisher.subscribe('throttle2Position');
        this.simVarPublisher.subscribe('fwcFlightPhase');
        this.simVarPublisher.subscribe('idleN1');
        this.simVarPublisher.subscribe('flexTemp');
        this.simVarPublisher.subscribe('satRaw');

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
