import { Reader, Updatable, Writer } from '..';

export const RETRY_AFTER_NO_OF_UPDATES = 30;

export class TransactionWriter implements Writer {
    private innerWriter: Writer & Updatable;

    private transactionReader: Reader;

    private transactionWriter: Writer;

    private expectedWrites: Record<number, ExpectedWriteContext> = {};

    constructor(innerWriter: Writer & Updatable, transactionReader: Reader, transactionWriter: Writer) {
        this.innerWriter = innerWriter;
        this.transactionReader = transactionReader;
        this.transactionWriter = transactionWriter;
    }

    async write(value: number): Promise<void> {
        return this.innerWriter.write(value).then(() => new Promise((resolve) => {
            this.addExpectedWrite(value, resolve);
        }));
    }

    update(): void {
        this.innerWriter.update();

        if (Object.keys(this.expectedWrites).length > 0) {
            const transactionSimVarValue = this.transactionReader.read();
            this.forEachExpectedWriteContext((context) => {
                if (context.value === transactionSimVarValue) {
                    this.transactionWriter.write(0).then(() => {
                        context.resolve();
                    });
                    delete this.expectedWrites[context.value];
                }
            });
        }

        this.forEachExpectedWriteContext((context) => {
            context.waitedUpdates++;
            if (context.waitedUpdates >= RETRY_AFTER_NO_OF_UPDATES) {
                this.retryWrite(context);
            }
        });
    }

    private retryWrite(context: ExpectedWriteContext) {
        // Remove the existing write, to ensure we do not check and confirm
        // during the retry attempt of the write.
        delete this.expectedWrites[context.value];

        this.innerWriter.write(context.value).then(() => {
            // The caller is waiting for the original resolve function to be called,
            // thus we pass it to the new expectation here.
            this.addExpectedWrite(context.value, context.resolve);
        });
    }

    private forEachExpectedWriteContext(func: (context: ExpectedWriteContext) => void) {
        Object.entries(this.expectedWrites).forEach(([_, context]: [string, ExpectedWriteContext]) => {
            func(context);
        });
    }

    private addExpectedWrite(value: number, resolve: () => void) {
        this.expectedWrites[value] = { waitedUpdates: 0, value, resolve };
    }
}

interface ExpectedWriteContext {
    waitedUpdates: number,
    value: number,
    resolve: () => void,
}
