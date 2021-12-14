import { FlightPlanManager } from '@fmgc/wtsdk';
import { EfisLabels } from './EfisLabels';
import { FmgcComponent } from './FmgcComponent';
import { FmsMessages } from './fms-messages';

const fmsMessages = new FmsMessages();

const components: FmgcComponent[] = [
    fmsMessages,
    new EfisLabels(),
];

export function initComponents(): void {
    // FIXME we need a better way to fetch this... maybe just make it a singleton
    const flightPlanManager = FlightPlanManager.DEBUG_INSTANCE;

    components.forEach((component) => component.init(flightPlanManager));
}

export function updateComponents(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}

export function recallMessageById(id: number) {
    fmsMessages.recallId(id);
}
