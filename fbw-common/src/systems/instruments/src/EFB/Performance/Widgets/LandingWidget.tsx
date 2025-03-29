// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { FC, useContext, useEffect, useState } from 'react';
import { Metar as FbwApiMetar } from '@flybywiresim/api-client';
import { Metar as MsfsMetar } from '@microsoft/msfs-sdk';
import {
  Units,
  MetarParserType,
  useSimVar,
  usePersistentProperty,
  parseMetar,
  ConfigWeatherMap,
  LandingFlapsConfig,
  LandingRunwayConditions,
  MathUtils,
} from '@flybywiresim/fbw-sdk';
import { toast } from 'react-toastify';
import { Calculator, CloudArrowDown, Trash } from 'react-bootstrap-icons';
import { t } from '../../Localization/translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { PromptModal, useModals } from '../../UtilComponents/Modals/Modals';
import RunwayVisualizationWidget, { LabelType } from './RunwayVisualizationWidget';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import { clearLandingValues, initialState, setLandingValues } from '../../Store/features/performance';
import { AircraftContext } from '../../AircraftContext';
import {
  isValidIcao,
  isWindMagnitudeAndDirection,
  isWindMagnitudeOnly,
  WIND_MAGNITUDE_AND_DIR_REGEX,
  WIND_MAGNITUDE_ONLY_REGEX,
} from '../Data/Utils';
import { getAirportMagVar, getRunways } from '../Data/Runways';

interface OutputDisplayProps {
  label: string;
  value: string | number;
  error?: boolean;
  reverse?: boolean;
}

const OutputDisplay = (props: OutputDisplayProps) => (
  <div className={`flex w-full flex-col items-center justify-center py-2 ${props.error ? 'bg-red-800' : ''}`}>
    <p className="shrink-0 font-bold">{props.label}</p>
    <p>{props.value}</p>
  </div>
);

interface LabelProps {
  className?: string;
  text: string;
}

const Label: FC<LabelProps> = ({ text, className, children }) => (
  <div className="flex flex-row items-center justify-between">
    <p className={`mr-4 text-theme-text ${className}`}>{text}</p>
    {children}
  </div>
);

// TODO F-LD and LD

