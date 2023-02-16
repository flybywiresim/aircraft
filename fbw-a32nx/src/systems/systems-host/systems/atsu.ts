import { Atsu, Datalink, DigitalInputs, DigitalOutputs } from '@atsu/system';
import { EventBus, EventSubscriber } from 'msfssdk';
import { PowerSupplyBusTypes } from 'systems-host/systems/powersupply';

export class AtsuSystem {
    private readonly powerSupply: EventSubscriber<PowerSupplyBusTypes>;

    private readonly digitalInputs: DigitalInputs;

    private readonly digitalOutputs: DigitalOutputs;

    private readonly atsu: Atsu;

    private readonly datalink: Datalink;

    constructor(private readonly bus: EventBus) {
        this.digitalInputs = new DigitalInputs(this.bus);
        this.digitalOutputs = new DigitalOutputs(this.bus);
        this.atsu = new Atsu(this.bus, this.digitalInputs, this.digitalOutputs);
        this.datalink = new Datalink(this.bus, false, this.digitalInputs, this.digitalOutputs);

        this.powerSupply = this.bus.getSubscriber<PowerSupplyBusTypes>();
        this.powerSupply.on('acBus1').handle((powered: boolean) => {
            if (powered) {
                this.datalink.powerUp();
                this.atsu.powerUp();
                this.digitalInputs.powerUp();
            } else {
                this.digitalInputs.powerDown();
                this.atsu.powerDown();
                this.datalink.powerDown();
            }
        });
    }

    public connectedCallback(): void {
        this.digitalInputs.initialize();
        this.digitalInputs.connectedCallback();
    }

    public startPublish(): void {
        this.digitalInputs.startPublish();
    }

    public update(): void {
        this.digitalInputs.update();
    }
}
