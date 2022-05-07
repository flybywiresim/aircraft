import { Clock, FSComponent, EventBus, HEventPublisher, Subject } from 'msfssdk';
import { NDComponent } from './ND';
import { NDSimvarPublisher, NDSimvars } from './NDSimvarPublisher';

import './style.scss';
import { AdirsValueProvider } from '../MsfsAvionicsCommon/AdirsValueProvider';
import { EcpBusSimVarPublisher } from '../MsfsAvionicsCommon/providers/EcpBusSimVarPublisher';
import { FmsDataPublisher } from '../MsfsAvionicsCommon/providers/FmsDataPublisher';
import { FmsSymbolsPublisher } from './FmsSymbolsPublisher';

class A32NX_ND extends BaseInstrument {
    private readonly bus: EventBus;

    private readonly simVarPublisher: NDSimvarPublisher;

    private readonly ecpBusSimVarPublisher: EcpBusSimVarPublisher;

    private readonly fmsDataPublisher: FmsDataPublisher;

    private readonly fmsSymbolsPublisher: FmsSymbolsPublisher;

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
        this.ecpBusSimVarPublisher = new EcpBusSimVarPublisher(this.bus, Subject.create('L'));
        this.fmsDataPublisher = new FmsDataPublisher(this.bus, Subject.create('L'));
        this.fmsSymbolsPublisher = new FmsSymbolsPublisher(this.bus);
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
        this.simVarPublisher.subscribe('windDirection');
        this.simVarPublisher.subscribe('windVelocity');
        this.simVarPublisher.subscribe('speed');
        this.simVarPublisher.subscribe('heading');
        this.simVarPublisher.subscribe('trueHeading');
        this.simVarPublisher.subscribe('groundTrack');
        this.simVarPublisher.subscribe('trueGroundTrack');
        this.simVarPublisher.subscribe('toWptIdent0Captain');
        this.simVarPublisher.subscribe('toWptIdent1Captain');
        this.simVarPublisher.subscribe('toWptBearingCaptain');
        this.simVarPublisher.subscribe('toWptDistanceCaptain');
        this.simVarPublisher.subscribe('toWptEtaCaptain');
        this.simVarPublisher.subscribe('apprMessage0Captain');
        this.simVarPublisher.subscribe('apprMessage1Captain');
        this.simVarPublisher.subscribe('selectedWaypointLat');
        this.simVarPublisher.subscribe('selectedWaypointLong');
        this.simVarPublisher.subscribe('selectedHeading');
        this.simVarPublisher.subscribe('latitude');
        this.simVarPublisher.subscribe('longitude');

        this.ecpBusSimVarPublisher.subscribe('ndRangeSetting');
        this.ecpBusSimVarPublisher.subscribe('ndMode');

        this.fmsDataPublisher.subscribe('ndMessageFlags');
        this.fmsDataPublisher.subscribe('crossTrackError');

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
                this.ecpBusSimVarPublisher.startPublish();
                this.fmsDataPublisher.startPublish();
                this.fmsSymbolsPublisher.startPublish();
                this.hEventPublisher.startPublish();
            }
            this.gameState = gamestate;
        } else {
            this.simVarPublisher.onUpdate();
            this.ecpBusSimVarPublisher.onUpdate();
            this.fmsDataPublisher.onUpdate();
            this.fmsSymbolsPublisher.onUpdate();
            this.clock.onUpdate();
        }
    }
}

registerInstrument('a32nx-nd', A32NX_ND);
