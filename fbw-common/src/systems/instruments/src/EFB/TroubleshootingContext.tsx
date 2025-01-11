// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import React, { useContext, useState } from 'react';
import { TroubleshootingEvents } from 'shared/src/Troubleshooting';

const TroubleshootingContext = React.createContext<string[]>(undefined as any);

interface TroubleshootingContextProps {
  eventBus: EventBus;
}

export const TroubleshootingContextProvider: React.FC<TroubleshootingContextProps> = ({ eventBus, children }) => {
  const [errorLog, setErrorLog] = useState([] as string[]);

  eventBus
    .getSubscriber<TroubleshootingEvents>()
    .on('troubleshooting_log_error')
    .handle((err) => setErrorLog([`${new Date().toISOString()}: ${err}`, ...errorLog]));

  return <TroubleshootingContext.Provider value={errorLog}>{children}</TroubleshootingContext.Provider>;
};

export const useTroubleshooting = () => useContext(TroubleshootingContext);
