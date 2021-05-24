import React, { useState } from 'react';
import { getRootElement } from './defaults';

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
        getRootElement().addEventListener('update', wrappedHandler);
        return () => {
            getRootElement().removeEventListener('update', wrappedHandler);
        };
    });
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

export const useSessionStorage = (key: string, initialValue: any) => {
    // useSessionStorage hook to allow the use of Session Storage to persist
    // state during a session and works in the same fashion as useState
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.log(error);
            return initialValue;
        }
    });

    const setValue = (value: any) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (err) {
            console.error(err);
        }
    };
    return [storedValue, setValue];
};
