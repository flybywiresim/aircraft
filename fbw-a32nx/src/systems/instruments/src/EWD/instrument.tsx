import { Clock, EventBus, FSComponent } from 'msfssdk';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { EwdComponent } from './EWD';
import { EwdSimvarPublisher } from './shared/EwdSimvarPublisher';
import { PseudoFWC } from './PseudoFWC';

import './style.scss';

class A32NX_EWD extends BaseInstrument {
    private bus: EventBus;

    private simVarPublisher: EwdSimvarPublisher;

    private readonly arincProvider: ArincValueProvider;

    private readonly clock: Clock;

    private pseudoFwc: PseudoFWC;

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
        this.simVarPublisher = new EwdSimvarPublisher(this.bus);
        this.arincProvider = new ArincValueProvider(this.bus);
        this.clock = new Clock(this.bus);
        this.pseudoFwc = new PseudoFWC();
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

        this.simVarPublisher.subscribe('autoThrustCommand1');
        this.simVarPublisher.subscribe('autoThrustCommand2');
        this.simVarPublisher.subscribe('autoThrustLimit');
        this.simVarPublisher.subscribe('autoThrustLimitToga');
        this.simVarPublisher.subscribe('thrustLimitType');
        this.simVarPublisher.subscribe('autoThrustMode');
        this.simVarPublisher.subscribe('autoThrustStatus');
        this.simVarPublisher.subscribe('autoThrustTLA1');
        this.simVarPublisher.subscribe('autoThrustTLA2');
        this.simVarPublisher.subscribe('autoThrustWarningToga');
        this.simVarPublisher.subscribe('throttle1Position');
        this.simVarPublisher.subscribe('throttle2Position');

        this.simVarPublisher.subscribe('apuBleedPressure');
        this.simVarPublisher.subscribe('packs1Supplying');
        this.simVarPublisher.subscribe('packs2Supplying');

        this.simVarPublisher.subscribe('engine1AntiIce');
        this.simVarPublisher.subscribe('engine1EGT');
        this.simVarPublisher.subscribe('engine1Fadec');
        this.simVarPublisher.subscribe('engine1FF');
        this.simVarPublisher.subscribe('engine1N1');
        this.simVarPublisher.subscribe('engine1N2');
        this.simVarPublisher.subscribe('engine1Reverse');
        this.simVarPublisher.subscribe('engine1ReverseNozzle');
        this.simVarPublisher.subscribe('engine1State');

        this.simVarPublisher.subscribe('engine2AntiIce');
        this.simVarPublisher.subscribe('engine2EGT');
        this.simVarPublisher.subscribe('engine2Fadec');
        this.simVarPublisher.subscribe('engine2FF');
        this.simVarPublisher.subscribe('engine2N1');
        this.simVarPublisher.subscribe('engine2N2');
        this.simVarPublisher.subscribe('engine2Reverse');
        this.simVarPublisher.subscribe('engine2ReverseNozzle');
        this.simVarPublisher.subscribe('engine2State');

        this.simVarPublisher.subscribe('ewdLowerLeft1');
        this.simVarPublisher.subscribe('ewdLowerLeft2');
        this.simVarPublisher.subscribe('ewdLowerLeft3');
        this.simVarPublisher.subscribe('ewdLowerLeft4');
        this.simVarPublisher.subscribe('ewdLowerLeft5');
        this.simVarPublisher.subscribe('ewdLowerLeft6');
        this.simVarPublisher.subscribe('ewdLowerLeft7');
        this.simVarPublisher.subscribe('ewdLowerRight1');
        this.simVarPublisher.subscribe('ewdLowerRight2');
        this.simVarPublisher.subscribe('ewdLowerRight3');
        this.simVarPublisher.subscribe('ewdLowerRight4');
        this.simVarPublisher.subscribe('ewdLowerRight5');
        this.simVarPublisher.subscribe('ewdLowerRight6');
        this.simVarPublisher.subscribe('ewdLowerRight7');

        this.simVarPublisher.subscribe('flexTemp');
        this.simVarPublisher.subscribe('fwcFlightPhase');
        this.simVarPublisher.subscribe('idleN1');
        this.simVarPublisher.subscribe('left1LandingGear');
        this.simVarPublisher.subscribe('right1LandingGear');
        this.simVarPublisher.subscribe('totalFuel');
        this.simVarPublisher.subscribe('wingAntiIce');

        this.simVarPublisher.subscribe('flapsPositionRaw');
        this.simVarPublisher.subscribe('satRaw');
        this.simVarPublisher.subscribe('slatsFlapsStatusRaw');
        this.simVarPublisher.subscribe('slatsPositionRaw');

        FSComponent.render(<EwdComponent bus={this.bus} instrument={this} />, document.getElementById('EWD_CONTENT'));

        // Remove "instrument didn't load" text
        document.getElementById('EWD_CONTENT').querySelector(':scope > h1').remove();
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
            this.pseudoFwc.onUpdate(this.deltaTime);
        }
    }
}

registerInstrument('a32nx-ewd', A32NX_EWD);
