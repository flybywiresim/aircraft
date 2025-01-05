// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useEffect, useState } from 'react';
import { Metar as FbwApiMetar } from '@flybywiresim/api-client';
import { Droplet, Speedometer2, ThermometerHalf, Wind } from 'react-bootstrap-icons';
import {
  ConfigWeatherMap,
  MetarParserType,
  parseMetar,
  useInterval,
  usePersistentNumberProperty,
  usePersistentProperty,
} from '@flybywiresim/fbw-sdk';
import { Metar as MsfsMetar } from '@microsoft/msfs-sdk';
import { t } from '../../Localization/translation';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { ColoredMetar } from './ColorMetar';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
  setDepartureMetar,
  setDestinationMetar,
  setUserDepartureIcao,
  setUserDestinationIcao,
} from '../../Store/features/dashboard';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';

const MetarParserTypeProp: MetarParserType = {
  raw_text: '',
  raw_parts: [],
  color_codes: [],
  icao: '',
  observed: new Date(0),
  wind: {
    degrees: 0,
    degrees_from: 0,
    degrees_to: 0,
    speed_kts: 0,
    speed_mps: 0,
    gust_kts: 0,
    gust_mps: 0,
  },
  visibility: {
    miles: '',
    miles_float: 0.0,
    meters: '',
    meters_float: 0.0,
  },
  conditions: [],
  clouds: [],
  ceiling: {
    code: '',
    feet_agl: 0,
    meters_agl: 0,
  },
  temperature: {
    celsius: 0,
    fahrenheit: 0,
  },
  dewpoint: {
    celsius: 0,
    fahrenheit: 0,
  },
  humidity_percent: 0,
  barometer: {
    hg: 0,
    kpa: 0,
    mb: 0,
  },
  flight_category: '',
};

interface WeatherWidgetProps {
  name: 'origin' | 'destination';
  simbriefIcao: string;
  userIcao?: string;
}

