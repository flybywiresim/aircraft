//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { createContext } from 'react';

interface SettingsPages {
  autoCalloutsPage: React.ComponentType<any>;
}

interface AircraftEfbContext {
  settingsPages: SettingsPages;
}

export const AircraftContext = createContext<AircraftEfbContext>({
  settingsPages: {
    autoCalloutsPage: null,
  },
});
