// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

import { render } from '@instruments/common/index';
import { AircraftContext, EfbWrapper, syncSettingsFromPersistentStorage } from '@flybywiresim/flypad';
import { A320FailureDefinitions } from '@failures';
import { AutomaticCallOutsPage } from './Pages/AutomaticCallOutsPage';
import { a32nxSyncedSettings } from 'instruments/src/EFB/settingsSync';

function aircraftEfbSetup(): void {
  syncSettingsFromPersistentStorage(a32nxSyncedSettings);
}

// TODO: Hoist failures context provider up to here
// This context provider will be replaced by a PluginBinder for fpadv4
render(
  <AircraftContext.Provider
    value={{
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
