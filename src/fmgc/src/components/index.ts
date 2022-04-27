import { ReadySignal } from '@fmgc/components/ReadySignal';
import { FlightPlanManager } from '@fmgc/wtsdk';
import { EfisLabels } from './EfisLabels';
import { FmgcComponent } from './FmgcComponent';
import { FmsMessages } from './fms-messages';

const fmsMessages = new FmsMessages();

const components: FmgcComponent[] = [
    fmsMessages,
    new EfisLabels(),
    new ReadySignal(),
];

export function initComponents(baseInstrument: BaseInstrument, flightPlanManager: FlightPlanManager): void {
    components.forEach((component) => component.init(baseInstrument, flightPlanManager));
}

export function updateComponents(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}

export function recallMessageById(id: number) {
    fmsMessages.recallId(id);
}
