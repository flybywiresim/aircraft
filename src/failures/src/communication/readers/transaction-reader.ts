import { CallbackReader, Updatable, Writer } from '..';

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
