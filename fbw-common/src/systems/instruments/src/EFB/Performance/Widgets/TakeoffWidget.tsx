// Copyright (c) 2021-2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */

import React, { FC, useContext, useState } from 'react';
import { Metar as FbwApiMetar } from '@flybywiresim/api-client';
import { Metar as MsfsMetar } from '@microsoft/msfs-sdk';
import {
  Units,
  MetarParserType,
  usePersistentProperty,
  parseMetar,
  ConfigWeatherMap,
  RunwayCondition,
  TakeoffPerfomanceError,
  TakeoffAntiIceSetting,
  LineupAngle,
  MathUtils,
} from '@flybywiresim/fbw-sdk';
import { toast } from 'react-toastify';
import { Calculator, CloudArrowDown, Trash } from 'react-bootstrap-icons';
import { getAirportMagVar, getRunways } from '../Data/Runways';
import { t } from '../../Localization/translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { PromptModal, useModals } from '../../UtilComponents/Modals/Modals';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import {
  TakeoffCoGPositions,
  clearTakeoffValues,
  initialState,
  setTakeoffValues,
} from '../../Store/features/performance';
import { AircraftContext } from '../../AircraftContext';
import {
  isValidIcao,
  isWindMagnitudeAndDirection,
  isWindMagnitudeOnly,
  WIND_MAGNITUDE_AND_DIR_REGEX,
  WIND_MAGNITUDE_ONLY_REGEX,
} from '../Data/Utils';

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

