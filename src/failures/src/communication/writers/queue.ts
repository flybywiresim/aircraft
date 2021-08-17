export class Queue<T> {
    private store: T[] = [];

    enqueue(val: T) {
        this.store.push(val);
    }

    dequeue(): T | undefined {
        return this.store.shift();
    }

    size(): number {
        return this.store.length;
    }
}
