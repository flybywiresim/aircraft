import { CallbackReader, Reader } from '.';
import { Writer } from './writer';

/**
 * Reads (either directly or through a callback) and writes variables.
 */
export class SimVarReaderWriter implements CallbackReader, Reader, Writer {
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

    write(value: number): Promise<void> {
        return SimVar.SetSimVarValue(this.simVarName, 'number', value);
    }

    private handles(identifier: number) {
        return this.callbacks[identifier] !== undefined;
    }

    private notify(identifier: number) {
        this.callbacks[identifier]();
    }
}
