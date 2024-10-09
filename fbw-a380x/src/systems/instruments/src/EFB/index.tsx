// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { render } from '@instruments/common/index';
import { AircraftContext, EfbWrapper, syncSettingsFromPersistentStorage} from '@flybywiresim/flypad';
import { A380FailureDefinitions } from "../../../failures";
import { AutomaticCallOutsPage } from './Pages/AutomaticCallOutsPage';
import { a380xSyncedSettings } from 'instruments/src/EFB/settingsSync';

import './Efb.scss';

function aircraftEfbSetup(): void {
  syncSettingsFromPersistentStorage(a380xSyncedSettings);
}

// TODO: Hoist failures context provider up to here
// This context provider will be replaced by a PluginBinder for fpadv4
render(
  <AircraftContext.Provider
    value={{
      performanceCalculators: {
        takeoff: null,
        landing: null,
      },
      settingsPages: {
        autoCalloutsPage: AutomaticCallOutsPage,
      }
    }}
  >
    <EfbWrapper failures={A380FailureDefinitions} aircraftSetup={aircraftEfbSetup} />
  </AircraftContext.Provider>
);
