// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useState } from 'react';
import { Metar as FbwApiMetar } from '@flybywiresim/api-client';
import { Metar as MsfsMetar } from '@microsoft/msfs-sdk';
import {
  Units,
  MetarParserType,
  usePersistentProperty,
  parseMetar,
  ConfigWeatherMap,
  MathUtils,
} from '@flybywiresim/fbw-sdk';
import { toast } from 'react-toastify';
import { CloudArrowDown } from 'react-bootstrap-icons';
import { getAirport } from '../Data/Runways';
import { t } from '../../Localization/translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
  setFieldElevation,
  setTemperature,
  setPublishedAltitudes,
  setIcao,
} from '../../Store/features/temperatureCorrectionCalculator';

interface LabelProps {
  className?: string;
  text: string;
}

const NUMBER_OF_ALTITUDES = 9;

const Label: FC<LabelProps> = ({ text, className, children }) => (
  <div className="flex flex-row items-center justify-between">
    <p className={`mr-4 text-theme-text ${className}`}>{text}</p>
    {children}
  </div>
);

export const TemperatureCorrectionWidget = () => {
  const dispatch = useAppDispatch();

  const [autoFillSource, setAutoFillSource] = useState<'METAR' | 'OFP'>('OFP');
  const [metarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');
  const { usingMetric: usingMetricPinProg } = Units;

  const { icao, temperature, fieldElevation, publishedAltitudes } = useAppSelector(
    (state) => state.temperatureCorrectionCalculator,
  );

  const { arrivingAirport: ofpArrivingAirport, arrivingMetar: ofpArrivingMetar } = useAppSelector(
    (state) => state.simbrief.data,
  );

  const isValidIcao = (icao: string): boolean => icao?.length === 4;

  const handleICAOChange = (icao: string) => {
    dispatch(setIcao(icao));
    if (isValidIcao(icao)) {
      getAirport(icao)
        .then((airport) => dispatch(setFieldElevation(airport.altitude)))
        .catch(() => dispatch(setFieldElevation(undefined)));
    }
  };

  const syncValuesWithApiMetar = async (): Promise<void> => {
    if (!isValidIcao(icao)) {
      return;
    }

    let parsedMetar: MetarParserType | undefined = undefined;

    // Comes from the sim rather than the FBW API
    if (metarSource === 'MSFS') {
      let metar: MsfsMetar;
      try {
        metar = await Coherent.call('GET_METAR_BY_IDENT', icao);
        if (metar.icao !== icao.toUpperCase()) {
          throw new Error('No METAR available');
        }
        parsedMetar = parseMetar(metar.metarString);
      } catch (err) {
        toast.error(err.message);
      }
    } else {
      try {
        const response = await FbwApiMetar.get(icao, ConfigWeatherMap[metarSource]);
        if (!response.metar) {
          throw new Error('No METAR available');
        }
        parsedMetar = parseMetar(response.metar);
      } catch (err) {
        toast.error(err.message);
      }
    }

    if (parsedMetar === undefined) {
      return;
    }

    dispatch(setTemperature(parsedMetar.temperature.celsius));
  };

  const handleFieldElevation = (input: string): void => {
    let elevation: number | undefined = parseInt(input);

    if (Number.isNaN(elevation)) {
      elevation = undefined;
    }

    dispatch(setFieldElevation(elevation));
  };

  const handleTemperature = (input: string): void => {
    let temperature: number | undefined = parseInt(input);

    if (Number.isNaN(temperature)) {
      temperature = undefined;
    }

    dispatch(setTemperature(temperature));
  };

  const handlePublishedAltitude = (index: number, input: string): void => {
    let altitude: number | undefined = parseInt(input);

    if (Number.isNaN(altitude)) {
      altitude = undefined;
    }

    const altitudes = [...publishedAltitudes.slice(0, index), altitude, ...publishedAltitudes.slice(index + 1)];

    dispatch(setPublishedAltitudes(altitudes));
  };

  const syncValuesWithOfp = async () => {
    if (!isValidIcao(ofpArrivingAirport)) {
      return;
    }

    const parsedMetar: MetarParserType = parseMetar(ofpArrivingMetar);
    try {
      const airport = await getAirport(ofpArrivingAirport);
      dispatch(setFieldElevation(airport.altitude));
      dispatch(setTemperature(parsedMetar.temperature.celsius));
    } catch (e) {
      toast.error(e);
      dispatch(setFieldElevation(undefined));
    }
  };

  const handleAutoFill = () => {
    if (autoFillSource === 'METAR') {
      syncValuesWithApiMetar();
    } else {
      syncValuesWithOfp();
    }
  };

  const isAutoFillIcaoValid = () => {
    if (autoFillSource === 'METAR') {
      return isValidIcao(icao);
    }
    return isValidIcao(ofpArrivingAirport);
  };

  const calculateCorrectedAltitude = (publishedAlt?: number): number | undefined => {
    if (publishedAlt === undefined || fieldElevation === undefined || temperature === undefined) {
      return undefined;
    }

    // Formula from EUROCONTROL 2940 workbook.
    const correction =
      (publishedAlt - fieldElevation) *
      ((15 - (temperature + 0.00198 * fieldElevation)) /
        (273 +
          (temperature + 0.00198 * fieldElevation) -
          0.5 * 0.00198 * (publishedAlt - fieldElevation + fieldElevation)));

    if (correction <= 0) {
      return publishedAlt;
    }

    return MathUtils.ceil(publishedAlt + correction, 10);
  };

  const [temperatureUnit, setTemperatureUnit] = usePersistentProperty(
    'EFB_PREFERRED_TEMPERATURE_UNIT',
    usingMetricPinProg ? 'C' : 'F',
  );

  const getVariableUnitDisplayValue = <T,>(
    value: number | undefined,
    unit: T,
    imperialUnit: T,
    metricToImperial: (value: number) => number,
  ) => {
    if (value !== undefined) {
      if (unit === imperialUnit) {
        return metricToImperial(value);
      }
      return value;
    }
    return undefined;
  };

  const fillDataTooltip = () => {
    switch (autoFillSource) {
      case 'METAR':
        if (!isAutoFillIcaoValid()) {
          return t('Performance.Landing.TT.YouNeedToEnterAnIcaoCodeInOrderToMakeAMetarRequest');
        }
        break;
      case 'OFP':
        if (!isAutoFillIcaoValid()) {
          return t('Performance.Landing.TT.YouNeedToLoadSimBriefDataInOrderToAutofillData');
        }
        break;
      default:
        return undefined;
    }

    return undefined;
  };

  return (
    <div className="flex h-content-section-reduced flex-row justify-between space-x-10 overflow-hidden">
      <div className="w-full">
        <div className="flex w-full flex-col justify-between">
          <div className="mb-4">
            <div className="mb-8 mt-4">
              <div className="mt-4 flex flex-row justify-end">
                <div className="flex flex-row">
                  <TooltipWrapper text={fillDataTooltip()}>
                    <button
                      onClick={isAutoFillIcaoValid() ? handleAutoFill : undefined}
                      className={`flex flex-row items-center justify-center space-x-4 rounded-md rounded-r-none border-2 border-theme-highlight bg-theme-highlight px-8 py-2 text-theme-body outline-none transition duration-100 ${!isAutoFillIcaoValid() ? 'opacity-50' : 'hover:bg-theme-body hover:text-theme-highlight'}`}
                      type="button"
                    >
                      <CloudArrowDown size={26} />
                      <p className="text-current">{t('Performance.Landing.FillDataFrom')}</p>
                    </button>
                  </TooltipWrapper>
                  <SelectInput
                    value={autoFillSource}
                    className="w-36 rounded-l-none"
                    options={[
                      { value: 'OFP', displayValue: 'OFP' },
                      { value: 'METAR', displayValue: 'METAR' },
                    ]}
                    onChange={(value: 'METAR' | 'OFP') => setAutoFillSource(value)}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-row justify-between">
              <div className="flex flex-col space-y-4">
                <Label text={t('Performance.Takeoff.Airport')}>
                  <SimpleInput
                    className="w-48 uppercase"
                    value={icao}
                    placeholder="ICAO"
                    onChange={handleICAOChange}
                    maxLength={4}
                  />
                </Label>
                <div />
                <Label text={t('Performance.TemperatureCorrection.FieldElevation')}>
                  <SimpleInput
                    className="w-48 uppercase"
                    value={fieldElevation}
                    placeholder="feet"
                    onChange={handleFieldElevation}
                    maxLength={5}
                    decimalPrecision={0}
                    number
                  />
                </Label>
              </div>
              <div className="flex flex-col space-y-4">
                <Label text={t('Performance.Takeoff.Temperature')}>
                  <div className="flex w-60 flex-row">
                    <SimpleInput
                      className="w-full rounded-r-none"
                      value={getVariableUnitDisplayValue<'C' | 'F'>(
                        temperature,
                        temperatureUnit as 'C' | 'F',
                        'F',
                        Units.celsiusToFahrenheit,
                      )}
                      placeholder={`°${temperatureUnit}`}
                      decimalPrecision={1}
                      onChange={handleTemperature}
                      number
                    />
                    <SelectInput
                      value={temperatureUnit}
                      className="w-20 rounded-l-none"
                      options={[
                        { value: 'C', displayValue: 'C' },
                        { value: 'F', displayValue: 'F' },
                      ]}
                      onChange={(newValue: 'C' | 'F') => setTemperatureUnit(newValue)}
                    />
                  </div>
                </Label>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 p-4">
          <div>{t('Performance.TemperatureCorrection.PublishedAltitudes')}</div>
          <div>{t('Performance.TemperatureCorrection.CorrectedAltitudes')}</div>
          {Array.from({ length: NUMBER_OF_ALTITUDES }).map((_, idx) => (
            <>
              <SimpleInput
                className="w-48"
                value={publishedAltitudes[idx]}
                placeholder={t('Performance.Takeoff.RunwayElevationUnit')}
                min={0}
                max={20000}
                decimalPrecision={0}
                onChange={(v) => handlePublishedAltitude(idx, v)}
                number
              />
              <div>{calculateCorrectedAltitude(publishedAltitudes[idx])}</div>
            </>
          ))}
        </div>
      </div>
    </div>
  );
};
