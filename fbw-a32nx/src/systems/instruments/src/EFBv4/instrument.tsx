import { EventBus, FSComponent, HEventPublisher } from '@microsoft/msfs-sdk';
import { EFBSimvarPublisher } from './shared/EFBSimvarPublisher';
import { EFBv4Root } from './EFBv4';

// eslint-disable-next-line camelcase
class A32NX_EFBv4 extends BaseInstrument {
    private bus: EventBus;

    private readonly hEventPublisher: HEventPublisher;

    private simVarPublisher: EFBSimvarPublisher;

    get isInteractive(): boolean {
        return true;
    }

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
        this.simVarPublisher = new EFBSimvarPublisher(this.bus);
        this.hEventPublisher = new HEventPublisher(this.bus);
    }

    get templateID(): string {
        return 'A32NX_EFBv4';
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.hEventPublisher.startPublish();

        FSComponent.render(<EFBv4Root bus={this.bus} />, document.getElementById('EFBv4_CONTENT'));

        // Remove "instrument didn't load" text
        document.getElementById('EFBv4_CONTENT').querySelector(':scope > h1').remove();
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

registerInstrument('a32nx-efbv4', A32NX_EFBv4);
