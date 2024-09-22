import { LegacyTcasComputer } from 'systems-host/systems/tcas/components/LegacyTcasComputer';
import { TcasComponent } from 'systems-host/systems/tcas/lib/TcasComponent';

const components: TcasComponent[] = [
    LegacyTcasComputer.instance,
];

export function initTcasLoop(): void {
    components.forEach((component) => component.init());
}

export function updateTcasLoop(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}
