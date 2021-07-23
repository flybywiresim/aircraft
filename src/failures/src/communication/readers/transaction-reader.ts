import { CallbackReader, Updatable, Writer } from '..';

export class TransactionReader implements CallbackReader {
    private innerReader: CallbackReader;

    private callbacks: Record<number, () => void> = {};

    private transactionWriter: Writer & Updatable;

    constructor(innerReader: CallbackReader, transactionWriter: Writer & Updatable) {
        this.innerReader = innerReader;
        this.transactionWriter = transactionWriter;
    }

    register(identifier: number, callback: () => void): void {
        this.callbacks[identifier] = callback;
        this.innerReader.register(identifier, () => {
            this.callbacks[identifier]();
            this.transactionWriter.write(identifier);
        });
    }

    update(): void {
        this.innerReader.update();
        this.transactionWriter.update();
    }
}
