// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import { render } from '@instruments/common/index';
import { AircraftContext, EfbWrapper, syncSettingsFromPersistentStorage } from '@flybywiresim/flypad';
import { A320FailureDefinitions } from '@failures';
import { A320251NLandingCalculator } from '@shared/performance/a32nx_landing';
import { A320251NTakeoffPerformanceCalculator } from '@shared/performance/a32nx_takeoff';
import { AutomaticCallOutsPage } from './Pages/AutomaticCallOutsPage';
import { a32nxSyncedSettings } from 'instruments/src/EFB/settingsSync';

import './Efb.scss';

function aircraftEfbSetup(): void {
  syncSettingsFromPersistentStorage(a32nxSyncedSettings);
}

// TODO: Hoist failures context provider up to here
// This context provider will be replaced by a PluginBinder for fpadv4
render(
  <AircraftContext.Provider
    value={{
      performanceCalculators: {
        takeoff: new A320251NTakeoffPerformanceCalculator(),
        landing: new A320251NLandingCalculator(),
      },
      settingsPages: {
        autoCalloutsPage: AutomaticCallOutsPage,
      },
    }}
  >
    <EfbWrapper failures={A320FailureDefinitions} aircraftSetup={aircraftEfbSetup} />
  </AircraftContext.Provider>,
  true,
  true,
);
