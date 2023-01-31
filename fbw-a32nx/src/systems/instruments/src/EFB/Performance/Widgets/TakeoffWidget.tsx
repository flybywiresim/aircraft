/* eslint-disable max-len */
/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { FC, useState } from 'react';
import { Units } from '@shared/units';
import { toast } from 'react-toastify';
import { Calculator, CloudArrowDown, Trash } from 'react-bootstrap-icons';
import { usePersistentProperty } from '@instruments/common/persistence';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { PromptModal, useModals } from '../../UtilComponents/Modals/Modals';
import { LandingRunwayConditions } from '../Calculators/LandingCalculator';
import { FlexCalculator, TakeoffFlapsConfig } from '../Calculators/TakeoffCalculator'
import RunwayVisualizationWidget, { LabelType } from './RunwayVisualizationWidget';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import { SelectInput } from '../../UtilComponents/Form/SelectInput/SelectInput';
import { useSimVar } from '../../../Common/simVars';
import { parseMetar } from '../../Utils/parseMetar';
import { MetarParserType } from '../../../Common/metarTypes';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import { clearLandingValues, initialState, setLandingValues } from '../../Store/features/performance';

interface OutputDisplayProps {
    label: string;
    value: string | number;
    error?: boolean;
    reverse?: boolean;
}

const OutputDisplay = (props: OutputDisplayProps) => (
    <div className={`flex flex-col justify-center items-center py-2 w-full ${props.error ? 'bg-red-800' : ''}`}>
        <p className="flex-shrink-0 font-bold">{props.label}</p>
        <p>
            {props.value}
        </p>
    </div>
);

interface LabelProps {
    className?: string;
    text: string;
}

const Label: FC<LabelProps> = ({ text, className, children }) => (
    <div className="flex flex-row justify-between items-center">
        <p className={`text-theme-text mr-4 ${className}`}>{text}</p>
        {children}
    </div>
);

