import { FmgcComponent } from './FmgcComponent';
import { FmsMessages } from './fms-messages';

const fmsMessages = new FmsMessages();

const components: FmgcComponent[] = [
    fmsMessages,
];

export function initComponents(): void {
    components.forEach((component) => component.init());
}

export function updateComponents(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}

export function recallMessageById(id: number) {
    fmsMessages.recallId(id);
}
