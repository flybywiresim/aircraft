import { FmgcComponent } from '@fmgc/lib/FmgcComponent';
import { FmsMessages } from '@fmgc/components/FmsMessages';
import { EfisLabels } from '@fmgc/components/EfisLabels';

const components: FmgcComponent[] = [
    FmsMessages.instance,
    new EfisLabels(),
];

export function initFmgcLoop(): void {
    components.forEach((component) => component.init());
}

export function updateFmgcLoop(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}
