import { AtcMessageButtonSimvarPublisher, AtcMessageButtonInputBus } from '@atsu/system/databus/AtcMessageButtonBus';
import { Atsu } from '@atsu/system/ATSU';
import { ClockSimvarPublisher, ClockInputBus } from '@atsu/system/databus/ClockBus';
import { FmgcSimvarPuplisher, FmgcInputBus } from '@atsu/system/databus/FmgcBus';
import { FwcSimvarPublisher, FwcInputBus } from '@atsu/system/databus/FwcBus';
import { TransponderSimvarPublisher, TransponderInputBus } from '@atsu/system/databus/TransponderBus';
import { EventBus } from 'msfssdk';

export class AtsuSystem {
    private readonly atcMessageButtonPublisher: AtcMessageButtonSimvarPublisher;

    private readonly clockPublisher: ClockSimvarPublisher;

    private readonly fmgcPublisher: FmgcSimvarPuplisher;

    private readonly fwcPublisher: FwcSimvarPublisher;

    private readonly transponderPublisher: TransponderSimvarPublisher;

    private readonly atcMessageButton: AtcMessageButtonInputBus;

    private readonly clock: ClockInputBus;

    private readonly fmgc: FmgcInputBus;

    private readonly fwc: FwcInputBus;

    private readonly transponder: TransponderInputBus;

    private readonly atsu: Atsu;

    /**
     * "mainmenu" = 0
     * "loading" = 1
     * "briefing" = 2
     * "ingame" = 3
     */
    private gameState = 0;

    constructor(private readonly bus: EventBus) {
        this.atcMessageButtonPublisher = new AtcMessageButtonSimvarPublisher(this.bus);
        this.clockPublisher = new ClockSimvarPublisher(this.bus);
        this.fmgcPublisher = new FmgcSimvarPuplisher(this.bus);
        this.fwcPublisher = new FwcSimvarPublisher(this.bus);
        this.transponderPublisher = new TransponderSimvarPublisher(this.bus);

        this.atcMessageButton = new AtcMessageButtonInputBus(this.bus);
        this.clock = new ClockInputBus(this.bus);
        this.fmgc = new FmgcInputBus(this.bus);
        this.fwc = new FwcInputBus(this.bus);
        this.transponder = new TransponderInputBus(this.bus);

        this.atsu = new Atsu();
    }

    public connectedCallback(): void {
        this.atcMessageButton.initialize();
        this.clock.initialize();
        this.fmgc.initialize();
        this.fwc.initialize();
        this.transponder.initialize();

        this.atcMessageButton.connectedCallback();
        this.clock.connectedCallback();
        this.fmgc.connectedCallback();
        this.fwc.connectedCallback();
        this.transponder.connectedCallback();
    }

    public Update(nextGameState: number): void {
        if (this.gameState !== 3) {
            if (nextGameState === 3) {
                this.atcMessageButtonPublisher.startPublish();
                this.clockPublisher.startPublish();
                this.fmgcPublisher.startPublish();
                this.fwcPublisher.startPublish();
                this.transponderPublisher.startPublish();
            }
            this.gameState = nextGameState;
        } else {
            this.atcMessageButtonPublisher.onUpdate();
            this.clockPublisher.onUpdate();
            this.fmgcPublisher.onUpdate();
            this.fwcPublisher.onUpdate();
            this.transponderPublisher.onUpdate();
        }
    }
}
