// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import {
  AircraftContext,
  Dispatch,
  ErrorFallback,
  EventBusContextProvider,
  FailuresOrchestratorProvider,
  fetchSimbriefDataAction,
  ModalProvider,
  Navigation,
  PowerContext,
  PowerStates,
  setAirframeInfo,
  setCabinInfo,
  setFlypadInfo,
  store,
  TroubleshootingContextProvider,
  useAppDispatch,
  useEventBus,
  useNavigraphAuthInfo,
} from '@flybywiresim/flypad';

import { EventBus, Subscription } from '@microsoft/msfs-sdk';
import { Provider } from 'react-redux';
import { ErrorBoundary } from 'react-error-boundary';
import { MemoryRouter as Router } from 'react-router';
import {
  FmsData,
  NavigraphAuthProvider,
  NXDataStore,
  UniversalConfigProvider,
  usePersistentProperty,
  useSimVar,
} from '@flybywiresim/fbw-sdk';
import { ToastContainer } from 'react-toastify';
import { OisInternalData } from '../OIT/OisInternalPublisher';
import { simbriefDataFromFms } from 'instruments/src/OITlegacy/utils';

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
            autoStepClimb: true,
          },
          sim: {
            cones: false,
            msfsFplnSync: false, // FIXME: Enable when MSFS FPLN sync is available
            pilotSeat: true,
            registrationDecal: false, // TODO FIXME: Enable when dynamic registration decal is completed
            wheelChocks: false,
            cabinLighting: true,
            oansPerformanceMode: true,
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
                        <ToastContainer position="top-center" draggableDirection="y" limit={2} />
                        <OitEfbPageWrapper eventBus={eventBus} />
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

const showChartSimvar = `L:A32NX_OIS_${getDisplayIndex()}_SHOW_CHARTS`;
const showOfpSimvar = `L:A32NX_OIS_${getDisplayIndex()}_SHOW_OFP`;

export const OitEfbPageWrapper: React.FC<OitEfbWrapperProps> = () => {
  const dispatch = useAppDispatch();

  const [showCharts] = useSimVar(showChartSimvar, 'Bool', 100);
  const [showOfp] = useSimVar(showOfpSimvar, 'Bool', 100);
  const [synchroAvionics] = useSimVar('L:A32NX_OIS_SYNCHRO_AVIONICS', 'number', 100);

  const [fromAirport, setFromAirport] = useState<string>('');
  const [toAirport, setToAirport] = useState<string>('');
  const [altnAirport, setAltnAirport] = useState<string>('');

  const navigraphAuthInfo = useNavigraphAuthInfo();
  const [overrideSimBriefUserID] = usePersistentProperty('CONFIG_OVERRIDE_SIMBRIEF_USERID');

  const [navigraphToken, setNavigraphToken] = useState<string>(NXDataStore.getLegacy('NAVIGRAPH_ACCESS_TOKEN'));
  const [reloadAircraft, setReloadAircraft] = useState<boolean>(false);

  const showEfbOverlay = (showCharts === 1 && !reloadAircraft) || showOfp === 1;
  document.getElementsByTagName('a380x-oitlegacy')[0].classList.toggle('nopointer', !showEfbOverlay);

  useEffect(() => {
    const cancelSub = NXDataStore.getAndSubscribeLegacy('NAVIGRAPH_ACCESS_TOKEN', (_, token) => {
      if (!navigraphToken && token) {
        setReloadAircraft(true);
      }
      setNavigraphToken(token);
    });

    return () => cancelSub();
  }, []);

  const bus = useEventBus();

  const updateSimBriefInfo = async () => {
    try {
      const action = await fetchSimbriefDataAction(
        (navigraphAuthInfo.loggedIn && navigraphAuthInfo.username) || '',
        overrideSimBriefUserID ?? '',
      );
      const newAction = simbriefDataFromFms(action.payload, fromAirport, toAirport, altnAirport);
      dispatch(newAction);
    } catch (e) {
      console.error(e.message);
    }
  };

  useEffect(() => {
    updateSimBriefInfo();
  }, [navigraphAuthInfo, synchroAvionics]);

  useEffect(() => {
    const sub = bus.getSubscriber<FmsData & OisInternalData>();
    const subs: Subscription[] = [];
    subs.push(
      sub.on('synchroAvncs').handle(() => {
        updateSimBriefInfo(); // never triggers, because synced messages in the same VCockpit don't work
      }),
    );
    subs.push(
      sub
        .on('fmsOrigin')
        .whenChanged()
        .handle((icao) => setFromAirport(icao)),
    );
    subs.push(
      sub
        .on('fmsDestination')
        .whenChanged()
        .handle((icao) => setToAirport(icao)),
    );
    subs.push(
      sub
        .on('fmsAlternate')
        .whenChanged()
        .handle((icao) => setAltnAirport(icao)),
    );

    return () => {
      subs.forEach((s) => s.destroy());
    };
  }, []);

  // Enable this for FMS auto-sync
  /* useEffect(() => {
    dispatch(simbriefDataFromFms(simBriefData, fromAirport, toAirport, altnAirport));
  }, [fromAirport, toAirport, altnAirport]);
  */

  return (
    <>
      {showEfbOverlay && (
        <div
          className="bg-theme-body"
          style={{
            backgroundColor: '#000',
          }}
        >
          <div className="flex flex-row">
            <div className="h-screen w-screen p-2.5 pt-0">
              {showCharts === 1 && !reloadAircraft && <Navigation />}
              {showOfp === 1 && <Dispatch />}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
