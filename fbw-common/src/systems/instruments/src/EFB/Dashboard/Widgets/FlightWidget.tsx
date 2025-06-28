// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IconPlane } from '@tabler/icons';
import { CloudArrowDown } from 'react-bootstrap-icons';
import { usePersistentNumberProperty, usePersistentProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import { toast } from 'react-toastify';
import {
  ScrollableContainer,
  t,
  useAppSelector,
  useAppDispatch,
  fetchSimbriefDataAction,
  isSimbriefDataLoaded,
  setPayloadImported,
  setFuelImported,
  setToastPresented,
  setSimbriefDataPending,
} from '@flybywiresim/flypad';
import { useNavigraphAuthInfo } from '../../Apis/Navigraph/Components/Authentication';

interface InformationEntryProps {
  title: string;
  info: string;
}

const InformationEntry = ({ title, info }: InformationEntryProps) => (
  <div className="justify-content flex w-full flex-col items-center">
    <h3 className="text-center font-light">{title}</h3>
    <h2 className="font-bold">{info}</h2>
  </div>
);

export const FlightWidget = () => {
  const { data } = useAppSelector((state) => state.simbrief);
  const simbriefDataPending = useAppSelector((state) => state.simbrief.simbriefDataPending);
  const aircraftIcao = useAppSelector((state) => state.simbrief.data.aircraftIcao);

  const [, setCurrentLoadsheetSection] = usePersistentProperty('LOADSHEET_ACTIVE_SECTION', 'All');

  const navigraphAuthInfo = useNavigraphAuthInfo();

  const [overrideSimBriefUserID] = usePersistentProperty('CONFIG_OVERRIDE_SIMBRIEF_USERID');
  const [autoSimbriefImport] = usePersistentProperty('CONFIG_AUTO_SIMBRIEF_IMPORT');
  const airframeInfo = useAppSelector((state) => state.config.airframeInfo);

  const [gsxPayloadSyncEnabled] = usePersistentNumberProperty('GSX_PAYLOAD_SYNC', 248);
  const [gsxBoardingState] = useSimVar('L:FSDT_GSX_BOARDING_STATE', 'Number', 227);
  const [gsxDeBoardingState] = useSimVar('L:FSDT_GSX_DEBOARDING_STATE', 'Number', 229);
  const [boardingStarted] = useSimVar('L:A32NX_BOARDING_STARTED_BY_USR', 'Bool', 208);
  const [refuelStartedByUser] = useSimVar('L:A32NX_REFUEL_STARTED_BY_USR', 'Bool', 254);

  const {
    schedIn,
    schedOut,
    weather,
    cruiseAltitude,
    weights,
    arrivingAirport,
    arrivingIata,
    arrivingName,
    departingAirport,
    departingIata,
    departingName,
    airline,
    route,
    flightNum,
    altIcao,
    costInd,
    arrivingRunway,
    departingRunway,
  } = data;
  const { flightPlanProgress } = useAppSelector((state) => state.flightProgress);

  const fuelImported = useAppSelector((state) => state.simbrief.fuelImported);
  const payloadImported = useAppSelector((state) => state.simbrief.payloadImported);
  const toastPresented = useAppSelector((state) => state.simbrief.toastPresented);

  const dispatch = useAppDispatch();

  const history = useHistory();

  const sta = new Date(parseInt(schedIn) * 1000);
  const schedInParsed = `${sta.getUTCHours().toString().padStart(2, '0')}${sta.getUTCMinutes().toString().padStart(2, '0')}Z`;

  const std = new Date(parseInt(schedOut) * 1000);
  const schedOutParsed = `${std.getUTCHours().toString().padStart(2, '0')}${std.getUTCMinutes().toString().padStart(2, '0')}Z`;

  const flightLevel = cruiseAltitude / 100;
  const crzAlt = `FL${flightLevel.toString().padStart(3, '0')}`;

  const avgWind = `${weather.avgWindDir}/${weather.avgWindSpeed}`;

  const eZfwUnround = Number.parseFloat(weights.estZeroFuelWeight) / 100;
  const eZfw = Math.round(eZfwUnround) / 10;
  const estimatedZfw = `${eZfw}`;

  const fetchData = async () => {
    dispatch(setSimbriefDataPending(true));

    const gsxInProgress =
      (gsxDeBoardingState >= 4 && gsxDeBoardingState < 6) || (gsxBoardingState >= 4 && gsxBoardingState < 6);
    const generalBoardingInProgress = gsxPayloadSyncEnabled ? gsxInProgress : boardingStarted;

    if (generalBoardingInProgress || refuelStartedByUser) {
      toast.error(t('Dashboard.YourFlight.NoImportDueToBoardingOrRefuel'));
    } else {
      try {
        const action = await fetchSimbriefDataAction(
          (navigraphAuthInfo.loggedIn && navigraphAuthInfo.username) || '',
          overrideSimBriefUserID ?? '',
        );
        dispatch(action);
        dispatch(setFuelImported(false));
        dispatch(setPayloadImported(false));
        dispatch(setToastPresented(false));
        setCurrentLoadsheetSection('All');
        history.push('/ground/fuel');
        history.push('/ground/payload');
        history.push('/dashboard');
      } catch (e) {
        toast.error(e.message);
      }
    }
    dispatch(setSimbriefDataPending(false));
  };

  useEffect(() => {
    if (
      !simbriefDataPending &&
      ((navigraphAuthInfo.loggedIn && navigraphAuthInfo.username) || overrideSimBriefUserID) &&
      !toastPresented &&
      fuelImported &&
      payloadImported
    ) {
      if (aircraftIcao !== airframeInfo.icao) {
        toast.error(t('Dashboard.YourFlight.ToastWrongAircraftType'));
      } else {
        toast.success(t('Dashboard.YourFlight.ToastFuelPayloadImported'));
      }
      dispatch(setToastPresented(true));
    }
  }, [fuelImported, payloadImported, simbriefDataPending]);

  useEffect(() => {
    if (
      (!data || !isSimbriefDataLoaded()) &&
      !simbriefDataPending &&
      autoSimbriefImport === 'ENABLED' &&
      ((navigraphAuthInfo.loggedIn && navigraphAuthInfo.username) || overrideSimBriefUserID)
    ) {
      fetchData();
    }
  }, [navigraphAuthInfo.loggedIn]);

  const simbriefDataLoaded = isSimbriefDataLoaded();

  return (
    <div className="w-1/2">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h1 className="font-bold">{t('Dashboard.YourFlight.Title')}</h1>
        <h1>
          {simbriefDataLoaded ? `${(airline.length > 0 ? airline : '') + flightNum} | ` : ''}
          {airframeInfo.variant}
        </h1>
      </div>
      <div className="relative h-content-section-reduced w-full overflow-hidden rounded-lg border-2 border-theme-accent p-6">
        <div className="flex h-full flex-col justify-between">
          {simbriefDataLoaded && (
            <div className="space-y-8">
              <div className="flex flex-row justify-between">
                <div>
                  <h1 className="text-4xl font-bold">{departingAirport}</h1>
                  <p className="w-52 text-sm">{departingName}</p>
                </div>
                <div>
                  <h1 className="text-right text-4xl font-bold">{arrivingAirport}</h1>
                  <p className="w-52 text-right text-sm">{arrivingName}</p>
                </div>
              </div>
              <div>
                <div className="flex w-full flex-row items-center">
                  <p className={`font-body ${flightPlanProgress > 1 ? 'text-theme-highlight' : 'text-theme-text'}`}>
                    {schedOutParsed}
                  </p>
                  <div className="relative mx-6 flex h-1 w-full flex-row">
                    <div className="absolute inset-x-0 border-b-4 border-dashed border-theme-text" />

                    <div className="relative w-full bg-theme-highlight" style={{ width: `${flightPlanProgress}%` }}>
                      {!!flightPlanProgress && (
                        <IconPlane
                          className="absolute right-0 -translate-y-1/2 translate-x-1/2 fill-current text-theme-highlight"
                          size={50}
                          strokeLinejoin="miter"
                        />
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-right font-body ${Math.round(flightPlanProgress) >= 98 ? 'text-theme-highlight' : 'text-theme-text'}`}
                  >
                    {schedInParsed}
                  </p>
                </div>
              </div>
              <div>
                <div className="mb-4 flex flex-row justify-around">
                  <InformationEntry title={t('Dashboard.YourFlight.Alternate')} info={altIcao ?? 'NONE'} />
                  <div className="mx-4 my-auto h-8 w-1 bg-theme-accent" />
                  <InformationEntry
                    title={t('Dashboard.YourFlight.CompanyRoute')}
                    info={departingIata + arrivingIata}
                  />
                  <div className="mx-4 my-auto h-8 w-1 bg-theme-accent" />
                  <InformationEntry title={t('Dashboard.YourFlight.ZFW')} info={estimatedZfw} />
                </div>
                <div className="my-auto h-0.5 w-full bg-theme-accent" />
                <div className="mt-4 flex flex-row justify-around">
                  <InformationEntry title={t('Dashboard.YourFlight.CostIndex')} info={costInd} />
                  <div className="mx-4 my-auto h-8 w-1 bg-theme-accent" />
                  <InformationEntry title={t('Dashboard.YourFlight.AverageWind')} info={avgWind} />
                  <div className="mx-4 my-auto h-8 w-1 bg-theme-accent" />
                  <InformationEntry title={t('Dashboard.YourFlight.CruiseAlt')} info={crzAlt} />
                </div>
              </div>
              <div>
                <h5 className="mb-2 text-2xl font-bold">{t('Dashboard.YourFlight.Route')}</h5>
                <ScrollableContainer height={15}>
                  <p className="font-mono text-2xl">
                    <span className="text-2xl text-theme-highlight">
                      {departingAirport}/{departingRunway}
                    </span>{' '}
                    {route}{' '}
                    <span className="text-2xl text-theme-highlight">
                      {arrivingAirport}/{arrivingRunway}
                    </span>
                  </p>
                </ScrollableContainer>
              </div>
            </div>
          )}
          <div
            className={simbriefDataLoaded ? '' : 'flex h-full w-full flex-col items-center justify-center space-y-4'}
          >
            {simbriefDataPending ? (
              <CloudArrowDown
                className={`${simbriefDataLoaded ? 'w-full justify-self-center' : ''} animate-bounce`}
                size={40}
              />
            ) : (
              <>
                {!simbriefDataLoaded && (
                  <h1 className="text-center" style={{ maxWidth: '18em' }}>
                    {t('Dashboard.YourFlight.SimBriefDataNotYetLoaded')}
                  </h1>
                )}

                <button
                  type="button"
                  onClick={fetchData}
                  className="flex w-full items-center justify-center space-x-4 rounded-md border-2 border-theme-highlight bg-theme-highlight p-2 text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
                >
                  <CloudArrowDown size={26} />
                  <p className="text-current">{t('Dashboard.YourFlight.ImportSimBriefData')}</p>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