export const LandingWidget = () => {
  const dispatch = useAppDispatch();

  const calculators = useContext(AircraftContext).performanceCalculators;

  const [totalWeight] = useSimVar('TOTAL WEIGHT', 'Pounds', 1000);
  const [autoFillSource, setAutoFillSource] = useState<'METAR' | 'OFP'>('OFP');
  const [metarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');

  const { usingMetric } = Units;

  const { showModal } = useModals();

  const {
    icao,
    availableRunways,
    selectedRunwayIndex,
    runwayHeading,
    runwayLength,
    elevation,
    slope,
    windDirection,
    windMagnitude,
    windEntry,
    temperature,
    pressure,
    weight,
    overweightProcedure,
    approachSpeed,
    flaps,
    runwayCondition,
    reverseThrust,
    autoland,
    maxAutobrakeLandingDist,
    mediumAutobrakeLandingDist,
    lowAutobrakeLandingDist,
    runwayVisualizationLabels,
    displayedRunwayLength,
  } = useAppSelector((state) => state.performance.landing);

  const { arrivingAirport, arrivingMetar } = useAppSelector((state) => state.simbrief.data);

  useEffect(() => {
    // in case of head- or tailwind entry only, the runway heading is used to set the wind direction
    if (windEntry?.length) {
      handleWindChange(windEntry);
    }
  }, [runwayHeading]);

  const handleCalculateLanding = (): void => {
    if (!areInputsValid()) return;
    const landingDistances = calculators.landing.calculateLandingDistances(
      weight ?? 0,
      flaps ?? LandingFlapsConfig.Full,
      runwayCondition,
      approachSpeed ?? 0,
      windDirection ?? 0,
      windMagnitude ?? 0,
      runwayHeading ?? 0,
      reverseThrust,
      elevation ?? 0,
      temperature ?? 0,
      slope ?? 0,
      overweightProcedure,
      pressure ?? 0,
      autoland,
    );

    dispatch(
      setLandingValues({
        maxAutobrakeLandingDist: Math.round(landingDistances.maxAutobrakeDist),
        mediumAutobrakeLandingDist: Math.round(landingDistances.mediumAutobrakeDist),
        lowAutobrakeLandingDist: Math.round(landingDistances.lowAutobrakeDist),
        runwayVisualizationLabels: [
          {
            label: 'LOW',
            distance: landingDistances.lowAutobrakeDist,
            type: LabelType.Main,
          },
          {
            label: 'MED',
            distance: landingDistances.mediumAutobrakeDist,
            type: LabelType.Main,
          },
          {
            label: 'MAX',
            distance: landingDistances.maxAutobrakeDist,
            type: LabelType.Main,
          },
        ],
        displayedRunwayLength: runwayLength ?? 0,
      }),
    );
  };

  const clearResult = () => {
    dispatch(
      setLandingValues({
        maxAutobrakeLandingDist: 0,
        mediumAutobrakeLandingDist: 0,
        lowAutobrakeLandingDist: 0,
        runwayVisualizationLabels: [],
      }),
    );
  };

  const syncValuesWithApiMetar = async (icao: string): Promise<void> => {
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

    try {
      const magvar = await getAirportMagVar(icao);
      const windDirection = MathUtils.normalise360(parsedMetar.wind.degrees - magvar);
      const windEntry = `${windDirection.toFixed(0).padStart(3, '0')}/${parsedMetar.wind.speed_kts.toFixed(0).padStart(2, '0')}`;

      dispatch(
        setLandingValues({
          windDirection,
          windMagnitude: parsedMetar.wind.speed_kts,
          windEntry,
          temperature: parsedMetar.temperature.celsius,
          pressure: parsedMetar.barometer.mb,
        }),
      );
    } catch (err) {
      toast.error('Could not fetch airport');
    }
  };

  const handleICAOChange = (icao: string) => {
    dispatch(clearLandingValues());

    dispatch(setLandingValues({ icao }));
    if (isValidIcao(icao)) {
      getRunways(icao)
        .then((runways) => {
          dispatch(setLandingValues({ availableRunways: runways }));
          if (runways.length > 0) {
            handleRunwayChange(0);
          } else {
            handleRunwayChange(-1);
          }
        })
        .catch(() => {
          clearAirportRunways();
        });
    } else {
      clearAirportRunways();
    }
  };

  const handleRunwayChange = (runwayIndex: number | undefined): void => {
    clearResult();

    const newRunway = runwayIndex !== undefined && runwayIndex >= 0 ? availableRunways[runwayIndex] : undefined;
    if (newRunway !== undefined) {
      const slope = -Math.tan(newRunway.gradient * Avionics.Utils.DEG2RAD) * 100;
      dispatch(
        setLandingValues({
          selectedRunwayIndex: runwayIndex,
          runwayHeading: newRunway.magneticBearing,
          runwayLength: newRunway.length,
          slope,
          elevation: newRunway.elevation,
        }),
      );
    } else {
      dispatch(
        setLandingValues({
          selectedRunwayIndex: -1,
          runwayHeading: undefined,
          runwayLength: undefined,
          slope: undefined,
          elevation: undefined,
        }),
      );
    }
  };

  const clearAirportRunways = () => {
    dispatch(
      setLandingValues({
        availableRunways: [],
        selectedRunwayIndex: -1,
        runwayBearing: undefined,
        runwayLength: undefined,
        runwaySlope: undefined,
        elevation: undefined,
      }),
    );
  };

  const handleWindChange = (input: string): void => {
    clearResult();

    if (input === '0') {
      dispatch(setLandingValues({ windMagnitude: 0, windDirection: runwayHeading, windEntry: input }));
      return;
    }

    if (isWindMagnitudeOnly(input)) {
      const magnitudeOnlyMatch = input.match(WIND_MAGNITUDE_ONLY_REGEX);
      const windMagnitude = parseFloat(magnitudeOnlyMatch[2]);
      switch (magnitudeOnlyMatch[1]) {
        case 'TL':
        case 'T':
        case '-':
          dispatch(setLandingValues({ windMagnitude: -windMagnitude, windDirection: runwayHeading, windEntry: input }));
          return;
        case 'HD':
        case 'H':
        case '+':
        default:
          dispatch(setLandingValues({ windMagnitude, windDirection: runwayHeading, windEntry: input }));
          return;
      }
    } else if (isWindMagnitudeAndDirection(input)) {
      const directionMagnitudeMatch = input.match(WIND_MAGNITUDE_AND_DIR_REGEX);
      dispatch(
        setLandingValues({
          windDirection: parseInt(directionMagnitudeMatch[1]),
          windMagnitude: parseFloat(directionMagnitudeMatch[2]),
          windEntry: input,
        }),
      );
      return;
    }
    dispatch(setLandingValues({ windMagnitude: undefined, windDirection: undefined, windEntry: input }));
  };

  const handleWeightChange = (value: string): void => {
    let weight: number | undefined = parseInt(value);

    if (Number.isNaN(weight)) {
      weight = undefined;
    } else if (weightUnit === 'lb') {
      weight = Units.poundToKilogram(weight);
    }

    dispatch(setLandingValues({ weight }));
  };

  const handleRunwayHeadingChange = (value: string): void => {
    clearResult();
    let runwayHeading: number | undefined = parseInt(value);

    if (Number.isNaN(runwayHeading)) {
      runwayHeading = undefined;
    }

    dispatch(setLandingValues({ runwayHeading }));
  };

  const handleApproachSpeedChange = (value: string): void => {
    clearResult();
    let approachSpeed: number | undefined = parseInt(value);

    if (Number.isNaN(approachSpeed)) {
      approachSpeed = undefined;
    }

    dispatch(setLandingValues({ approachSpeed }));
  };

  const handleElevationChange = (value: string): void => {
    clearResult();
    let elevation: number | undefined = parseInt(value);

    if (Number.isNaN(elevation)) {
      elevation = undefined;
    }

    dispatch(setLandingValues({ elevation }));
  };

  const handleTemperatureChange = (value: string): void => {
    clearResult();
    let temperature: number | undefined = parseFloat(value);

    if (Number.isNaN(temperature)) {
      temperature = undefined;
    } else if (temperatureUnit === 'F') {
      temperature = Units.fahrenheitToCelsius(temperature);
    }

    dispatch(setLandingValues({ temperature }));
  };

  const handleFlapsChange = (newValue: number | string): void => {
    clearResult();
    let flaps: LandingFlapsConfig = parseInt(newValue.toString());

    if (flaps !== LandingFlapsConfig.Full && flaps !== LandingFlapsConfig.Conf3) {
      flaps = LandingFlapsConfig.Full;
    }

    dispatch(setLandingValues({ flaps }));
  };

  const handleRunwayConditionChange = (newValue: number | string): void => {
    clearResult();
    let runwayCondition: LandingRunwayConditions = parseInt(newValue.toString());

    if (!runwayCondition) {
      runwayCondition = LandingRunwayConditions.Dry;
    }

    dispatch(setLandingValues({ runwayCondition }));
  };

  const handleReverseThrustChange = (newValue: boolean): void => {
    clearResult();
    const reverseThrust: boolean = newValue;

    dispatch(setLandingValues({ reverseThrust }));
  };

  const handleAutolandChange = (newValue: boolean): void => {
    clearResult();
    const autoland: boolean = newValue;

    dispatch(setLandingValues({ autoland }));
  };

  const handleRunwaySlopeChange = (value: string): void => {
    clearResult();
    let slope: number | undefined = parseFloat(value);

    if (Number.isNaN(slope)) {
      slope = undefined;
    }

    dispatch(setLandingValues({ slope }));
  };

  const handleRunwayLengthChange = (value: string): void => {
    clearResult();
    let runwayLength: number | undefined = parseInt(value);

    if (Number.isNaN(runwayLength)) {
      runwayLength = undefined;
    } else if (distanceUnit === 'ft') {
      runwayLength = Units.footToMetre(runwayLength);
    }

    dispatch(setLandingValues({ runwayLength }));
  };

  const handleOverweightProcedureChange = (newValue: boolean): void => {
    clearResult();
    const overweightProcedure: boolean = newValue;

    dispatch(setLandingValues({ overweightProcedure }));
  };

  const handlePressureChange = (value: string): void => {
    clearResult();
    let pressure: number | undefined = parseFloat(value);

    if (Number.isNaN(pressure)) {
      pressure = undefined;
    } else if (pressureUnit === 'inHg') {
      pressure = Units.inchOfMercuryToHectopascal(pressure);
    }

    dispatch(setLandingValues({ pressure }));
  };

  const handleClearInputs = (): void => {
    dispatch(clearLandingValues());
  };

  const areInputsValid = (): boolean =>
    windDirection !== undefined &&
    windMagnitude !== undefined &&
    weight !== undefined &&
    runwayHeading !== undefined &&
    approachSpeed !== undefined &&
    elevation !== undefined &&
    slope !== undefined &&
    temperature !== undefined &&
    pressure !== undefined &&
    runwayLength !== undefined;

  const handleAutoFill = () => {
    clearResult();
    if (autoFillSource === 'METAR') {
      syncValuesWithApiMetar(icao);
    } else {
      try {
        const parsedMetar: MetarParserType = parseMetar(arrivingMetar);

        const weightKgs = Math.round(Units.poundToKilogram(totalWeight));

        dispatch(
          setLandingValues({
            weight: weightKgs,
            windDirection: parsedMetar.wind.degrees,
            windMagnitude: parsedMetar.wind.speed_kts,
            temperature: parsedMetar.temperature.celsius,
            pressure: parsedMetar.barometer.mb,
          }),
        );
      } catch (err) {
        showModal(
          <PromptModal
            title={t('Performance.Landing.MetarErrorDialogTitle')}
            bodyText={t('Performance.Landing.MetarErrorDialogMessage')}
            cancelText="No"
            confirmText="Yes"
            onConfirm={() => syncValuesWithApiMetar(arrivingAirport)}
          />,
        );
      }

      dispatch(setLandingValues({ icao: arrivingAirport }));
    }
  };

  const isAutoFillIcaoValid = () => {
    if (autoFillSource === 'METAR') {
      return isValidIcao(icao);
    }
    return isValidIcao(arrivingAirport);
  };

  const [temperatureUnit, setTemperatureUnit] = usePersistentProperty(
    'EFB_PREFERRED_TEMPERATURE_UNIT',
    usingMetric ? 'C' : 'F',
  );
  const [pressureUnit, setPressureUnit] = usePersistentProperty(
    'EFB_PREFERRED_PRESSURE_UNIT',
    usingMetric ? 'hPa' : 'inHg',
  );
  const [distanceUnit, setDistanceUnit] = usePersistentProperty(
    'EFB_PREFERRED_DISTANCE_UNIT',
    usingMetric ? 'm' : 'ft',
  );
  const [weightUnit, setWeightUnit] = usePersistentProperty('EFB_PREFERRED_WEIGHT_UNIT', usingMetric ? 'kg' : 'lb');

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
        <div className="flex h-full w-full flex-col justify-between">
          <div className="mb-4">
            <div className="mb-8 mt-4">
              <div className="mt-4 flex flex-row justify-between">
                <Label text={t('Performance.Landing.Airport')}>
                  <SimpleInput
                    className="w-24 text-center uppercase"
                    value={icao}
                    placeholder="ICAO"
                    onChange={handleICAOChange}
                    maxLength={4}
                  />
                </Label>
                <div className="flex flex-row">
                  <TooltipWrapper text={fillDataTooltip()}>
                    <button
                      onClick={isAutoFillIcaoValid() ? handleAutoFill : undefined}
                      className={`flex flex-row items-center justify-center space-x-4 rounded-md rounded-r-none
                                            border-2 border-theme-highlight bg-theme-highlight px-8 py-2 text-theme-body outline-none
                                            transition duration-100 ${
                                              !isAutoFillIcaoValid()
                                                ? 'opacity-50'
                                                : 'hover:bg-theme-body ' + 'hover:text-theme-highlight'
                                            }`}
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
            <div className="grid w-full grid-cols-2 justify-between">
              <div className="flex w-full flex-col space-y-4 pb-10 pr-12">
                <Label text={t('Performance.Landing.Runway')}>
                  <SelectInput
                    className="w-64"
                    defaultValue={initialState.landing.selectedRunwayIndex}
                    value={selectedRunwayIndex}
                    onChange={handleRunwayChange}
                    options={[
                      { value: -1, displayValue: t('Performance.Landing.EnterManually') },
                      ...availableRunways.map((r, i) => ({ value: i, displayValue: r.ident })),
                    ]}
                    disabled={availableRunways.length === 0}
                  />
                </Label>
                <Label text={t('Performance.Landing.RunwayHeading')}>
                  <SimpleInput
                    className="w-64"
                    value={runwayHeading}
                    placeholder={t('Performance.Landing.RunwayHeadingUnit')}
                    min={0}
                    max={360}
                    padding={3}
                    decimalPrecision={0}
                    onChange={handleRunwayHeadingChange}
                    number
                  />
                </Label>
                <Label text={t('Performance.Landing.RunwayLda')}>
                  <div className="flex w-64 flex-row">
                    <SimpleInput
                      className="w-full rounded-r-none"
                      value={getVariableUnitDisplayValue<'ft' | 'm'>(
                        runwayLength,
                        distanceUnit as 'ft' | 'm',
                        'ft',
                        Units.metreToFoot,
                      )}
                      placeholder={distanceUnit}
                      min={0}
                      max={distanceUnit === 'm' ? 6000 : 19685.04}
                      decimalPrecision={0}
                      onChange={handleRunwayLengthChange}
                      number
                    />
                    <SelectInput
                      value={distanceUnit}
                      className="w-28 rounded-l-none"
                      options={[
                        { value: 'ft', displayValue: `${t('Performance.Landing.RunwayLdaUnitFt')}` },
                        { value: 'm', displayValue: `${t('Performance.Landing.RunwayLdaUnitMeter')}` },
                      ]}
                      onChange={(newValue: 'ft' | 'm') => setDistanceUnit(newValue)}
                    />
                  </div>
                </Label>
              </div>
              <div className="flex w-full flex-col space-y-4 pb-10 pl-12">
                <Label text={t('Performance.Landing.RunwayElevation')}>
                  <SimpleInput
                    className="w-64"
                    value={elevation}
                    placeholder={t('Performance.Landing.RunwayElevationUnit')}
                    min={-2000}
                    max={20000}
                    decimalPrecision={0}
                    onChange={handleElevationChange}
                    number
                  />
                </Label>
                <Label text={t('Performance.Landing.RunwaySlope')}>
                  <SimpleInput
                    className="w-64"
                    value={slope}
                    placeholder="%"
                    min={-2}
                    max={2}
                    decimalPrecision={1}
                    onChange={handleRunwaySlopeChange}
                    number
                    reverse
                  />
                </Label>
              </div>
              <div className="flex w-full flex-col space-y-4 pr-12">
                <Label text={t('Performance.Landing.RunwayCondition')}>
                  <SelectInput
                    className="w-64"
                    defaultValue={initialState.landing.runwayCondition}
                    value={runwayCondition}
                    onChange={handleRunwayConditionChange}
                    options={[
                      { value: 0, displayValue: t('Performance.Landing.RunwayConditions.Dry') },
                      { value: 1, displayValue: t('Performance.Landing.RunwayConditions.Good') },
                      { value: 2, displayValue: t('Performance.Landing.RunwayConditions.GoodMedium') },
                      { value: 3, displayValue: t('Performance.Landing.RunwayConditions.Medium') },
                      { value: 4, displayValue: t('Performance.Landing.RunwayConditions.MediumPoor') },
                      { value: 5, displayValue: t('Performance.Landing.RunwayConditions.Poor') },
                    ]}
                  />
                </Label>
                <Label text={t('Performance.Landing.Wind')}>
                  <SimpleInput
                    className="w-64"
                    value={windEntry}
                    placeholder={t('Performance.Landing.WindMagnitudeUnit')}
                    onChange={handleWindChange}
                    uppercase
                    wind
                  />
                </Label>
                <Label text={t('Performance.Landing.Temperature')}>
                  <div className="flex w-64 flex-row">
                    <SimpleInput
                      className="w-full rounded-r-none"
                      value={getVariableUnitDisplayValue<'C' | 'F'>(
                        temperature,
                        temperatureUnit as 'C' | 'F',
                        'F',
                        Units.celsiusToFahrenheit,
                      )}
                      placeholder={`°${temperatureUnit}`}
                      min={temperatureUnit === 'C' ? -55 : -67}
                      max={temperatureUnit === 'C' ? 55 : 131}
                      decimalPrecision={1}
                      onChange={handleTemperatureChange}
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
                <Label text={t('Performance.Landing.Qnh')}>
                  <div className="flex w-64 flex-row">
                    <SimpleInput
                      className="w-full rounded-r-none"
                      value={getVariableUnitDisplayValue<'hPa' | 'inHg'>(
                        pressure,
                        pressureUnit as 'hPa' | 'inHg',
                        'inHg',
                        Units.hectopascalToInchOfMercury,
                      )}
                      placeholder={pressureUnit}
                      min={pressureUnit === 'hPa' ? 800 : 23.624}
                      max={pressureUnit === 'hPa' ? 1200 : 35.43598}
                      decimalPrecision={2}
                      onChange={handlePressureChange}
                      number
                    />
                    <SelectInput
                      value={pressureUnit}
                      className="w-28 rounded-l-none"
                      options={[
                        { value: 'inHg', displayValue: 'inHg' },
                        { value: 'hPa', displayValue: 'hPa' },
                      ]}
                      onChange={(newValue: 'hPa' | 'inHg') => setPressureUnit(newValue)}
                    />
                  </div>
                </Label>
              </div>
              <div className="flex w-full flex-col space-y-4 pl-12">
                <Label text={t('Performance.Landing.LandingWeight')}>
                  <div className="flex w-64 flex-row">
                    <SimpleInput
                      className="w-full rounded-r-none"
                      value={getVariableUnitDisplayValue<'kg' | 'lb'>(
                        weight,
                        weightUnit as 'kg' | 'lb',
                        'lb',
                        Units.kilogramToPound,
                      )}
                      placeholder={weightUnit}
                      min={weightUnit === 'kg' ? 41000 : 90389}
                      max={weightUnit === 'kg' ? 100000 : 220462}
                      decimalPrecision={0}
                      onChange={handleWeightChange}
                      number
                    />
                    <SelectInput
                      value={weightUnit}
                      className="w-20 rounded-l-none"
                      options={[
                        { value: 'kg', displayValue: 'kg' },
                        { value: 'lb', displayValue: 'lb' },
                      ]}
                      onChange={(newValue: 'kg' | 'lb') => setWeightUnit(newValue)}
                    />
                  </div>
                </Label>
                <Label text={t('Performance.Landing.OverweightProcedure')}>
                  <SelectInput
                    className="w-64"
                    defaultValue={initialState.landing.overweightProcedure}
                    value={overweightProcedure}
                    onChange={handleOverweightProcedureChange}
                    options={[
                      { value: false, displayValue: `${t('Performance.Landing.DropDownNo')}` },
                      { value: true, displayValue: `${t('Performance.Landing.DropDownYes')}` },
                    ]}
                  />
                </Label>
                <Label text={t('Performance.Landing.FlapsConfiguration')}>
                  <SelectInput
                    className="w-64"
                    defaultValue={initialState.landing.flaps}
                    value={flaps}
                    onChange={handleFlapsChange}
                    options={[
                      { value: 1, displayValue: 'FULL' },
                      { value: 0, displayValue: 'CONF 3' },
                    ]}
                  />
                </Label>
                <Label text={t('Performance.Landing.ApproachSpeed')}>
                  <SimpleInput
                    className="w-64"
                    value={approachSpeed}
                    placeholder={t('Performance.Landing.ApproachSpeedUnit')}
                    min={90}
                    max={350}
                    decimalPrecision={0}
                    onChange={handleApproachSpeedChange}
                    number
                  />
                </Label>
                <Label text={t('Performance.Landing.ReverseThrust')}>
                  <SelectInput
                    className="w-64"
                    defaultValue={initialState.landing.reverseThrust}
                    value={reverseThrust}
                    onChange={handleReverseThrustChange}
                    options={[
                      { value: false, displayValue: `${t('Performance.Landing.DropDownNo')}` },
                      { value: true, displayValue: `${t('Performance.Landing.DropDownYes')}` },
                    ]}
                  />
                </Label>
                <Label text={t('Performance.Landing.AutoLand')}>
                  <SelectInput
                    className="w-64"
                    defaultValue={initialState.landing.autoland}
                    value={autoland}
                    onChange={handleAutolandChange}
                    options={[
                      { value: false, displayValue: `${t('Performance.Landing.DropDownNo')}` },
                      { value: true, displayValue: `${t('Performance.Landing.DropDownYes')}` },
                    ]}
                  />
                </Label>
              </div>
            </div>
            <div className="mt-14 flex flex-row space-x-8">
              <button
                onClick={handleCalculateLanding}
                className={`flex w-full flex-row items-center justify-center space-x-4 rounded-md border-2 border-theme-highlight
                                bg-theme-highlight py-2 text-theme-body outline-none hover:bg-theme-body hover:text-theme-highlight
                                ${!areInputsValid() && 'pointer-events-none opacity-50'}`}
                type="button"
                disabled={!areInputsValid()}
              >
                <Calculator size={26} />
                <p className="font-bold text-current">{t('Performance.Landing.Calculate')}</p>
              </button>
              <button
                onClick={handleClearInputs}
                className="flex w-full flex-row items-center justify-center space-x-4 rounded-md border-2 border-utility-red
                                bg-utility-red py-2 text-theme-body outline-none hover:bg-theme-body hover:text-utility-red"
                type="button"
              >
                <Trash size={26} />
                <p className="font-bold text-current">{t('Performance.Landing.Clear')}</p>
              </button>
            </div>
          </div>
          <div className="flex w-full flex-row divide-x-2 divide-theme-accent overflow-hidden rounded-lg border-2 border-theme-accent">
            <OutputDisplay
              label={t('Performance.Landing.MaximumManual')}
              value={
                distanceUnit === 'ft'
                  ? `${Math.round(Units.metreToFoot(maxAutobrakeLandingDist))}${t('Performance.Landing.UnitFt')}`
                  : `${maxAutobrakeLandingDist}${t('Performance.Landing.UnitMeter')}`
              }
              error={maxAutobrakeLandingDist > (displayedRunwayLength ?? 0)}
            />
            <OutputDisplay
              label={t('Performance.Landing.Medium')}
              value={
                distanceUnit === 'ft'
                  ? `${Math.round(Units.metreToFoot(mediumAutobrakeLandingDist))}${t('Performance.Landing.UnitFt')}`
                  : `${mediumAutobrakeLandingDist}${t('Performance.Landing.UnitMeter')}`
              }
              error={mediumAutobrakeLandingDist > (displayedRunwayLength ?? 0)}
            />
            <OutputDisplay
              label={t('Performance.Landing.Low')}
              value={
                distanceUnit === 'ft'
                  ? `${Math.round(Units.metreToFoot(lowAutobrakeLandingDist))}${t('Performance.Landing.UnitFt')}`
                  : `${lowAutobrakeLandingDist}${t('Performance.Landing.UnitMeter')}`
              }
              error={lowAutobrakeLandingDist > (displayedRunwayLength ?? 0)}
            />
          </div>
        </div>
      </div>
      <div className="mt-4">
        <RunwayVisualizationWidget
          mainLength={displayedRunwayLength}
          labels={runwayVisualizationLabels}
          runwayHeading={runwayHeading}
          distanceUnit={distanceUnit as 'm' | 'ft'}
        />
      </div>
    </div>
  );
};
