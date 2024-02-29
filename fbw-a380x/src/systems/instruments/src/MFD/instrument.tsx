import { Clock, FSComponent, EventBus, HEventPublisher } from '@microsoft/msfs-sdk';
import { FmcService } from 'instruments/src/MFD/FMC/FmcService';
import { FmcServiceInterface } from 'instruments/src/MFD/FMC/FmcServiceInterface';
import { MfdComponent } from './MFD';
import { MfdSimvarPublisher } from './shared/MFDSimvarPublisher';

class A380X_MFD extends BaseInstrument {
    private readonly bus: EventBus;

    private readonly simVarPublisher: MfdSimvarPublisher;

    private readonly hEventPublisher: HEventPublisher;

    private readonly clock: Clock;

    private mfdCaptRef = FSComponent.createRef<MfdComponent>();

    private mfdFoRef = FSComponent.createRef<MfdComponent>();

    private readonly fmcService: FmcServiceInterface;

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
        this.simVarPublisher = new MfdSimvarPublisher(this.bus);
        this.hEventPublisher = new HEventPublisher(this.bus);
        this.clock = new Clock(this.bus);
        this.fmcService = new FmcService(this.bus, this.mfdCaptRef.getOrDefault());
    }

    get templateID(): string {
        return 'A380X_MFD';
    }

    get isInteractive(): boolean {
        return true;
    }

    public getDeltaTime() {
        return this.deltaTime;
    }

    public connectedCallback(): void {
        super.connectedCallback();

        this.clock.init();

        const mfd = document.getElementById('MFD_CONTENT');
        if (mfd) {
            mfd.style.display = 'flex';
            mfd.style.flexDirection = 'row';
            mfd.style.height = '1024';
        }

        FSComponent.render(<div id="MFD_LEFT_PARENT_DIV" style="width: 768px; position: relative; margin-right: 110px;" />, document.getElementById('MFD_CONTENT'));
        FSComponent.render(<div id="MFD_RIGHT_PARENT_DIV" style="width: 768px; position: relative;" />, document.getElementById('MFD_CONTENT'));
        FSComponent.render(<MfdComponent
            captOrFo="CAPT"
            ref={this.mfdCaptRef}
            bus={this.bus}
            instrument={this}
            fmcService={this.fmcService}
        />, document.getElementById('MFD_LEFT_PARENT_DIV'));
        FSComponent.render(<MfdComponent
            captOrFo="FO"
            ref={this.mfdFoRef}
            bus={this.bus}
            instrument={this}
            fmcService={this.fmcService}
        />, document.getElementById('MFD_RIGHT_PARENT_DIV'));

        // Update MFD reference for deduplication etc.
        if (this.fmcService.master) {
            this.fmcService.master.mfdReference = this.mfdCaptRef.instance;
        }

        // Navigate to initial page
        this.mfdCaptRef.instance.uiService.navigateTo('fms/data/status');
        this.mfdFoRef.instance.uiService.navigateTo('fms/data/status');

        // Remove "instrument didn't load" text
        mfd?.querySelector(':scope > h1')?.remove();
    }

    public onInteractionEvent(args: string[]): void {
        this.hEventPublisher.dispatchHEvent(args[0]);
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

registerInstrument('a380x-mfd', A380X_MFD);
