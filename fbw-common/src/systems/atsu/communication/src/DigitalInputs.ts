import { FmgcDataBusTypes, FmgcInputBus } from '@atsu/common';
import { Arinc429Word } from '@shared/arinc429';
import { FmgcFlightPhase } from '@shared/flightphase';
import { EventBus, EventSubscriber } from 'msfssdk';
import { FmsRouterBus } from './databus/FmsBus';
import { RmpDataBusTypes, RmpInputBus } from './databus/RmpBus';

export class DigitalInputs {
    private subscriber: EventSubscriber<FmgcDataBusTypes & RmpDataBusTypes> = null;

    private poweredUp: boolean = false;

    public FlightPhase: FmgcFlightPhase = FmgcFlightPhase.Preflight;

    public Vhf3Powered: boolean = false;

    public Vhf3DataMode: boolean = false;

    public readonly fmsBus: FmsRouterBus;

    public readonly fmgcBus: FmgcInputBus;

    public readonly rmpBus: RmpInputBus;

    private resetData(): void {
        this.FlightPhase = FmgcFlightPhase.Preflight;
        this.Vhf3Powered = false;
        this.Vhf3DataMode = false;
    }

    constructor(private readonly bus: EventBus) {
        this.resetData();
        this.fmsBus = new FmsRouterBus(this.bus);
        this.fmgcBus = new FmgcInputBus(this.bus);
        this.rmpBus = new RmpInputBus(this.bus);
    }

    public initialize(): void {
        this.fmsBus.initialize();
        this.fmgcBus.initialize();
        this.rmpBus.initialize();
        this.subscriber = this.bus.getSubscriber<FmgcDataBusTypes & RmpDataBusTypes>();
    }

    public connectedCallback(): void {
        this.fmgcBus.connectedCallback();
        this.rmpBus.connectedCallback();

        this.subscriber.on('flightPhase').handle((phase: Arinc429Word) => {
            if (this.poweredUp) {
                if (phase.isNormalOperation()) {
                    this.FlightPhase = phase.value as FmgcFlightPhase;
                } else {
                    this.FlightPhase = FmgcFlightPhase.Preflight;
                }
            }
        });
        this.subscriber.on('vhf3Powered').handle((powered: boolean) => this.Vhf3Powered = powered);
        this.subscriber.on('vhf3DataMode').handle((dataMode: boolean) => this.Vhf3DataMode = dataMode);
    }

    public startPublish(): void {
        this.fmgcBus.startPublish();
        this.rmpBus.startPublish();
    }

    public powerUp(): void {
        this.poweredUp = true;
        this.resetData();
    }

    public powerDown(): void {
        this.poweredUp = false;
    }

    public update(): void {
        this.fmgcBus.update();
        this.rmpBus.update();
    }
}
