import { Queue } from './queue';
import { CallbackReader, Reader, Writer } from '..';

/**
 * Writes values to a SimVar one after the other, waiting for the SimVar to be
 * consumed (set to 0) before writing the next value.
 */
export class QueuedSimVarWriter implements Writer {
    private reader: CallbackReader & Reader;

    private writer: Writer;

    private messageQueue: Queue<() => WritingContext>;

    private context: WritingContext | undefined;

    constructor(reader: CallbackReader & Reader, writer: Writer) {
        this.reader = reader;
        this.writer = writer;
        this.messageQueue = new Queue<() => WritingContext>();
        this.context = undefined;
    }

    write(value: number): Promise<void> {
        return new Promise<void>((resolve) => {
            this.messageQueue.enqueue(() => {
                const context: WritingContext = {
                    value,
                    isWritten: false,
                    resolve,
                };
                this.writer.write(value).then(() => {
                    context.isWritten = true;
                });

                return context;
            });

            // Whenever possible do not wait for an update before writing.
            this.immediatelyWriteWhenAble();
        });
    }

    update() {
        if (this.isWriting()) {
            if (this.context.isWritten && this.isReadByConsumer()) {
                this.finaliseWriting();
            }
        } else if (this.messageQueue.size() > 0) {
            this.writeNext();
        }
    }

    private isWriting(): boolean {
        return this.context !== undefined;
    }

    private writeNext() {
        const write = this.messageQueue.dequeue();
        this.context = write();
    }

    private finaliseWriting() {
        this.context.resolve();
        this.context = undefined;
    }

    private isReadByConsumer() {
        return this.reader.read() !== this.context.value;
    }

    private immediatelyWriteWhenAble() {
        if (!this.isWriting() && this.messageQueue.size() === 1) {
            this.writeNext();
        }
    }
}

interface WritingContext {
    value: number,
    isWritten: boolean,
    resolve: () => void,
}
