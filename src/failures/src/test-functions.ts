import { Updatable, Writer } from './communication';

export function flushPromises() {
    return new Promise((resolve) => setImmediate(resolve));
}

export function updateWriter(writer: Writer & Updatable, times: number) {
    for (let i = 0; i < times; i++) {
        writer.update();
    }
}
