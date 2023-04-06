import { AbstractSubscribable, MappedSubject } from '..';
/**
 * A subscribable subject which derives its value from an event consumer.
 */
export class ConsumerSubject extends AbstractSubscribable {
    /**
     * Constructor.
     * @param consumer The event consumer from which this subject obtains its value.
     * @param initialVal This subject's initial value.
     * @param equalityFunc The function this subject uses check for equality between values.
     * @param mutateFunc The function this subject uses to change its value. If not defined, variable assignment is used
     * instead.
     */
    constructor(consumer, initialVal, equalityFunc, mutateFunc) {
        super();
        this.consumer = consumer;
        this.equalityFunc = equalityFunc;
        this.mutateFunc = mutateFunc;
        this.consumerHandler = this.onEventConsumed.bind(this);
        this.value = initialVal;
        consumer.handle(this.consumerHandler);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    static create(consumer, initialVal, equalityFunc, mutateFunc) {
        return new ConsumerSubject(consumer, initialVal, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : AbstractSubscribable.DEFAULT_EQUALITY_FUNC, mutateFunc);
    }
    /**
     * Consumes an event.
     * @param value The value of the event.
     */
    onEventConsumed(value) {
        if (!this.equalityFunc(this.value, value)) {
            if (this.mutateFunc) {
                this.mutateFunc(this.value, value);
            }
            else {
                this.value = value;
            }
            this.notify();
        }
    }
    /** @inheritdoc */
    get() {
        return this.value;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    map(fn, equalityFunc, mutateFunc, initialVal) {
        const mapFunc = (inputs, previousVal) => fn(inputs[0], previousVal);
        return mutateFunc
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ? MappedSubject.create(mapFunc, equalityFunc, mutateFunc, initialVal, this)
            : MappedSubject.create(mapFunc, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : AbstractSubscribable.DEFAULT_EQUALITY_FUNC, this);
    }
    /**
     * Destroys this subject. Once destroyed, it will no longer consume events to update its value.
     */
    destroy() {
        this.consumer.off(this.consumerHandler);
    }
}
