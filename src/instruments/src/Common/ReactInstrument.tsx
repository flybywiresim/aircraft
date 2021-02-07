import React from 'react';
import ReactDOM from 'react-dom';
import SimVarProvider, { renderTarget, rootElement } from './SimVarProvider';

/**
 * Use the given React element to render the instrument using React.
 */
export const render = (Slot: React.ReactElement) => {
    ReactDOM.render(<SimVarProvider>{Slot}</SimVarProvider>, renderTarget);
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

export const useUpdate = (handler: (any) => void) => {
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