export const TakeoffWidget = () => {
  const dispatch = useAppDispatch();

  const calculators = useContext(AircraftContext).performanceCalculators;

  const [autoFillSource, setAutoFillSource] = useState<'METAR' | 'OFP'>('OFP');
  const [metarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');

  const { usingMetric: usingMetricPinProg } = Units;

  const { showModal } = useModals();

  const {
    icao,
    availableRunways,
    selectedRunwayIndex,
    runwayBearing,
    runwayLength,
    elevation,
    runwaySlope,
    lineupAngle,
    windDirection,
    windMagnitude,
    windEntry,
    oat,
    qnh,
    weight,
    takeoffCg,
    config,
    antiIce,
    packs,
    forceToga,
    result,

    runwayCondition,
    cg,
  } = useAppSelector((state) => state.performance.takeoff);

  const selectedRunway =
    selectedRunwayIndex !== undefined && selectedRunwayIndex >= 0 ? availableRunways[selectedRunwayIndex] : undefined;

  const {
    departingAirport: ofpDepartingAirport,
    departingMetar: ofpDepartingMetar,
    departingRunway: ofpDepartingRunway,
    weights: ofpWeights,
    units: ofpUnits,
  } = useAppSelector((state) => state.simbrief.data);

  /**
   * Takeoff shift in metres as the difference between the entered TORA, and the length of the selected runway according to MSFS.
   */
  const takeoffShift =
    selectedRunway !== undefined && selectedRunway.length > runwayLength
      ? selectedRunway.length - runwayLength
      : undefined;

  const isContaminated = (runwayCondition: RunwayCondition): boolean => {
    return runwayCondition !== RunwayCondition.Dry && runwayCondition !== RunwayCondition.Wet;
  };

  const subReplacements = (msg: string, replacements: Record<string, string>): string => {
    return msg.replace(/\{([a-z_]+)\}/g, (m) => replacements[m.substring(1, m.length - 1)] ?? m[1]);
  };

  const performCalculateTakeoff = (headwind: number): void => {
    const perf =
      config > 0
        ? calculators.takeoff.calculateTakeoffPerformance(
            weight,
            takeoffCg === TakeoffCoGPositions.Forward,
            config,
            runwayLength,
            runwaySlope,
            lineupAngle,
            headwind,
            elevation,
            qnh,
            oat,
            antiIce,
            packs,
            forceToga,
            runwayCondition,
            cg,
          )
        : calculators.takeoff.calculateTakeoffPerformanceOptConf(
            weight,
            takeoffCg === TakeoffCoGPositions.Forward,
            runwayLength,
            runwaySlope,
            lineupAngle,
            headwind,
            elevation,
            qnh,
            oat,
            antiIce,
            packs,
            forceToga,
            runwayCondition,
            cg,
          );

    console.log('takeoff result', perf);

    const formatWeight = (kg: number | undefined): string => {
      return kg !== undefined ? Math.floor(weightUnit === 'lb' ? Units.kilogramToPound(kg) : kg).toFixed(0) : '-';
    };

    const replacements = {
      mtow: formatWeight(perf.mtow),
      weight_unit: weightUnit,
      oew: formatWeight(calculators.takeoff.oew),
      structural_mtow: formatWeight(calculators.takeoff.structuralMtow),
      max_zp: calculators.takeoff.maxPressureAlt.toFixed(0),
      max_headwind: calculators.takeoff.maxHeadwind.toFixed(0),
      max_tailwind: calculators.takeoff.maxTailwind.toFixed(0),
      tmax: perf.params?.tMax?.toFixed(0) ?? '-',
    };

    if (perf.error === TakeoffPerfomanceError.None) {
      dispatch(setTakeoffValues({ result: perf }));
      if (!forceToga && perf.flex === undefined) {
        toast.info(t('Performance.Takeoff.Messages.FlexNotPossible'));
      } else if (perf.params.headwind < perf.inputs.wind) {
        toast.info(subReplacements(t('Performance.Takeoff.Messages.HeadwindLimited'), replacements));
      }
    } else {
      dispatch(setTakeoffValues({ result: undefined }));
      toast.error(subReplacements(t(`Performance.Takeoff.Messages.${perf.error}`), replacements));
    }
  };

  const handleCalculateTakeoff = (): void => {
    if (!areInputsValid()) {
      return;
    }

    const headwind =
      windDirection === undefined
        ? windMagnitude
        : windMagnitude *
          Math.cos(Math.abs(Avionics.Utils.diffAngle(runwayBearing, windDirection)) * Avionics.Utils.DEG2RAD);
    const crosswind =
      windDirection === undefined
        ? 0
        : windMagnitude *
          Math.sin(Math.abs(Avionics.Utils.diffAngle(runwayBearing, windDirection)) * Avionics.Utils.DEG2RAD);

    if (crosswind > calculators.takeoff.getCrosswindLimit(runwayCondition, oat)) {
      const replacements = {
        max_crosswind: calculators.takeoff.getCrosswindLimit(runwayCondition, oat).toFixed(0),
        actual_crosswind: crosswind.toFixed(0),
      };
      showModal(
        <PromptModal
          title={subReplacements(t('Performance.Takeoff.CrosswindAboveLimitTitle'), replacements)}
          bodyText={subReplacements(t('Performance.Takeoff.CrosswindAboveLimitMessage'), replacements)}
          cancelText="No"
          confirmText="Yes"
          onConfirm={() => performCalculateTakeoff(headwind)}
        />,
      );
    } else {
      performCalculateTakeoff(headwind);
    }
  };

  const clearResult = () => {
    if (result === undefined) {
      return;
    }
    dispatch(
      setTakeoffValues({
        result: undefined,
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
        setTakeoffValues({
          windDirection,
          windMagnitude: parsedMetar.wind.speed_kts,
          windEntry,
          oat: parsedMetar.temperature.celsius,
          qnh: parsedMetar.barometer.mb,
        }),
      );
    } catch (err) {
      toast.error('Could not fetch airport');
    }
  };

  const clearAirportRunways = () => {
    dispatch(
      setTakeoffValues({
        availableRunways: [],
        selectedRunwayIndex: -1,
        runwayBearing: undefined,
        runwayLength: undefined,
        runwaySlope: undefined,
        elevation: undefined,
      }),
    );
  };

  const handleICAOChange = (icao: string) => {
    dispatch(clearTakeoffValues());

    dispatch(setTakeoffValues({ icao }));
    if (isValidIcao(icao)) {
      getRunways(icao)
        .then((runways) => {
          dispatch(setTakeoffValues({ availableRunways: runways }));
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
      const runwaySlope = -Math.tan(newRunway.gradient * Avionics.Utils.DEG2RAD) * 100;
      dispatch(
        setTakeoffValues({
          selectedRunwayIndex: runwayIndex,
          runwayBearing: newRunway.magneticBearing,
          runwayLength: newRunway.length,
          runwaySlope,
          elevation: newRunway.elevation,
        }),
      );
    } else {
      dispatch(
        setTakeoffValues({
          selectedRunwayIndex: -1,
          runwayBearing: undefined,
          runwayLength: undefined,
          runwaySlope: undefined,
          elevation: undefined,
        }),
      );
    }
  };

  const handleWeightChange = (value: string): void => {
    clearResult();

    let weight: number | undefined = parseInt(value);

    if (Number.isNaN(weight)) {
      weight = undefined;
    } else if (weightUnit === 'lb') {
      weight = Units.poundToKilogram(weight);
    }

    dispatch(setTakeoffValues({ weight }));
  };

  const handleRunwayBearingChange = (value: string): void => {
    clearResult();

    let runwayBearing: number | undefined = parseInt(value);

    if (Number.isNaN(runwayBearing)) {
      runwayBearing = undefined;
    }

    dispatch(setTakeoffValues({ runwayBearing }));
  };

  const handleElevationChange = (value: string): void => {
    clearResult();

    let elevation: number | undefined = parseInt(value);

    if (Number.isNaN(elevation)) {
      elevation = undefined;
    }

    dispatch(setTakeoffValues({ elevation }));
  };

  const handleTemperatureChange = (value: string): void => {
    clearResult();

    let oat: number | undefined = parseFloat(value);

    if (Number.isNaN(oat)) {
      oat = undefined;
    } else if (temperatureUnit === 'F') {
      oat = Units.fahrenheitToCelsius(oat);
    }

    dispatch(setTakeoffValues({ oat }));
  };

  const handleConfigChange = (newValue: number | string): void => {
    clearResult();

    let config = parseInt(newValue.toString());

    if (config !== -1 && config !== 1 && config !== 2 && config !== 3) {
      config = -1;
    }

    dispatch(setTakeoffValues({ config }));
  };

  const handleThrustChange = (newValue: boolean | string): void => {
    clearResult();

    dispatch(setTakeoffValues({ forceToga: !!newValue }));
  };

  const handleRunwayConditionChange = (runwayCondition: RunwayCondition): void => {
    clearResult();

    const newValues = { runwayCondition };
    if (isContaminated(runwayCondition)) {
      newValues['forceToga'] = true;
    }
    dispatch(setTakeoffValues(newValues));
  };

  const handleRunwaySlopeChange = (value: string): void => {
    clearResult();

    let runwaySlope: number | undefined = parseFloat(value);

    if (Number.isNaN(runwaySlope)) {
      runwaySlope = undefined;
    }

    dispatch(setTakeoffValues({ runwaySlope }));
  };

  const handleRunwayLengthChange = (value: string): void => {
    clearResult();

    let runwayLength: number | undefined = parseInt(value);

    if (Number.isNaN(runwayLength)) {
      runwayLength = undefined;
    } else if (distanceUnit === 'ft') {
      runwayLength = Units.footToMetre(runwayLength);
    }

    dispatch(setTakeoffValues({ runwayLength }));
  };

  const handlePressureChange = (value: string): void => {
    clearResult();

    let qnh: number | undefined = parseFloat(value);

    if (Number.isNaN(qnh)) {
      qnh = undefined;
    } else if (pressureUnit === 'inHg') {
      qnh = Units.inchOfMercuryToHectopascal(qnh);
    }

    dispatch(setTakeoffValues({ qnh }));
  };

  const handleAntiIce = (antiIce: TakeoffAntiIceSetting): void => {
    clearResult();

    dispatch(setTakeoffValues({ antiIce }));
  };

  const handleCoG = (takeoffCg: TakeoffCoGPositions): void => {
    clearResult();

    dispatch(setTakeoffValues({ takeoffCg }));
  };

  const handleLineupAngle = (lineupAngle: LineupAngle): void => {
    clearResult();

    dispatch(setTakeoffValues({ lineupAngle }));
  };

  const handlePacks = (packs: boolean): void => {
    clearResult();

    dispatch(setTakeoffValues({ packs }));
  };

  const handleClearInputs = (): void => {
    dispatch(clearTakeoffValues());
  };

  const handleWindChange = (input: string): void => {
    clearResult();

    if (input === '0') {
      dispatch(setTakeoffValues({ windMagnitude: 0, windDirection: undefined, windEntry: input }));
      return;
    }

    if (isWindMagnitudeOnly(input)) {
      const magnitudeOnlyMatch = input.match(WIND_MAGNITUDE_ONLY_REGEX);
      const windMagnitude = parseFloat(magnitudeOnlyMatch[2]);
      switch (magnitudeOnlyMatch[1]) {
        case 'TL':
        case 'T':
        case '-':
          dispatch(setTakeoffValues({ windMagnitude: -windMagnitude, windDirection: undefined, windEntry: input }));
          return;
        case 'HD':
        case 'H':
        case '+':
        default:
          dispatch(setTakeoffValues({ windMagnitude, windDirection: undefined, windEntry: input }));
          return;
      }
    } else if (isWindMagnitudeAndDirection(input)) {
      const directionMagnitudeMatch = input.match(WIND_MAGNITUDE_AND_DIR_REGEX);
      dispatch(
        setTakeoffValues({
          windDirection: parseInt(directionMagnitudeMatch[1]),
          windMagnitude: parseFloat(directionMagnitudeMatch[2]),
          windEntry: input,
        }),
      );
      return;
    }
    dispatch(setTakeoffValues({ windMagnitude: undefined, windDirection: undefined, windEntry: input }));
  };

  const areInputsValid = (): boolean =>
    windMagnitude !== undefined &&
    weight !== undefined &&
    runwayBearing !== undefined &&
    elevation !== undefined &&
    runwaySlope !== undefined &&
    oat !== undefined &&
    qnh !== undefined &&
    runwayLength !== undefined;

  const syncValuesWithOfp = async () => {
    const parsedMetar: MetarParserType = parseMetar(ofpDepartingMetar);

    const ofpTow = parseInt(ofpWeights.estTakeOffWeight);
    const weightKgs = ofpUnits === 'lbs' ? Math.round(Units.poundToKilogram(ofpTow)) : ofpTow;

    if (!isValidIcao(ofpDepartingAirport)) {
      toast.error('OFP airport is invalid');
      return;
    }
    try {
      const runways = await getRunways(ofpDepartingAirport);
      const magvar = await getAirportMagVar(ofpDepartingAirport);

      const runwayIndex = runways.findIndex((r) => r.ident === ofpDepartingRunway);
      if (runwayIndex >= 0) {
        const newRunway = runways[runwayIndex];
        const runwaySlope = -Math.tan(newRunway.gradient * Avionics.Utils.DEG2RAD) * 100;
        const windDirection = Math.round(MathUtils.normalise360(parsedMetar.wind.degrees - magvar));
        const windEntry = `${windDirection.toFixed(0).padStart(3, '0')}/${parsedMetar.wind.speed_kts}`;

        dispatch(
          setTakeoffValues({
            icao: ofpDepartingAirport,
            availableRunways: runways,
            selectedRunwayIndex: runwayIndex,
            runwayBearing: newRunway.magneticBearing,
            runwayLength: newRunway.length,
            runwaySlope,
            elevation: newRunway.elevation,
            weight: weightKgs,
            windDirection,
            windMagnitude: parsedMetar.wind.speed_kts,
            windEntry,
            oat: parsedMetar.temperature.celsius,
            qnh: parsedMetar.barometer.mb,
          }),
        );
      } else {
        throw new Error('Failed to import OFP');
      }
    } catch (e) {
      toast.error(e);
    }
  };

  const handleAutoFill = () => {
    clearResult();

    if (autoFillSource === 'METAR') {
      syncValuesWithApiMetar(icao);
    } else {
      syncValuesWithOfp();
    }
  };

  const isAutoFillIcaoValid = () => {
    if (autoFillSource === 'METAR') {
      return isValidIcao(icao);
    }
    return isValidIcao(ofpDepartingAirport);
  };

  const [temperatureUnit, setTemperatureUnit] = usePersistentProperty(
    'EFB_PREFERRED_TEMPERATURE_UNIT',
    usingMetricPinProg ? 'C' : 'F',
  );
  const [pressureUnit, setPressureUnit] = usePersistentProperty(
    'EFB_PREFERRED_PRESSURE_UNIT',
    usingMetricPinProg ? 'hPa' : 'inHg',
  );
  const [distanceUnit, setDistanceUnit] = usePersistentProperty(
    'EFB_PREFERRED_DISTANCE_UNIT',
    usingMetricPinProg ? 'm' : 'ft',
  );
  const [weightUnit, setWeightUnit] = usePersistentProperty(
    'EFB_PREFERRED_WEIGHT_UNIT',
    usingMetricPinProg ? 'kg' : 'lb',
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
        <div className="flex h-full w-full flex-col justify-between">
          <div className="mb-4">
            <div className="mb-8 mt-4">
              <div className="mt-4 flex flex-row justify-between">
                <Label text={t('Performance.Takeoff.Airport')}>
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
            <div className="flex w-full flex-row">
              <div className="grid w-full grid-cols-2 justify-between">
                <div className="flex w-full flex-col space-y-4 pb-10 pr-2">
                  <Label text={t('Performance.Takeoff.Runway')}>
                    <SelectInput
                      className="w-60"
                      defaultValue={initialState.takeoff.selectedRunwayIndex}
                      value={selectedRunwayIndex}
                      onChange={handleRunwayChange}
                      options={[
                        { value: -1, displayValue: t('Performance.Takeoff.EnterManually') },
                        ...availableRunways.map((r, i) => ({ value: i, displayValue: r.ident })),
                      ]}
                      disabled={availableRunways.length === 0}
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.RunwayHeading')}>
                    <SimpleInput
                      className="w-60"
                      value={runwayBearing}
                      placeholder={t('Performance.Takeoff.RunwayHeadingUnit')}
                      min={0}
                      max={360}
                      padding={3}
                      decimalPrecision={0}
                      onChange={handleRunwayBearingChange}
                      number
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.Tora')}>
                    <div className="flex w-60 flex-row">
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
                        className="w-20 rounded-l-none"
                        options={[
                          { value: 'ft', displayValue: `${t('Performance.Takeoff.RunwayLengthUnitFt')}` },
                          { value: 'm', displayValue: `${t('Performance.Takeoff.RunwayLengthUnitMeter')}` },
                        ]}
                        onChange={(newValue: 'ft' | 'm') => setDistanceUnit(newValue)}
                      />
                    </div>
                  </Label>
                </div>
                <div className="flex w-full flex-col space-y-4 pb-10 pl-4 pr-6">
                  <Label text={t('Performance.Takeoff.RunwayElevation')}>
                    <SimpleInput
                      className="w-48"
                      value={elevation}
                      placeholder={t('Performance.Takeoff.RunwayElevationUnit')}
                      min={-2000}
                      max={20000}
                      decimalPrecision={0}
                      onChange={handleElevationChange}
                      number
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.RunwaySlope')}>
                    <SimpleInput
                      className="w-48"
                      value={runwaySlope}
                      placeholder="%"
                      decimalPrecision={2}
                      onChange={handleRunwaySlopeChange}
                      number
                      reverse
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.EntryAngle')}>
                    <SelectInput
                      className="w-48"
                      defaultValue={initialState.takeoff.lineupAngle}
                      value={lineupAngle}
                      onChange={handleLineupAngle}
                      options={[
                        {
                          value: 0,
                          displayValue: t('Performance.Takeoff.EntryAngles.0'),
                        },
                        {
                          value: 90,
                          displayValue: t('Performance.Takeoff.EntryAngles.90'),
                        },
                        {
                          value: 180,
                          displayValue: t('Performance.Takeoff.EntryAngles.180'),
                        },
                      ]}
                    />
                  </Label>
                </div>
                <div className="flex w-full flex-col space-y-4 pr-2">
                  <Label text={t('Performance.Takeoff.RunwayCondition')}>
                    <SelectInput
                      className="w-60"
                      defaultValue={initialState.takeoff.runwayCondition}
                      value={runwayCondition}
                      onChange={handleRunwayConditionChange}
                      options={[
                        { value: RunwayCondition.Dry, displayValue: t('Performance.Takeoff.RunwayConditions.Dry') },
                        { value: RunwayCondition.Wet, displayValue: t('Performance.Takeoff.RunwayConditions.Wet') },
                        {
                          value: RunwayCondition.Contaminated6mmWater,
                          displayValue: t('Performance.Takeoff.RunwayConditions.Contaminated6mmWater'),
                        },
                        {
                          value: RunwayCondition.Contaminated13mmWater,
                          displayValue: t('Performance.Takeoff.RunwayConditions.Contaminated13mmWater'),
                        },
                        {
                          value: RunwayCondition.Contaminated6mmSlush,
                          displayValue: t('Performance.Takeoff.RunwayConditions.Contaminated6mmSlush'),
                        },
                        {
                          value: RunwayCondition.Contaminated13mmSlush,
                          displayValue: t('Performance.Takeoff.RunwayConditions.Contaminated13mmSlush'),
                        },
                        {
                          value: RunwayCondition.ContaminatedCompactedSnow,
                          displayValue: t('Performance.Takeoff.RunwayConditions.ContaminatedCompactedSnow'),
                        },
                        {
                          value: RunwayCondition.Contaminated5mmWetSnow,
                          displayValue: t('Performance.Takeoff.RunwayConditions.Contaminated5mmWetSnow'),
                        },
                        {
                          value: RunwayCondition.Contaminated15mmWetSnow,
                          displayValue: t('Performance.Takeoff.RunwayConditions.Contaminated15mmWetSnow'),
                        },
                        {
                          value: RunwayCondition.Contaminated30mmWetSnow,
                          displayValue: t('Performance.Takeoff.RunwayConditions.Contaminated30mmWetSnow'),
                        },
                        {
                          value: RunwayCondition.Contaminated10mmDrySnow,
                          displayValue: t('Performance.Takeoff.RunwayConditions.Contaminated10mmDrySnow'),
                        },
                        {
                          value: RunwayCondition.Contaminated100mmDrySnow,
                          displayValue: t('Performance.Takeoff.RunwayConditions.Contaminated100mmDrySnow'),
                        },
                      ]}
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.Wind')}>
                    <SimpleInput
                      className="w-60"
                      value={windEntry}
                      placeholder={t('Performance.Takeoff.WindMagnitudeUnit')}
                      onChange={handleWindChange}
                      uppercase
                      wind
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.Temperature')}>
                    <div className="flex w-60 flex-row">
                      <SimpleInput
                        className="w-full rounded-r-none"
                        value={getVariableUnitDisplayValue<'C' | 'F'>(
                          oat,
                          temperatureUnit as 'C' | 'F',
                          'F',
                          Units.celsiusToFahrenheit,
                        )}
                        placeholder={`°${temperatureUnit}`}
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
                  <Label text={t('Performance.Takeoff.Qnh')}>
                    <div className="flex w-60 flex-row">
                      <SimpleInput
                        className="w-full rounded-r-none"
                        value={getVariableUnitDisplayValue<'hPa' | 'inHg'>(
                          qnh,
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
                        className="w-24 rounded-l-none"
                        options={[
                          { value: 'inHg', displayValue: 'inHg' },
                          { value: 'hPa', displayValue: 'hPa' },
                        ]}
                        onChange={(newValue: 'hPa' | 'inHg') => setPressureUnit(newValue)}
                      />
                    </div>
                  </Label>
                </div>
                <div className="flex w-full flex-col space-y-4 pl-4 pr-6">
                  <Label text={t('Performance.Takeoff.Weight')}>
                    <div className="flex w-48 flex-row">
                      <SimpleInput
                        className="w-full rounded-r-none"
                        value={getVariableUnitDisplayValue<'kg' | 'lb'>(
                          weight,
                          weightUnit as 'kg' | 'lb',
                          'lb',
                          Units.kilogramToPound,
                        )}
                        placeholder={weightUnit}
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
                  <Label text={t('Performance.Takeoff.CoGPosition')}>
                    <SelectInput
                      className="w-48"
                      defaultValue={initialState.takeoff.takeoffCg}
                      value={takeoffCg}
                      onChange={handleCoG}
                      options={[
                        {
                          value: TakeoffCoGPositions.Standard,
                          displayValue: t('Performance.Takeoff.CoGPositions.Standard'),
                        },
                        {
                          value: TakeoffCoGPositions.Forward,
                          displayValue: t('Performance.Takeoff.CoGPositions.Forward'),
                        },
                      ]}
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.Configuration')}>
                    <SelectInput
                      className="w-48"
                      defaultValue={initialState.takeoff.config}
                      value={config}
                      onChange={handleConfigChange}
                      options={[
                        { value: -1, displayValue: 'OPT' },
                        { value: 1, displayValue: 'CONF 1+F' },
                        { value: 2, displayValue: 'CONF 2' },
                        { value: 3, displayValue: 'CONF 3' },
                      ]}
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.Thrust')}>
                    <SelectInput
                      className="w-48"
                      defaultValue={initialState.takeoff.forceToga}
                      value={forceToga}
                      onChange={handleThrustChange}
                      options={[
                        { value: false, displayValue: 'FLEX' },
                        { value: true, displayValue: 'TOGA' },
                      ]}
                      disabled={isContaminated(runwayCondition)}
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.AntiIce')}>
                    <SelectInput
                      className="w-48"
                      defaultValue={initialState.takeoff.antiIce}
                      value={antiIce}
                      onChange={handleAntiIce}
                      options={[
                        { value: TakeoffAntiIceSetting.Off, displayValue: 'Off' },
                        { value: TakeoffAntiIceSetting.Engine, displayValue: 'Engine' },
                        { value: TakeoffAntiIceSetting.EngineWing, displayValue: 'Engine & Wing' },
                      ]}
                    />
                  </Label>
                  <Label text={t('Performance.Takeoff.Packs')}>
                    <SelectInput
                      className="w-48"
                      defaultValue={initialState.takeoff.antiIce}
                      value={packs}
                      onChange={handlePacks}
                      options={[
                        { value: false, displayValue: 'Off' },
                        { value: true, displayValue: 'On' },
                      ]}
                    />
                  </Label>
                </div>
              </div>
              <div className="flex flex-col space-y-4">
                <div
                  style={{
                    padding: '10px 10px 60px 10px',
                    background: 'black',
                  }}
                >
                  <div className="mcdu-big text-white">
                    {'\xa0\xa0\xa0\xa0'}
                    TAKE OFF RWY
                    {'\xa0'}
                    <span className="mcdu-big text-green-500">{selectedRunway?.ident ?? ''}</span>
                  </div>
                  <div className="mcdu-sml text-white">{'\xa0V1\xa0\xa0\xa0FLP\xa0RETR'}</div>
                  <div className="mcdu-big text-white">
                    <span className={`mcdu-big ${result?.v1 !== undefined ? 'text-green-500' : 'text-white'}`}>
                      {result?.v1 !== undefined ? result.v1.toFixed(0) : '---'}
                    </span>
                    {'\xa0\xa0\xa0\xa0F=---'}
                  </div>
                  <div className="mcdu-sml text-white">{'\xa0VR\xa0\xa0\xa0SLT\xa0RETR\xa0\xa0TO\xa0SHIFT'}</div>
                  <div className="mcdu-big text-white">
                    <span className={`mcdu-big ${result?.vR !== undefined ? 'text-green-500' : 'text-white'}`}>
                      {result?.vR !== undefined ? result.vR.toFixed(0) : '---'}
                    </span>
                    {'\xa0\xa0\xa0\xa0S=---\xa0\xa0'}

                    {takeoffShift !== undefined ? (
                      <>
                        <span className={'mcdu-small text-white-500'}>{usingMetricPinProg ? '\xa0[M]' : '[FT]'}</span>
                        <span className={`mcdu-big ${takeoffShift !== undefined ? 'text-green-500' : 'text-white'}`}>
                          {Math.round(usingMetricPinProg ? takeoffShift : Units.metreToFoot(takeoffShift))
                            .toString()
                            .padStart(6, '\xa0')}
                        </span>
                      </>
                    ) : (
                      '\xa0\xa0\xa0\xa0\xa0\xa0----'
                    )}
                  </div>
                  <div className="mcdu-sml text-white">{'\xa0V2\xa0\xa0\xa0CLEAN\xa0\xa0\xa0\xa0FLAPS/THS'}</div>
                  <div className="mcdu-big text-white">
                    <span className={result?.v2 !== undefined ? 'mcdu-big text-green-500' : 'mcdu-big text-white'}>
                      {result?.v2 !== undefined ? result.v2.toFixed(0) : '---'}
                    </span>
                    {'\xa0\xa0\xa0\xa0O=---\xa0\xa0\xa0'}
                    <span className={`mcdu-big ${result?.inputs.conf !== undefined ? 'text-green-500' : 'text-white'}`}>
                      {result?.inputs.conf !== undefined ? result.inputs.conf.toString().padStart(3, '\xa0') : '---'}
                    </span>
                    <span className={`mcdu-big ${result?.stabTrim !== undefined ? 'text-green-500' : 'text-white'}`}>
                      /
                      {result?.stabTrim !== undefined
                        ? `${result.stabTrim < 0 ? 'DN' : 'UP'}${Math.abs(result.stabTrim).toFixed(1)}`
                        : '-----'}
                    </span>
                  </div>
                  <div className="mcdu-sml text-white">{'TRANS\xa0ALT\xa0\xa0\xa0FLEX\xa0TO\xa0TEMP'}</div>
                  <div className={`mcdu-big ${result?.flex !== undefined ? 'text-green-500' : 'text-white'}`}>
                    {'\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0'}
                    {result?.flex !== undefined ? result.flex.toFixed(0).padStart(4, '\xa0') : '----'}°
                  </div>
                  <div className="mcdu-sml text-white">{'THR RED/ACC\xa0\xa0ENG\xa0OUT\xa0ACC'}</div>
                  <div className="mcdu-big text-white">{'-----/-----\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0-----'}</div>
                </div>
              </div>
            </div>
            <div className="mt-14 flex flex-row space-x-8">
              <button
                onClick={handleCalculateTakeoff}
                className={`flex w-full flex-row items-center justify-center space-x-4 rounded-md border-2 border-theme-highlight bg-theme-highlight py-2 text-theme-body outline-none hover:bg-theme-body hover:text-theme-highlight ${!areInputsValid() && 'pointer-events-none cursor-not-allowed opacity-50'}`}
                type="button"
                disabled={!areInputsValid()}
              >
                <Calculator size={26} />
                <p className="font-bold text-current">{t('Performance.Takeoff.Calculate')}</p>
              </button>
              <button
                onClick={handleClearInputs}
                className="flex w-full flex-row items-center justify-center space-x-4 rounded-md border-2 border-utility-red bg-utility-red py-2 text-theme-body outline-none hover:bg-theme-body hover:text-utility-red"
                type="button"
              >
                <Trash size={26} />
                <p className="font-bold text-current">{t('Performance.Takeoff.Clear')}</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
