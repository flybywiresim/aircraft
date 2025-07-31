// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { GenericDataListenerSync } from '../../../shared/src/GenericDataListenerSync';
import { getRootElement } from '../defaults';

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
  }, [...events]);
};

export const useCoherentEvent = (event: string, handler: (...any) => void): void => {
  const savedHandler = React.useRef(handler);
  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  React.useEffect(() => {
    console.log('hooking coherent event', event);
    const coherentHandler = Coherent.on(event, savedHandler.current);
    console.log(coherentHandler);
    return () => {
      coherentHandler.clear();
    };
  }, [event]);
};

export const useFlowSyncEvent = (event: string, handler: (topic: string, data: any) => void): void => {
  const savedHandler = React.useRef(handler);
  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  React.useEffect(() => {
    const genericEventHandler = new GenericDataListenerSync(savedHandler.current, event);
    return () => {
      genericEventHandler.stop();
    };
  }, [event]);
};
