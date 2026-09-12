// @ts-strict-ignore
// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import React, { useContext, useEffect, useState } from 'react';
import { logTroubleshootingError, TroubleshootingEvents } from '../../../shared/src/Troubleshooting';
import { useViewListenerEvent } from './Utils/listener';

const TroubleshootingContext = React.createContext<string[]>(undefined as any);

interface TroubleshootingContextProps {
  eventBus: EventBus;
}

export const TroubleshootingContextProvider: React.FC<TroubleshootingContextProps> = ({ eventBus, children }) => {
  const [errorLog, setErrorLog] = useState([] as string[]);

  useEffect(() => {
    let log = [];
    const sub = eventBus
      .getSubscriber<TroubleshootingEvents>()
      .on('troubleshooting_log_error')
      .handle((err) => {
        log = [`${new Date().toISOString()}: ${err}`, ...log];
        setErrorLog(log);
      });
    return () => {
      sub.destroy();
    };
  }, []);

  useViewListenerEvent('JS_LISTENER_COMM_BUS', 'FBW_SYSTEMS_TROUBLESHOOTING_LOG', (message: string) =>
    logTroubleshootingError(eventBus, message),
  );

  return <TroubleshootingContext.Provider value={errorLog}>{children}</TroubleshootingContext.Provider>;
};

export const useTroubleshooting = () => useContext(TroubleshootingContext);
