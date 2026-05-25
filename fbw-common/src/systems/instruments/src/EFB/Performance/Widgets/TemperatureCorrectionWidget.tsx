// Copyright (c) 2025-2026 FlyByWire Simulations
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
  usePersistentSetting,
} from '@flybywiresim/fbw-sdk-react';
import { toast } from 'react-toastify';
import { CloudArrowDown, Trash } from 'react-bootstrap-icons';
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
import Card from '../../UtilComponents/Card/Card';

interface LabelProps {
  className?: string;
  text: string;
}

const NUMBER_OF_ALTITUDES = 10;

const Label: FC<LabelProps> = ({ text, className, children }) => (
  <div className="flex flex-row items-center justify-between">
    <p className={`mr-4 text-theme-text ${className}`}>{text}</p>
    {children}
  </div>
);

export const TemperatureCorrectionWidget = () => {
  const dispatch = useAppDispatch();

  const [autoFillSource, setAutoFillSource] = useState<'METAR' | 'OFP'>('OFP');
  const [metarSource] = usePersistentSetting('CONFIG_METAR_SRC');
  const { usingMetric: usingMetricPinProg } = Units;

  const { icao, temperature, fieldElevation, publishedAltitudes } = useAppSelector(
    (state) => state.temperatureCorrectionCalculator,
  );

  const { arrivingAirport: ofpArrivingAirport, arrivingMetar: ofpArrivingMetar } = useAppSelector(
    (state) => state.simbrief.data,
  );

  const publishAltitudeInputs =
    publishedAltitudes.length < NUMBER_OF_ALTITUDES ? [...publishedAltitudes, undefined] : publishedAltitudes;

  // The displayed results have no duplicates and are in sorted order
  const displayedAltitudes = Array.from(new Set(publishedAltitudes)).sort((a, b) => a - b);

  const isValidIcao = (icao: string): boolean => icao?.length === 4;

  const handleICAOChange = (icao: string) => {
    dispatch(setIcao(icao));
    if (isValidIcao(icao)) {
      getAirport(icao)
        .then((airport) => dispatch(setFieldElevation(Math.round(airport.altitude / 0.3048))))
        .catch(() => dispatch(setFieldElevation(undefined)));
    }
  };

  const syncValuesWithApiMetar = async (): Promise<void> => {
    if (!icao || !isValidIcao(icao)) {
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
      } catch (err: any) {
        toast.error(err.message);
      }
    } else {
      try {
        const response = await FbwApiMetar.get(icao, ConfigWeatherMap[metarSource]);
        if (!response.metar) {
          throw new Error('No METAR available');
        }
        parsedMetar = parseMetar(response.metar);
      } catch (err: any) {
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
    const altitude: number = parseInt(input);

    if (Number.isNaN(altitude)) {
      return;
    }

    const altitudes = [...publishedAltitudes.slice(0, index), altitude, ...publishedAltitudes.slice(index + 1)];

    dispatch(setPublishedAltitudes(altitudes));
  };

  const handleClearPublishedAltitudes = (): void => {
    dispatch(setPublishedAltitudes([]));
  };

  const deletePublishedAltitudeRow = (idx: number): void => {
    dispatch(setPublishedAltitudes(publishedAltitudes.filter((_, i) => i !== idx)));
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
      return icao && isValidIcao(icao);
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
      <div className="flex w-full flex-1 flex-col">
        <div className="mt-4 flex w-full flex-row justify-end px-8">
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
            onChange={(value) => setAutoFillSource(value as 'METAR' | 'OFP')}
          />
        </div>
        <div className="mb-8 grid min-h-0 flex-1 grid-cols-2 grid-rows-[auto_1fr]">
          <Card className="col-span-2 mx-8 mb-8" title={t('Performance.TemperatureCorrection.AirfieldData')}>
            <div className="grid grid-cols-2">
              <div className="mb-4 ml-4 mr-8">
                <Label text={t('Performance.Takeoff.Airport')}>
                  <SimpleInput
                    className="w-48 uppercase"
                    value={icao}
                    placeholder="ICAO"
                    onChange={handleICAOChange}
                    maxLength={4}
                  />
                </Label>
              </div>
              <div className="mb-4 ml-8 mr-4">
                <Label text={t('Performance.TemperatureCorrection.FieldElevation')}>
                  <SimpleInput
                    className="w-48"
                    value={fieldElevation}
                    placeholder={t('Performance.Takeoff.RunwayElevationUnit')}
                    onChange={handleFieldElevation}
                    maxLength={5}
                    decimalPrecision={0}
                    number
                  />
                </Label>
              </div>
              <div className="ml-4 mr-8">
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
                        { value: 'C', displayValue: '°C' },
                        { value: 'F', displayValue: '°F' },
                      ]}
                      onChange={(newValue) => setTemperatureUnit(newValue as 'C' | 'F')}
                    />
                  </div>
                </Label>
              </div>
            </div>
          </Card>
          <Card
            className="mx-8 flex min-h-0 flex-1 flex-col"
            childrenContainerClassName="flex flex-col justify-between min-h-0 flex-1"
            title={t('Performance.TemperatureCorrection.PublishedAltitudes')}
          >
            <div className="grid grid-cols-2">
              {publishAltitudeInputs.map((alt, idx) => (
                <div className="flex justify-center" key={idx}>
                  <SimpleInput
                    className="m-2 w-full"
                    value={alt}
                    placeholder={t('Performance.Takeoff.RunwayElevationUnit')}
                    min={0}
                    max={20000}
                    decimalPrecision={0}
                    onChange={(v) => handlePublishedAltitude(idx, v)}
                    onBlur={(v) => !v && deletePublishedAltitudeRow(idx)}
                    number
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleClearPublishedAltitudes}
              disabled={displayedAltitudes.length === 0}
              className={`col-span-2 mx-2 mt-4 flex flex-row items-center justify-center space-x-4 rounded-md border-2 border-utility-red
                                bg-utility-red py-2 text-theme-body outline-none hover:bg-theme-body hover:text-utility-red ${displayedAltitudes.length === 0 && 'pointer-events-none cursor-not-allowed opacity-50'}`}
              type="button"
            >
              <Trash size={26} />
              <p className="font-bold text-current">{t('Performance.Landing.Clear')}</p>
            </button>
          </Card>
          <Card
            className={`mx-8 flex min-h-0 flex-1 flex-col${displayedAltitudes.length > 0 ? '' : ' hidden'}`}
            childrenContainerClassName="overflow-hidden !p-0"
            title={t('Performance.TemperatureCorrection.Results')}
          >
            <table className="w-full table-auto border-collapse border border-theme-accent">
              <thead className="bg-theme-accent">
                <tr>
                  <th className="border border-theme-accent px-4 py-2 text-left">
                    {t('Performance.TemperatureCorrection.Published')}
                  </th>
                  <th className="border border-theme-accent px-4 py-2 text-left">
                    {t('Performance.TemperatureCorrection.Corrected')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedAltitudes.map((uncorrectedAlt, idx) => (
                  <tr key={idx}>
                    <td className="border border-theme-accent px-4 py-2">{uncorrectedAlt}</td>
                    <td className="border border-theme-accent px-4 py-2">
                      {calculateCorrectedAltitude(uncorrectedAlt) ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
};
