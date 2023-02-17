import { EventBus, EventSubscriber } from 'msfssdk';
import { FwcDataBusTypes, FwcAocBus } from './databus/FwcBus';
import { FmsAocBus } from './databus/FmsBus';

export class DigitalInputs {
    private subscriber: EventSubscriber<FwcDataBusTypes> = null;

    private poweredUp: boolean = false;

    public CompanyMessageCount: number = 0;

    public readonly fwcBus: FwcAocBus;

    public readonly fmsBus: FmsAocBus;

    private resetData(): void {
        this.CompanyMessageCount = 0;
    }

    constructor(private readonly bus: EventBus) {
        this.resetData();
        this.fwcBus = new FwcAocBus(this.bus);
        this.fmsBus = new FmsAocBus(this.bus);
    }

    public initialize(): void {
        this.fwcBus.initialize();
        this.subscriber = this.bus.getSubscriber<FwcDataBusTypes>();
    }

    public connectedCallback(): void {
        this.fwcBus.connectedCallback();

        this.subscriber.on('companyMessageCount').handle((count: number) => {
            if (this.poweredUp) this.CompanyMessageCount = count;
        });
    }

    public startPublish(): void {
        this.fwcBus.startPublish();
    }

    public powerUp(): void {
        this.poweredUp = true;
    }

    public powerDown(): void {
        this.poweredUp = false;
        this.resetData();
    }

    public update(): void {
        this.fwcBus.update();
    }
}
