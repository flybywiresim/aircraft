import { Queue } from './queue';

describe('Queue', () => {
    test('is empty when nothing is enqueued', () => {
        expect(queue().size()).toBe(0);
    });

    test('dequeues undefined when empty', () => {
        expect(queue().dequeue()).toBeUndefined();
    });

    test('enqueues items', () => {
        const q = queue();
        q.enqueue(1);

        expect(q.size()).toBe(1);
    });

    test('removes the item when dequeueing', () => {
        const q = queue();
        q.enqueue(1);

        expect(q.dequeue()).toBe(1);
    });

    test('decreases its size by one when dequeueing', () => {
        const q = queue();
        q.enqueue(1);
        q.enqueue(2);
        q.enqueue(3);
        const length = q.size();

        q.dequeue();

        expect(q.size()).toBe(length - 1);
    });

    test('is "first in, first out"', () => {
        const q = queue();
        q.enqueue(1);
        q.enqueue(2);
        q.enqueue(3);

        expect(q.dequeue()).toBe(1);
    });
});

function queue() {
    return new Queue<number>();
}
