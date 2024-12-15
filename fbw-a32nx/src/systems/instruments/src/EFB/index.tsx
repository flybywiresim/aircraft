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
import { EventBus } from '@microsoft/msfs-sdk';

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
      pushbackPage: {
        turnIndicatorTuningDefault: 1.35,
      },
      settingsPages: {
        audio: {
          announcements: true,
          boardingMusic: true,
          engineVolume: true,
          masterVolume: true,
          windVolume: true,
          ptuCockpit: true,
          paxAmbience: true,
        },
        // FIXME: just inject the aircraft options page from the aircraft context (or plugin in flypadOSv4).
        pinProgram: {
          latLonExtend: true,
          paxSign: true,
          rmpVhfSpacing: true,
          satcom: true,
        },
        realism: {
          mcduKeyboard: true,
          pauseOnTod: true,
          pilotAvatars: true,
          eclSoftKeys: false,
        },
        sim: {
          cones: true,
          msfsFplnSync: true,
          pilotSeat: false,
          registrationDecal: true,
          wheelChocks: true,
          cabinLighting: false,
        },
        throttle: {
          numberOfAircraftThrottles: 2,
          axisOptions: [1, 2],
          axisMapping: [
            [[1, 2]], // 1
            [[1], [2]], // 2
          ],
        },
        autoCalloutsPage: AutomaticCallOutsPage,
      },
    }}
  >
    <EfbWrapper failures={A320FailureDefinitions} aircraftSetup={aircraftEfbSetup} eventBus={new EventBus()} />
  </AircraftContext.Provider>,
  true,
  true,
);