export const WeatherWidget: FC<WeatherWidgetProps> = ({ name, simbriefIcao, userIcao }) => {
  const [baroType] = usePersistentProperty('CONFIG_INIT_BARO_UNIT', 'AUTO');
  const dispatch = useAppDispatch();
  const [simbriefIcaoAtLoading, setSimbriefIcaoAtLoading] = useState(simbriefIcao);
  const [metarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');
  const [metarError, setErrorMetar] = useState('');
  const [usingColoredMetar] = usePersistentNumberProperty('EFB_USING_COLOREDMETAR', 1);
  const source = metarSource;

  const getBaroTypeForAirport = (icao: string) =>
    ['K', 'C', 'M', 'P', 'RJ', 'RO', 'TI', 'TJ'].some((r) => icao.toUpperCase().startsWith(r)) ? 'IN HG' : 'HPA';

  const metar =
    useAppSelector((state) =>
      name === 'origin' ? state.dashboard.departureMetar : state.dashboard.destinationMetar,
    ) ?? MetarParserTypeProp;
  const setMetar = name === 'origin' ? setDepartureMetar : setDestinationMetar;

  const [showMetar, setShowMetar] = usePersistentNumberProperty(`CONFIG_SHOW_METAR_${name}`, 0);

  const BaroValue = () => {
    const displayedBaroType = baroType === 'AUTO' ? getBaroTypeForAirport(metar.icao) : baroType;
    if (displayedBaroType === 'IN HG') {
      return <>{metar.barometer.hg.toFixed(2)} inHg</>;
    }
    return <>{metar.barometer.mb.toFixed(0)} mb</>;
  };

  const handleIcao = (icao: string) => {
    if (name === 'origin') {
      dispatch(setUserDepartureIcao(icao));
    } else {
      dispatch(setUserDestinationIcao(icao));
    }

    if (icao.length > 0) {
      getMetar(icao, source);
    } else if (icao.length === 0) {
      getMetar(simbriefIcao, source);
    }
  };

  async function getMetar(icao: string, source: string): Promise<void> {
    if (icao.length !== 4 || !/^[a-z]{4}$/i.test(icao)) {
      setErrorMetar(t('Dashboard.ImportantInformation.Weather.NoIcaoProvided'));
      dispatch(setMetar(MetarParserTypeProp));
      return Promise.resolve();
    }

    // Comes from the sim rather than the FBW API
    if (source === 'MSFS') {
      let metar: MsfsMetar;
      // Catch parsing error separately
      try {
        metar = await Coherent.call('GET_METAR_BY_IDENT', icao);
        if (metar.icao !== icao.toUpperCase()) {
          throw new Error('No METAR available');
        }
      } catch (err) {
        console.log(`Error while retrieving Metar: ${err}`);
        setErrorMetar(`${err.toString()}`);
        dispatch(setMetar(MetarParserTypeProp));
      }
      try {
        const metarParse = parseMetar(metar.metarString);
        dispatch(setMetar(metarParse));
      } catch (err) {
        console.log(`Error while parsing Metar ("${metar.metarString}"): ${err}`);
        setErrorMetar(
          `${t('Dashboard.ImportantInformation.Weather.MetarParsingError')}: ${err
            .toString()
            .replace(/^Error: /, '')
            .toUpperCase()}`,
        );
        dispatch(setMetar(MetarParserTypeProp));
      }
      return Promise.resolve();
    }

    return (
      FbwApiMetar.get(icao, ConfigWeatherMap[source])
        .then((result) => {
          // For METAR source Microsoft result.metar is undefined without throwing an error.
          // For the other METAR sources an error is thrown (Request failed with status code 404)
          // and caught in the catch clause.
          if (!result.metar) {
            setErrorMetar(t('Dashboard.ImportantInformation.Weather.IcaoInvalid'));
            dispatch(setMetar(MetarParserTypeProp));
            return;
          }
          // Catch parsing error separately
          try {
            const metarParse = parseMetar(result.metar);
            dispatch(setMetar(metarParse));
          } catch (err) {
            console.log(`Error while parsing Metar ("${result.metar}"): ${err}`);
            setErrorMetar(
              `${t('Dashboard.ImportantInformation.Weather.MetarParsingError')}: ${err
                .toString()
                .replace(/^Error: /, '')
                .toUpperCase()}`,
            );
            dispatch(setMetar(MetarParserTypeProp));
          }
        })
        // catch retrieving metar errors
        .catch((err) => {
          console.log(`Error while retrieving Metar: ${err}`);
          if (err.toString().match(/^Error:/)) {
            setErrorMetar(t('Dashboard.ImportantInformation.Weather.IcaoInvalid'));
          } else {
            setErrorMetar(`${err.toString().replace(/^Error: /, '')}`);
          }
          dispatch(setMetar(MetarParserTypeProp));
        })
    );
  }

  useEffect(() => {
    // if we have new simbrief data that is different from the simbrief data at
    // loading of the widget we overwrite the user input once. After that
    // user input has priority.
    if (simbriefIcao !== simbriefIcaoAtLoading) {
      dispatch(setUserDepartureIcao(''));
      dispatch(setUserDestinationIcao(''));
      getMetar(simbriefIcao, source);
      setSimbriefIcaoAtLoading(simbriefIcao);
    } else {
      getMetar(userIcao || simbriefIcao, source);
    }
  }, [simbriefIcao, userIcao, source]);

  useInterval(() => {
    handleIcao(userIcao ?? simbriefIcao);
  }, 60_000);

  return (
    <div>
      {metar === undefined ? (
        <p>{t('Dashboard.ImportantInformation.Weather.Loading')}</p>
      ) : (
        <>
          <div className="flex flex-row items-center justify-between">
            <SimpleInput
              className="w-32 text-center !text-2xl font-medium uppercase"
              placeholder={simbriefIcao || 'ICAO'}
              value={userIcao ?? simbriefIcao}
              onChange={(value) => handleIcao(value)}
              maxLength={4}
            />
            <TooltipWrapper
              text={
                showMetar
                  ? t('Dashboard.ImportantInformation.Weather.TT.SwitchToIconView')
                  : t('Dashboard.ImportantInformation.Weather.TT.SwitchToRawMetarView')
              }
            >
              <div className="flex flex-row space-x-2">
                <p>{t('Dashboard.ImportantInformation.Weather.Raw')}</p>
                <Toggle value={!!showMetar} onToggle={(value) => setShowMetar(value ? 1 : 0)} />
              </div>
            </TooltipWrapper>
          </div>
          <div style={{ minHeight: '100px' }}>
            {!showMetar ? (
              <>
                <div className="mt-4 flex w-full flex-row items-center justify-between">
                  <div className="flex flex-col items-center space-y-1">
                    <Speedometer2 size={35} />
                    <p className="text-center">{t('Dashboard.ImportantInformation.Weather.AirPressure')}</p>
                    {metar.raw_text ? (
                      <>{metar.barometer ? <BaroValue /> : 'N/A'}</>
                    ) : (
                      t('Dashboard.ImportantInformation.Weather.NotAvailableShort')
                    )}
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <Wind size={35} />
                    <p className="text-center">{t('Dashboard.ImportantInformation.Weather.WindSpeed')}</p>
                    {metar.raw_text ? (
                      <>
                        {metar.wind.degrees.toFixed(0)}
                        &deg; / {metar.wind.speed_kts.toFixed(0)} kts
                      </>
                    ) : (
                      t('Dashboard.ImportantInformation.Weather.NotAvailableShort')
                    )}
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <ThermometerHalf size={35} />
                    <p className="text-center">{t('Dashboard.ImportantInformation.Weather.Temperature')}</p>
                    {metar.raw_text ? (
                      <>{metar.temperature.celsius.toFixed(0)} &deg;C</>
                    ) : (
                      t('Dashboard.ImportantInformation.Weather.NotAvailableShort')
                    )}
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <Droplet size={35} />
                    <p className="text-center">{t('Dashboard.ImportantInformation.Weather.DewPoint')}</p>
                    {metar.raw_text ? (
                      <>{metar.dewpoint.celsius.toFixed(0)} &deg;C</>
                    ) : (
                      t('Dashboard.ImportantInformation.Weather.NotAvailableShort')
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {metar.raw_text ? (
                  <div className="mt-4 font-mono text-xl">
                    {usingColoredMetar ? (
                      <>
                        <ColoredMetar metar={metar} />
                      </>
                    ) : (
                      <>{metar.raw_text}</>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 text-xl">{metarError}</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
