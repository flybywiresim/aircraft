// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';

import React, { useContext } from 'react';

const Context = React.createContext<EventBus>(undefined as any);

export const EventBusContextProvider: React.FC = ({ children }) => {
  const bus = new EventBus();
  return <Context.Provider value={bus}>{children}</Context.Provider>;
};

export const useEventBus = () => useContext(Context);
