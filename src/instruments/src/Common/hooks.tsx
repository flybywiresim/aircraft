//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import React, { useCallback } from 'react';
import { getRootElement } from './defaults';

/**
 * Hook that requests a callback on every frame.
 *
 * This hook allows specifying dependencies through the `additionalDeps` parameter. However, you should probably not use that;
 * if you are getting a SimVar value every frame through a hook, for example, it might be better to just retrieve the variable
 * inside the callback. This avoids unnecessary re-renders of your component if that variable is only used in this callback.
 *
 * Only use dependencies if you absolutely must keep up with a component state in the callback.
 *
 * @param handler           a callback function, called every time MSFS fires an update event. This varies based on
 *                          the "GLASS COCKPIT REFRESH RATE" sim setting, but takes deltaTime for stability.
 * @param additionalDeps    an array of dependencies. this acts just like the same parameter on {@link useCallback}, which is
 *                          actually what is used internally.
 */
export const useUpdate = (handler: (deltaTime: number) => void, additionalDeps: any[] = []) => {
    const callback = useCallback(handler, additionalDeps);

    // Logic based on https://usehooks.com/useEventListener/
    const savedHandler = React.useRef(callback);
    React.useEffect(() => {
        savedHandler.current = callback;
    }, [callback]);

    React.useEffect(() => {
        const wrappedHandler = (event: CustomEvent) => {
            savedHandler.current(event.detail);
        };

        getRootElement().addEventListener('update', wrappedHandler);
        return () => {
            getRootElement().removeEventListener('update', wrappedHandler);
        };
    }, []);
};

export const useInteractionEvent = (event: string, handler: (any?) => void): void => {
    // Logic based on https://usehooks.com/useEventListener/
    const savedHandler = React.useRef(handler);
    React.useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    React.useEffect(() => {
        const wrappedHandler = (e) => {
            if (event === '*') {
                savedHandler.current(e.detail);
            } else {
                savedHandler.current();
            }
        };
        getRootElement().addEventListener(event, wrappedHandler);
        return () => {
            getRootElement().removeEventListener(event, wrappedHandler);
        };
    }, [event]);
};

export const useInteractionEvents = (events: string[], handler: (any?) => void): void => {
    // Logic based on https://usehooks.com/useEventListener/
    const savedHandler = React.useRef(handler);
    React.useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    React.useEffect(() => {
        const wrappedHandler = () => {
            savedHandler.current();
        };
        events.forEach((event) => getRootElement().addEventListener(event, wrappedHandler));
        return () => {
            events.forEach((event) => getRootElement().removeEventListener(event, wrappedHandler));
        };
    }, [
        ...events,
    ]);
};
