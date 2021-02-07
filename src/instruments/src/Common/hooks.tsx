import React from 'react';
import { rootElement } from './defaults';

export const useUpdate = (handler: (deltaTime: number) => void) => {
    // Logic based on https://usehooks.com/useEventListener/
    const savedHandler = React.useRef(handler);
    React.useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    React.useEffect(() => {
        const wrappedHandler = (event: CustomEvent) => {
            savedHandler.current(event.detail);
        };
        rootElement.addEventListener('update', wrappedHandler);
        return () => {
            rootElement.removeEventListener('update', wrappedHandler);
        };
    });
}

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
        rootElement.addEventListener(event, wrappedHandler);
        return () => {
            rootElement.removeEventListener(event, wrappedHandler);
        };
    }, [event]);
}

export const useInteractionEvents = (events: string[], handler: (any?) => void): void => {
    // Logic based on https://usehooks.com/useEventListener/
    const savedHandler = React.useRef(handler);
    React.useEffect(() => {
        savedHandler.current = handler;
    }, [handler]);

    React.useEffect(() => {
        const wrappedHandler = (e) => {
            savedHandler.current();
        };
        events.forEach(event =>
            rootElement.addEventListener(event, wrappedHandler)
        );
        return () => {
            events.forEach(event =>
                rootElement.removeEventListener(event, wrappedHandler)
            );
        };
    }, [
        ...events,
    ]);
}
