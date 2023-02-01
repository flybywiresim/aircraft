import { TcasComponent } from './lib/TcasComponent';
import { TcasComputer } from './components/TcasComputer';

const components: TcasComponent[] = [
    TcasComputer.instance,
];

export function initTcasLoop(): void {
    components.forEach((component) => component.init());
}

export function updateTcasLoop(deltaTime: number): void {
    components.forEach((component) => component.update(deltaTime));
}
