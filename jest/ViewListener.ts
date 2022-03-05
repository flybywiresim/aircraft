export let listeners = {};

/** @type {Partial<ViewListener.ViewListener>} */
export const MockViewListener = {
    triggerToAllSubscribers: jest.fn((event, ...args) => {
        const subs = listeners[event];

        const jsonArgs = args.map((it) => JSON.stringify(it)).map((it) => JSON.parse(it));

        if (subs) {
            for (const sub of subs) {
                sub(event, ...jsonArgs);
            }
        }
    }),
};