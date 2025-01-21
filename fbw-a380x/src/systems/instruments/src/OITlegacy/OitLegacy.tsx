// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import {
  AircraftContext,
  Dispatch,
  ErrorFallback,
  EventBusContextProvider,
  FailuresOrchestratorProvider,
  ModalProvider,
  Navigation,
  PowerContext,
  PowerStates,
  setAirframeInfo,
  setCabinInfo,
  setFlypadInfo,
  store,
  TroubleshootingContextProvider,
} from '@flybywiresim/flypad';

import './Efb.scss';
import { EventBus } from '@microsoft/msfs-sdk';
import { Provider } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import { MemoryRouter as Router } from 'react-router';
import { NavigraphAuthProvider, UniversalConfigProvider, useSimVar } from '@flybywiresim/fbw-sdk';

export const getDisplayIndex = () => {
  const url = Array.from(document.querySelectorAll('vcockpit-panel > *'))
    ?.find((it) => it.tagName.toLowerCase() !== 'wasm-instrument')
    ?.getAttribute('url');

  return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

export interface OitEfbWrapperProps {
  eventBus: EventBus;
}

export const OitEfbWrapper: React.FC<OitEfbWrapperProps> = ({ eventBus }) => {
  const [powerState, setPowerState] = useState<PowerStates>(PowerStates.LOADED);

  const [showCharts] = useSimVar(`L:A32NX_OIS_${getDisplayIndex()}_SHOW_CHARTS`, 'Bool', 100);
  const [showOfp] = useSimVar(`L:A32NX_OIS_${getDisplayIndex()}_SHOW_OFP`, 'Bool', 100);

  const showEfbOverlay = showCharts === 1 || showOfp === 1;
  document.getElementsByTagName('a380x-oitlegacy')[0].classList.toggle('nopointer', !showEfbOverlay);

  const [err, setErr] = useState(false);

  useEffect(() => {
    UniversalConfigProvider.fetchAirframeInfo(process.env.AIRCRAFT_PROJECT_PREFIX, process.env.AIRCRAFT_VARIANT).then(
      (info) => store.dispatch(setAirframeInfo(info)),
    );

    UniversalConfigProvider.fetchFlypadInfo(process.env.AIRCRAFT_PROJECT_PREFIX, process.env.AIRCRAFT_VARIANT).then(
      (info) => store.dispatch(setFlypadInfo(info)),
    );

    UniversalConfigProvider.fetchCabinInfo(process.env.AIRCRAFT_PROJECT_PREFIX, process.env.AIRCRAFT_VARIANT).then(
      (info) => store.dispatch(setCabinInfo(info)),
    );
  }, []);

  useEffect(() => {
    document
      .getElementsByTagName('a380x-oitlegacy')[0]
      .setAttribute('style', 'position: absolute; left: 10px; top: 75px; width: 1313px; height: 860px;');
  }, []);

  return (
    <AircraftContext.Provider
      value={{
        performanceCalculators: {
          takeoff: null,
          landing: null,
        },
        pushbackPage: {
          turnIndicatorTuningDefault: 1.35,
        },
        settingsPages: {
          audio: {
            announcements: false,
            boardingMusic: false,
            engineVolume: true,
            masterVolume: true,
            windVolume: true,
            ptuCockpit: false,
            paxAmbience: false,
          },
          // FIXME: just inject the aircraft options page from the aircraft context (or plugin in flypadOSv4).
          pinProgram: {
            paxSign: false,
            satcom: false,
            latLonExtend: false,
            rmpVhfSpacing: false,
          },
          realism: {
            mcduKeyboard: false,
            pauseOnTod: true,
            pilotAvatars: false,
            eclSoftKeys: true,
          },
          sim: {
            cones: false,
            msfsFplnSync: false, // FIXME: Enable when MSFS FPLN sync is available
            pilotSeat: true,
            registrationDecal: false, // TODO FIXME: Enable when dynamic registration decal is completed
            wheelChocks: false,
            cabinLighting: true,
          },
          throttle: {
            numberOfAircraftThrottles: 4,
            axisOptions: [1, 2, 4],
            axisMapping: [
              [[1, 2, 3, 4]], // 1
              [
                [1, 2],
                [3, 4],
              ], // 2
              [[1], [2], [3], [4]], // 4
            ],
          },
          autoCalloutsPage: undefined,
        },
      }}
    >
      <Provider store={store}>
        <TroubleshootingContextProvider eventBus={eventBus}>
          <FailuresOrchestratorProvider failures={[]}>
            <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => setErr(false)} resetKeys={[err]}>
              <Router>
                <ModalProvider>
                  <EventBusContextProvider eventBus={eventBus}>
                    <NavigraphAuthProvider>
                      <PowerContext.Provider value={{ powerState, setPowerState }}>
                        {showEfbOverlay && (
                          <div
                            className="bg-theme-body"
                            style={{
                              backgroundColor: '#000',
                            }}
                          >
                            <div className="flex flex-row">
                              <div className="h-screen w-screen p-2.5 pt-0">
                                {showCharts === 1 && <Navigation />}
                                {showOfp === 1 && <Dispatch />}
                              </div>
                            </div>
                          </div>
                        )}
                      </PowerContext.Provider>
                    </NavigraphAuthProvider>
                  </EventBusContextProvider>
                </ModalProvider>
              </Router>
            </ErrorBoundary>
          </FailuresOrchestratorProvider>
        </TroubleshootingContextProvider>
      </Provider>
    </AircraftContext.Provider>
  );
};
