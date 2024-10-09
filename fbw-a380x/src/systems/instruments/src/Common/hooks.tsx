/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import { FlowEventSync } from '@shared/FlowEventSync';
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

declare const Coherent: any;
export const useCoherentEvent = (event: string, handler: (any?) => void): void => {
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
    const flowEventHandler = new FlowEventSync(savedHandler.current, event);
    return () => {
      flowEventHandler.stop();
    };
  }, [event]);
};
