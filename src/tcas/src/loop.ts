import { TCasComponent } from '@tcas/lib/TCasComponent';
import { TCasComputer } from '@tcas/components/TCasComputer';

const components: TCasComponent[] = [
    TCasComputer.instance,
];

export function initTcasLoop(): void {
    components.forEach((component) => component.init());
}

export function updateTcasLoop(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}
