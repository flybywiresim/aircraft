import { Atc } from '@datalink/atc';
import { Aoc } from '@datalink/aoc';
import { Router } from '@datalink/communication';
import { EventBus, EventSubscriber } from 'msfssdk';
import { PowerSupplyBusTypes } from 'systems-host/systems/powersupply';

export class AtsuSystem {
    private readonly powerSupply: EventSubscriber<PowerSupplyBusTypes>;

    private readonly atc: Atc;

    private readonly aoc: Aoc;

    private readonly router: Router;

    constructor(private readonly bus: EventBus) {
        this.router = new Router(this.bus, false, false);
        this.atc = new Atc(this.bus, false, false);
        this.aoc = new Aoc(this.bus, false, false);

        this.powerSupply = this.bus.getSubscriber<PowerSupplyBusTypes>();
        this.powerSupply.on('acBus1').handle((powered: boolean) => {
            if (powered) {
                this.router.powerUp();
                this.atc.powerUp();
                this.aoc.powerUp();
            } else {
                this.aoc.powerDown();
                this.atc.powerDown();
                this.router.powerDown();
            }
        });
    }

    public connectedCallback(): void {
        this.router.initialize();
        this.atc.initialize();
        this.aoc.initialize();
    }

    public startPublish(): void {
        this.router.startPublish();
        this.atc.startPublish();
        this.aoc.startPublish();
    }

    public update(): void {
        this.router.update();
        this.atc.update();
        this.aoc.update();
    }
}
