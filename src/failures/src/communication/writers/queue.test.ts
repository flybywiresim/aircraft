import { Queue } from './queue';

function queue() {
    return new Queue<number>();
}

test('empty queue is empty', () => {
    expect(queue().size()).toBe(0);
});

test('dequeue on empty queue returns undefined', () => {
    expect(queue().dequeue()).toBeUndefined();
});

test('enqueue adds an item to the queue', () => {
    const q = queue();
    q.enqueue(1);

    expect(q.size()).toBe(1);
});

test('dequeue removes an item from the queue', () => {
    const q = queue();
    q.enqueue(1);

    expect(q.dequeue()).toBe(1);
});

test('dequeue decreases the queue length by one', () => {
    const q = queue();
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    const length = q.size();

    q.dequeue();

    expect(q.size()).toBe(length - 1);
});

test('dequeue returns the earliest enqueued item', () => {
    const q = queue();
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);

    expect(q.dequeue()).toBe(1);
});
