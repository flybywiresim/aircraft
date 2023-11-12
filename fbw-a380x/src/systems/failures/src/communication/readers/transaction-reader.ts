import { CallbackReader, Updatable, Writer } from '..';

/**
 * Provides transactional reading on top of another reader.
 *
 * Requires that the variable is written by a transactional writer.
 */
export class TransactionReader implements CallbackReader {
    private valueSimVar: CallbackReader;

    private transactionSimVar: Writer & Updatable;

    constructor(valueSimVar: CallbackReader, transactionSimVar: Writer & Updatable) {
        this.valueSimVar = valueSimVar;
        this.transactionSimVar = transactionSimVar;
    }

    register(identifier: number, callback: () => void): void {
        this.valueSimVar.register(identifier, () => {
            callback();
            this.transactionSimVar.write(identifier);
        });
    }

    update(): void {
        this.valueSimVar.update();
        this.transactionSimVar.update();
    }
}
