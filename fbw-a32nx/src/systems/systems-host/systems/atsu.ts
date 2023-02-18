import { Atc } from '@atsu/atc';
import { Aoc } from '@atsu/aoc';
import { Datalink } from '@atsu/communication';
import { EventBus, EventSubscriber } from 'msfssdk';
import { PowerSupplyBusTypes } from 'systems-host/systems/powersupply';

export class AtsuSystem {
    private readonly powerSupply: EventSubscriber<PowerSupplyBusTypes>;

    private readonly atc: Atc;

    private readonly aoc: Aoc;

    private readonly datalink: Datalink;

    constructor(private readonly bus: EventBus) {
        this.datalink = new Datalink(this.bus, false, false);
        this.atc = new Atc(this.bus, false, false);
        this.aoc = new Aoc(this.bus, false, false);

        this.powerSupply = this.bus.getSubscriber<PowerSupplyBusTypes>();
        this.powerSupply.on('acBus1').handle((powered: boolean) => {
            if (powered) {
                this.datalink.powerUp();
                this.atc.powerUp();
                this.aoc.powerUp();
            } else {
                this.aoc.powerDown();
                this.atc.powerDown();
                this.datalink.powerDown();
            }
        });
    }

    public connectedCallback(): void {
        this.datalink.startPublish();
        this.atc.initialize();
        this.aoc.initialize();
    }

    public startPublish(): void {
        this.datalink.startPublish();
        this.atc.startPublish();
        this.aoc.startPublish();
    }

    public update(): void {
        this.datalink.update();
        this.atc.update();
        this.aoc.update();
    }
}
