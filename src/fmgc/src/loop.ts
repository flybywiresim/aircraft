import { FmgcComponent } from '@fmgc/lib/FmgcComponent';
import { FmsMessages } from '@fmgc/components/FmsMessages';
import { EfisLabels } from '@fmgc/components/EfisLabels';
import { FlightPlanManager } from '@fmgc/wtsdk';

const components: FmgcComponent[] = [
    FmsMessages.instance,
    new EfisLabels(),
];

export function initFmgcLoop(): void {
    // FIXME we need a better way to fetch this... maybe just make it a singleton
    const flightPlanManager = FlightPlanManager.DEBUG_INSTANCE;

    components.forEach((component) => component.init(flightPlanManager));
}

export function updateFmgcLoop(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}
