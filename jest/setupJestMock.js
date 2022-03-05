/* global jest */
let values;

global.beforeEach(() => {
    values = {};
});

global.SimVar = {};
global.SimVar.GetSimVarValue = jest.fn((name, _, __) => {
    if (values.hasOwnProperty(name)) {
        return values[name];
    } else {
        return 0;
    }
});

global.SimVar.SetSimVarValue = jest.fn((name, _, value) => {
    return new Promise((resolve, _) => {
        values[name] = value;
        resolve();
    });
});

let listeners = {};

global.beforeEach(() => {
    listeners = {};
});

/** @type {Partial<ViewListener.ViewListener>} */
const MockViewListener = {
    triggerToAllSubscribers: jest.fn((event, ...args) => {
        const subs = listeners[event];

        const jsonArgs = args.map((it) => JSON.stringify(it)).map((it) => JSON.parse(it));

        if (subs) {
            for (const sub of subs) {
                sub(...jsonArgs);
            }
        }
    }),
};

global.RegisterViewListener = jest.fn((name, _, __) => {
    return MockViewListener;
});

/** @type {Partial<import("typings/fs-base-ui").Coherent>} */
global.Coherent = {
    on(event, callback) {
        const subs = listeners[event];

        if (subs && !subs.includes(callback)) {
            subs.push(callback);
        } else {
            listeners[event] = [callback];
        }
    },
};
