import { EventBus, HEventPublisher } from 'msfssdk';
import { AtsuSystem } from './systems/atsu';
import './style.scss';
import { PowerSupplyBusses } from './systems/powersupply';

class SystemsHost extends BaseInstrument {
    private readonly bus: EventBus;

    private readonly hEventPublisher: HEventPublisher;

    private readonly powerSupply: PowerSupplyBusses;

    private readonly atsu: AtsuSystem;

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
        this.powerSupply = new PowerSupplyBusses(this.bus);
        this.atsu = new AtsuSystem(this.bus);
    }

    get templateID(): string {
        return 'A32NX_SYSTEMSHOST';
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.powerSupply.connectedCallback();
        this.atsu.connectedCallback();
    }

    public Update(): void {
        super.Update();

        if (this.gameState !== 3) {
            const gamestate = this.getGameState();
            if (gamestate === 3) {
                this.hEventPublisher.startPublish();
                this.powerSupply.startPublish();
                this.atsu.startPublish();
            }
            this.gameState = gamestate;
        }

        this.powerSupply.update();
        this.atsu.update();
    }
}

registerInstrument('systems-host', SystemsHost);
