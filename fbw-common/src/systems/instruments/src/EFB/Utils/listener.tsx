import { useEffect, useState } from 'react';

/**
 * Registers a view listener and returns the listener object.
 *
 * Usage example:
 * ```tsx
 *     const onSetPlayerData = (data: CommunityPanelPlayerData) => {
 *         setVersion(data.sBuildVersion);
 *     };
 *     useViewListenerEvent('JS_LISTENER_COMMUNITY', 'SetGamercardInfo', onSetPlayerData);
 * ```
 *
 * @param viewListenerName the name of the listener channel, e.g. 'JS_LISTENER_COMMUNITY' or 'JS_LISTENER_COMM_BUS'
 * @param eventName the name of the event to listen for, e.g. 'SetGamercardInfo' or 'AIRCRAFT_PRESET_WASM_CALLBACK'
 * @param callback the callback function to be called when the event is triggered
 */
export const useViewListenerEvent = (
  viewListenerName: string,
  eventName: string,
  callback: (...args: unknown[]) => void,
) => {
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
