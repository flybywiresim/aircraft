import { FmgcComponent } from '@fmgc/lib/FmgcComponent';
import { FmsMessages } from '@fmgc/components/FmsMessages';

const components: FmgcComponent[] = [
    FmsMessages.instance,
];

export function initFmgcLoop(): void {
    components.forEach((component) => component.init());
}

export function updateFmgcLoop(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}
