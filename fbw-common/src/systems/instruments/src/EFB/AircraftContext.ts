//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { createContext } from 'react';
import { LandingPerformanceCalculator } from '../../../shared/src/performance/landing';
import { TakeoffPerformanceCalculator } from '../../../shared/src/performance/takeoff';

interface PerformanceCalculators {
  takeoff: TakeoffPerformanceCalculator | null;
  landing: LandingPerformanceCalculator | null;
}

interface SettingsPages {
  autoCalloutsPage: React.ComponentType<any>;
}

interface AircraftEfbContext {
  performanceCalculators: PerformanceCalculators;
  settingsPages: SettingsPages;
}

export const AircraftContext = createContext<AircraftEfbContext>({
  performanceCalculators: {
    takeoff: null,
    landing: null,
  },
  settingsPages: {
    autoCalloutsPage: null,
  },
});
