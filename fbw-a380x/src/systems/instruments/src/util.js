import { useEffect, useRef } from 'react';

export const renderTarget = document.getElementById('MSFS_REACT_MOUNT');
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
  __proto__: null,
  'GPS POSITION LAT': 'degrees latitude',
  'L:APU_GEN_ONLINE': 'Bool',
  'L:A32NX_EXT_PWR_AVAIL:1': 'Bool',
  'EXTERNAL POWER ON': 'Bool',
  'L:A32NX_COLD_AND_DARK_SPAWN': 'Bool',
};

const SIMVAR_CACHE = new Map();
customElement.addEventListener('update', () => {
  SIMVAR_CACHE.clear();
});

export function getSimVar(name, type) {
  if (!SIMVAR_CACHE.has(name)) {
    SIMVAR_CACHE.set(name, SimVar.GetSimVarValue(name, type || SIMVAR_TYPES[name]));
  }
  return SIMVAR_CACHE.get(name);
}

export function setSimVar(name, value, type = SIMVAR_TYPES[name]) {
  SIMVAR_CACHE.delete(name);
  return SimVar.SetSimVarValue(name, type, value);
}

export const createDeltaTimeCalculator = (startTime = Date.now()) => {
  let lastTime = startTime;

  return () => {
    const nowTime = Date.now();
    const deltaTime = nowTime - lastTime;
    lastTime = nowTime;

    return deltaTime;
  };
};