export const TakeoffWidget = () => {
    const dispatch = useAppDispatch();

    const calculator: FlexCalculator = new FlexCalculator();

    const [totalWeight] = useSimVar('TOTAL WEIGHT', 'Pounds', 1000);
    const [autoFillSource, setAutoFillSource] = useState<'METAR' | 'OFP'>('OFP');

    const { usingMetric } = Units;

    const { showModal } = useModals();

    const {
        icao,
        windDirection,
        windMagnitude,
        weight,
        runwayHeading,
        flaps,
        runwayCondition,
        antiIce,
        packs,
        altitude,
        slope,
        temperature,
        pressure,
        runwayLength,
        takeoffDist,
        runwayVisualizationLabels,
        displayedRunwayLength,
        flex,

    } = useAppSelector((state) => state.performance.landing);

    const { arrivingAirport, arrivingMetar } = useAppSelector((state) => state.simbrief.data);

    const handleCalculateLanding = (): void => {
        if (!areInputsValid()) return;
        const takeoffData = calculator.flex(
            runwayLength ?? 0,
            windDirection ?? 0,
            windMagnitude ?? 0,
            weight ?? 0,
            pressure ?? 0,
            temperature ?? 0,
            flaps ?? 1,
            runwayHeading ?? 0,
            altitude ?? 0,
            antiIce,
            packs,
        );

        dispatch(setLandingValues({
            flex: takeoffData[0],
            takeoffDist: Math.round(takeoffData[1]),
            runwayVisualizationLabels: [
                {
                    label: 'T/O',
                    distance: takeoffData[1],
                    type: LabelType.Main,
                },
            ],
            displayedRunwayLength: runwayLength ?? 0,
        }));
    };

    const syncValuesWithApiMetar = async (icao: string): Promise<void> => {
        if (!isValidIcao(icao)) return;

        fetch(`https://api.flybywiresim.com/metar/${icao}`)
            .then((res) => {
                if (res.ok) {
                    return res.json();
                }
                return res.json().then((json) => {
                    throw new Error(json.message);
                });
            }).then((json) => {
                const parsedMetar: MetarParserType = parseMetar(json.metar);

                const weightKgs = Math.round(Units.poundToKilogram(totalWeight));

                dispatch(setLandingValues({
                    weight: weightKgs,
                    windDirection: parsedMetar.wind.degrees,
                    windMagnitude: parsedMetar.wind.speed_kts,
                    temperature: parsedMetar.temperature.celsius,
                    pressure: parsedMetar.barometer.mb,
                }));
            })
            .catch((err) => toast.error(err.message));
    };

    const isValidIcao = (icao: string): boolean => icao.length === 4;

    const handleICAOChange = (icao: string): void => {
        dispatch(setLandingValues(
            { icao },
        ));
    };

    const handleWindDirectionChange = (value: string): void => {
        let windDirection: number | undefined = parseInt(value);

        if (Number.isNaN(windDirection)) {
            windDirection = undefined;
        }

        dispatch(setLandingValues({ windDirection }));
    };

    const handleWindMagnitudeChange = (value: string): void => {
        let windMagnitude: number | undefined = parseInt(value);

        if (Number.isNaN(windMagnitude)) {
            windMagnitude = undefined;
        }

        dispatch(setLandingValues({ windMagnitude }));
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
        let runwayHeading: number | undefined = parseInt(value);

        if (Number.isNaN(runwayHeading)) {
            runwayHeading = undefined;
        }

        dispatch(setLandingValues({ runwayHeading }));
    };

    const handleAltitudeChange = (value: string): void => {
        let altitude: number | undefined = parseInt(value);

        if (Number.isNaN(altitude)) {
            altitude = undefined;
        }

        dispatch(setLandingValues({ altitude }));
    };

    const handleTemperatureChange = (value: string): void => {
        let temperature: number | undefined = parseFloat(value);

        if (Number.isNaN(temperature)) {
            temperature = undefined;
        } else if (temperatureUnit === 'F') {
            temperature = Units.fahrenheitToCelsius(temperature);
        }

        dispatch(setLandingValues({ temperature }));
    };

    const handleFlapsChange = (newValue: number | string): void => {
        let flaps = parseInt(newValue.toString());

        if (flaps !== TakeoffFlapsConfig.Three && flaps !== TakeoffFlapsConfig.Two) {
            flaps = TakeoffFlapsConfig.OnePlusF;
        }

        dispatch(setLandingValues({ flaps }));
    };

    const handleRunwayConditionChange = (newValue: number | string): void => {
        let runwayCondition: LandingRunwayConditions = parseInt(newValue.toString());

        if (!runwayCondition) {
            runwayCondition = LandingRunwayConditions.Dry;
        }

        dispatch(setLandingValues({ runwayCondition }));
    };

    const handleRunwaySlopeChange = (value: string): void => {
        let slope: number | undefined = parseInt(value);

        if (Number.isNaN(slope)) {
            slope = undefined;
        }

        dispatch(setLandingValues({ slope }));
    };

    const handleRunwayLengthChange = (value: string): void => {
        let runwayLength: number | undefined = parseInt(value);

        if (Number.isNaN(runwayLength)) {
            runwayLength = undefined;
        } else if (distanceUnit === 'ft') {
            runwayLength = Units.footToMetre(runwayLength);
        }

        dispatch(setLandingValues({ runwayLength }));
    };

    const handlePressureChange = (value: string): void => {
        let pressure: number | undefined = parseFloat(value);

        if (Number.isNaN(pressure)) {
            pressure = undefined;
        } else if (pressureUnit === 'inHg') {
            pressure = Units.inchOfMercuryToHectopascal(pressure);
        }

        dispatch(setLandingValues({ pressure }));
    };

    const handleAntiIceChange = (newValue: boolean): void => {
        const antiIce: boolean = newValue;

        dispatch(setLandingValues({ antiIce }));
    };

    const handlePacksChange = (newValue: boolean): void => {
        const packs: boolean = newValue;

        dispatch(setLandingValues({ packs }));
    };

    const handleClearInputs = (): void => {
        dispatch(clearLandingValues());
    };

    const areInputsValid = (): boolean => windDirection !== undefined
            && windMagnitude !== undefined
            && weight !== undefined
            && runwayHeading !== undefined
            && altitude !== undefined
            && slope !== undefined
            && temperature !== undefined
            && pressure !== undefined
            && runwayLength !== undefined;

    const handleAutoFill = () => {
        if (autoFillSource === 'METAR') {
            syncValuesWithApiMetar(icao);
        } else {
            try {
                const parsedMetar: MetarParserType = parseMetar(arrivingMetar);

                const weightKgs = Math.round(Units.poundToKilogram(totalWeight));

                dispatch(setLandingValues({
                    weight: weightKgs,
                    windDirection: parsedMetar.wind.degrees,
                    windMagnitude: parsedMetar.wind.speed_kts,
                    temperature: parsedMetar.temperature.celsius,
                    pressure: parsedMetar.barometer.mb,
                }));
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

    const [temperatureUnit, setTemperatureUnit] = usePersistentProperty('EFB_PREFERRED_TEMPERATURE_UNIT', usingMetric ? 'C' : 'F');
    const [pressureUnit, setPressureUnit] = usePersistentProperty('EFB_PREFERRED_PRESSURE_UNIT', usingMetric ? 'hPa' : 'inHg');
    const [distanceUnit, setDistanceUnit] = usePersistentProperty('EFB_PREFERRED_DISTANCE_UNIT', usingMetric ? 'm' : 'ft');
    const [weightUnit, setWeightUnit] = usePersistentProperty('EFB_PREFERRED_WEIGHT_UNIT', usingMetric ? 'kg' : 'lb');

    const getVariableUnitDisplayValue = <T, >(value: number | undefined, unit: T, imperialUnit: T, metricToImperial: (value: number) => number) => {
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
        default: return undefined;
        }

        return undefined;
    };

    return (
        <div className="flex overflow-hidden flex-row justify-between space-x-10 h-content-section-reduced">
            <div className="w-full">
                <div className="flex flex-col justify-between w-full h-full">
                    <div className="mb-4">
                        <div className="mt-4 mb-8">
                            <p>{t('Performance.Landing.AirportIcao')}</p>
                            <div className="flex flex-row justify-between mt-4">
                                <SimpleInput className="w-64 uppercase" value={icao} placeholder="ICAO" onChange={handleICAOChange} maxLength={4} />
                                <div className="flex flex-row">
                                    <TooltipWrapper text={fillDataTooltip()}>
                                        <button
                                            onClick={isAutoFillIcaoValid() ? handleAutoFill : undefined}
                                            className={`rounded-md rounded-r-none flex flex-row justify-center items-center px-8 py-2 space-x-4 text-theme-body transition duration-100 border-2 border-theme-highlight bg-theme-highlight outline-none ${!isAutoFillIcaoValid() ? 'opacity-50' : 'hover:text-theme-highlight hover:bg-theme-body'}`}
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
                                <Label text={t('Performance.Landing.WindDirection')}>
                                    <SimpleInput
                                        className="w-64"
                                        value={windDirection}
                                        placeholder={t('Performance.Landing.WindDirectionUnit')}
                                        min={0}
                                        max={360}
                                        padding={3}
                                        decimalPrecision={0}
                                        onChange={handleWindDirectionChange}
                                        number
                                    />
                                </Label>
                                <Label text={t('Performance.Landing.WindMagnitude')}>
                                    <SimpleInput
                                        className="w-64"
                                        value={windMagnitude}
                                        placeholder={t('Performance.Landing.WindMagnitudeUnit')}
                                        min={0}
                                        decimalPrecision={1}
                                        onChange={handleWindMagnitudeChange}
                                        number
                                    />
                                </Label>
                                <Label text={t('Performance.Landing.Temperature')}>
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            className="w-full rounded-r-none"
                                            value={getVariableUnitDisplayValue<'C' | 'F'>(temperature, temperatureUnit as 'C' | 'F', 'F', Units.celsiusToFahrenheit)}
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
                                            onChange={(newValue: 'C'| 'F') => setTemperatureUnit(newValue)}
                                        />
                                    </div>
                                </Label>
                                <Label text={t('Performance.Landing.Qnh')}>
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            className="w-full rounded-r-none"
                                            value={getVariableUnitDisplayValue<'hPa' | 'inHg'>(pressure, pressureUnit as 'hPa' | 'inHg', 'inHg', Units.hectopascalToInchOfMercury)}
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
                                            onChange={(newValue: 'hPa'| 'inHg') => setPressureUnit(newValue)}
                                        />
                                    </div>
                                </Label>
                                <Label text={t('Performance.Landing.RunwayAltitude')}>
                                    <SimpleInput
                                        className="w-64"
                                        value={altitude}
                                        placeholder={t('Performance.Landing.RunwayAltitudeUnit')}
                                        min={-2000}
                                        max={20000}
                                        decimalPrecision={0}
                                        onChange={handleAltitudeChange}
                                        number
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
                                <Label text={t('Performance.Landing.RunwayCondition')}>
                                    <SelectInput
                                        className="w-64"
                                        defaultValue={initialState.takeoff.runwayCondition}
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
                            </div>
                            <div className="flex flex-col space-y-4">
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
                                <Label text={t('Performance.Takeoff.TORA')}>
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            className="w-full rounded-r-none"
                                            value={getVariableUnitDisplayValue<'ft' | 'm'>(runwayLength, distanceUnit as 'ft' | 'm', 'ft', Units.metreToFoot)}
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
                                <Label text={t('Performance.Landing.Weight')}>
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            className="w-full rounded-r-none"
                                            value={getVariableUnitDisplayValue<'kg' | 'lb'>(weight, weightUnit as 'kg' | 'lb', 'lb', Units.kilogramToPound)}
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
                                <Label text={t('Performance.Landing.FlapsConfiguration')}>
                                    <SelectInput
                                        className="w-64"
                                        defaultValue={initialState.takeoff.flaps}
                                        value={flaps}
                                        onChange={handleFlapsChange}
                                        options={[
                                            { value: TakeoffFlapsConfig.OnePlusF, displayValue: '1 + F' },
                                            { value: TakeoffFlapsConfig.Two, displayValue: '2' },
                                            { value: TakeoffFlapsConfig.Three, displayValue: '3' },
                                        ]}
                                    />
                                </Label>
                                <Label text={t('Performance.Takeoff.AntiIce')}>
                                    <SelectInput
                                        className="w-64"
                                        defaultValue={initialState.takeoff.antiIce}
                                        value={antiIce}
                                        onChange={handleAntiIceChange}
                                        options={[
                                            { value: false, displayValue: `${t('Performance.Landing.DropDownNo')}` },
                                            { value: true, displayValue: `${t('Performance.Landing.DropDownYes')}` },
                                        ]}
                                    />
                                </Label>
                                <Label text={t('Performance.Takeoff.Packs')}>
                                    <SelectInput
                                        className="w-64"
                                        defaultValue={initialState.takeoff.packs}
                                        value={packs}
                                        onChange={handlePacksChange}
                                        options={[
                                            { value: false, displayValue: `${t('Performance.Landing.DropDownNo')}` },
                                            { value: true, displayValue: `${t('Performance.Landing.DropDownYes')}` },
                                        ]}
                                    />
                                </Label>
                            </div>
                        </div>
                        <div className="flex flex-row mt-14 space-x-8">
                            <button
                                onClick={handleCalculateLanding}
                                className={`rounded-md flex flex-row justify-center items-center py-2 space-x-4 w-full bg-theme-highlight outline-none border-2 border-theme-highlight text-theme-body hover:text-theme-highlight hover:bg-theme-body ${!areInputsValid() && 'opacity-50 pointer-events-none'}`}
                                type="button"
                                disabled={!areInputsValid()}
                            >
                                <Calculator size={26} />
                                <p className="font-bold text-current">{t('Performance.Landing.Calculate')}</p>
                            </button>
                            <button
                                onClick={handleClearInputs}
                                className="flex flex-row justify-center items-center py-2 space-x-4 w-full rounded-md border-2 outline-none text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red"
                                type="button"
                            >
                                <Trash size={26} />
                                <p className="font-bold text-current">{t('Performance.Landing.Clear')}</p>
                            </button>
                        </div>
                    </div>
                    <div className="flex overflow-hidden flex-row w-full rounded-lg border-2 divide-x-2 border-theme-accent divide-theme-accent">
                        <OutputDisplay
                            label={t('Performance.Takeoff.Distance')}
                            value={distanceUnit === 'ft'
                                ? `${Math.round(Units.metreToFoot(takeoffDist))}${t('Performance.Landing.UnitFt')}`
                                : `${takeoffDist}${t('Performance.Landing.UnitMeter')}`}
                            error={takeoffDist > (displayedRunwayLength ?? 0)}
                        />
                        <OutputDisplay
                            label={t('Performance.Takeoff.Flex')}
                            value={flex}
                            error={flex > (74 ?? 0) || flex < (0 ?? 0)}
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
