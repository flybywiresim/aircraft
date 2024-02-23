import { useEffect, useState } from 'react';

export const useViewListenerEvent = (viewListenerName: string, eventName: string, callback: (...args: unknown[]) => void) => {
    const [listener, setListener] = useState<ViewListener.ViewListener | null>(null);

    useEffect(() => {
        const listener = RegisterViewListener(viewListenerName, undefined, false);

        setListener(listener);

        return () => {
            setListener(null);
            listener.unregister();
        };
    }, []);

    useEffect(() => {
        if (!listener) {
            return undefined;
        }

        listener.on(eventName, callback);

        return () => listener.off(eventName, callback);
    }, [listener]);
};
