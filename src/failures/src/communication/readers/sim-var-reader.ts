import { CallbackReader, Reader } from '..';

export class SimVarReader implements CallbackReader, Reader {
    private simVarName: string;

    private callbacks: Record<number, () => void> = {};

    constructor(simVarName: string) {
        this.simVarName = simVarName;
    }

    register(identifier: number, callback: () => void): void {
        this.callbacks[identifier] = callback;
    }

    update(): void {
        const identifier = this.read();
        if (this.handles(identifier)) {
            this.notify(identifier);
        }
    }

    read(): number {
        return SimVar.GetSimVarValue(this.simVarName, 'number');
    }

    private handles(identifier: number) {
        return this.callbacks[identifier] !== undefined;
    }

    private notify(identifier: number) {
        this.callbacks[identifier]();
    }
}
