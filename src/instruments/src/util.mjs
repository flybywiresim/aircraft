/* global SimVar */

import { useEffect, useRef } from 'react';

export const renderTarget = document.getElementById('A32NX_REACT_MOUNT');
export const customElement = renderTarget.parentElement;

// @param {() => void} handler
export function useInteractionEvent(event, handler) {
  // Logic based on https://usehooks.com/useEventListener/
  const savedHandler = useRef(handler);
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler = (e) => {
      if (event === '*') {
        savedHandler.current(e.detail);
      } else {
        savedHandler.current();
      }
    };
    customElement.addEventListener(event, wrappedHandler);
    return () => {
      customElement.removeEventListener(event, wrappedHandler);
    };
  }, [event]);
}

// @param {(deltaTime: number) => void} handler
export function useUpdate(handler) {
  // Logic based on https://usehooks.com/useEventListener/
  const savedHandler = useRef(handler);
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler = (event) => {
      savedHandler.current(event.detail);
    };
    customElement.addEventListener('update', wrappedHandler);
    return () => {
      customElement.removeEventListener('update', wrappedHandler);
    };
  });
}

const SIMVAR_TYPES = {
  '__proto__': null,
  'GPS POSITION LAT': 'degrees latitude',
};

const SIMVAR_CACHE = new Map();
customElement.addEventListener('update', () => {
  SIMVAR_CACHE.clear();
});

export function getSimVar(name, type = SIMVAR_TYPES[name]) {
  if (!SIMVAR_CACHE.has(name)) {
    SIMVAR_CACHE.set(name, SimVar.GetSimVarValue(name, type));
  }
  return SIMVAR_CACHE.get(name);
}

export function setSimVar(name, value, type = SIMVAR_TYPES[name]) {
  SIMVAR_CACHE.delete(name);
  return SimVar.SetSimVarValue(name, type, value);
}
