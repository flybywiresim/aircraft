import { Reader, Updatable, Writer } from '..';

/**
 * Provides transactional writing on top of another writer.
 *
 * Requires that the written variable is read by a transactional reader.
 */
export class TransactionWriter implements Writer {
    private retryAfterNumberOfUpdates: number;

    private valueSimVar: Writer & Updatable;

    private transactionSimVar: Reader & Writer;

    private openTransactions: Record<number, Transaction> = {};

    /**
     *
     * @param valueSimVar The writer to use for writing values.
     * @param transactionSimVar The reader/writer to use for managing the transaction.
     * @param retryAfterNumberOfUpdates The number of calls to `update` to wait before making another write attempt. Defaults to 30.
     */
    constructor(valueSimVar: Writer & Updatable, transactionSimVar: Reader & Writer, retryAfterNumberOfUpdates?: number) {
        this.retryAfterNumberOfUpdates = retryAfterNumberOfUpdates || 30;
        this.valueSimVar = valueSimVar;
        this.transactionSimVar = transactionSimVar;
    }

    /**
     * Writes the value to the underlying writer and waits for a transactional
     * reader to confirm the successful reading of the value after which the Promise resolves.
     */
    async write(value: number): Promise<void> {
        return new Promise((resolve) => {
            this.valueSimVar.write(value).then(() => {
                this.addTransaction(value, resolve);
            });
        });
    }

    update(): void {
        this.valueSimVar.update();

        if (!this.hasOpenTransactions()) {
            return;
        }

        this.resolveTransactionWithValue(this.transactionSimVar.read());
        this.increaseTransactionsWaitingDuration();
        this.retryWriteForExpiredTransactions();
    }

    private resolveTransactionWithValue(value: number) {
        Object.values(this.openTransactions)
            .filter((transaction) => transaction.value === value)
            .forEach((transaction) => this.resolveTransaction(transaction));
    }

    private increaseTransactionsWaitingDuration() {
        Object.values(this.openTransactions).forEach((transaction) => {
            transaction.waitedUpdates++;
        });
    }

    private retryWriteForExpiredTransactions() {
        Object.values(this.openTransactions)
            .filter((transaction) => transaction.waitedUpdates >= this.retryAfterNumberOfUpdates)
            .forEach((transaction) => this.retryWrite(transaction));
    }

    private retryWrite(transaction: Transaction) {
        // Remove the existing write, to ensure we do not check and confirm
        // during the retry attempt of the write.
        this.removeTransaction(transaction.value);

        this.valueSimVar.write(transaction.value).then(() => {
            // The caller is waiting for the original resolve function to be called,
            // thus we pass it to the new expectation here.
            this.addTransaction(transaction.value, transaction.resolve);
        });
    }

    private hasOpenTransactions() {
        return Object.keys(this.openTransactions).length > 0;
    }

    private addTransaction(value: number, resolve: () => void) {
        this.openTransactions[value] = { waitedUpdates: 0, value, resolve };
    }

    private resolveTransaction(transaction: Transaction) {
        this.transactionSimVar.write(0).then(() => {
            transaction.resolve();
        });
        this.removeTransaction(transaction.value);
    }

    private removeTransaction(value: number) {
        delete this.openTransactions[value];
    }
}

interface Transaction {
    waitedUpdates: number,
    value: number,
    resolve: () => void,
}
