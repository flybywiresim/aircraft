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
import metarParser from 'aewx-metar-parser';
import { Calculator, CloudArrowDown, Trash } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import { usePersistentProperty } from '@instruments/common/persistence';
import { useSimVar } from '@instruments/common/simVars';
import { MetarParserType } from '@instruments/common/metarTypes';
import LandingCalculator, { LandingFlapsConfig, LandingRunwayConditions } from '../Calculators/LandingCalculator';
import RunwayVisualizationWidget, { LabelType } from './RunwayVisualizationWidget';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';
import SelectInput from '../../UtilComponents/Form/SelectInput/SelectInput';
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

const POUNDS_TO_KGS = 0.453592;

export const LandingWidget = () => {
    const dispatch = useAppDispatch();

    const calculator: LandingCalculator = new LandingCalculator();

    const [totalWeight] = useSimVar('TOTAL WEIGHT', 'Pounds', 1000);
    const [autoFillSource, setAutoFillSource] = useState<'METAR' | 'OFP'>('METAR');

    const usingMetric = usePersistentProperty('CONFIG_USING_METRIC_UNIT', '1')[0] === '1';

    const {
        icao,
        windDirection,
        windMagnitude,
        weight,
        runwayHeading,
        approachSpeed,
        flaps,
        runwayCondition,
        reverseThrust,
        altitude,
        slope,
        temperature,
        overweightProcedure,
        pressure,
        runwayLength,
        maxAutobrakeLandingDist,
        mediumAutobrakeLandingDist,
        lowAutobrakeLandingDist,
        runwayVisualizationLabels,
        runwayNumber,
        displayedRunwayLength,
    } = useAppSelector((state) => state.performance.landing);

    const { arrivingAirport } = useAppSelector((state) => state.simbrief.data);

    const handleCalculateLanding = (): void => {
        if (!areInputsValid()) return;
        const landingDistances = calculator.calculateLandingDistances(
            weight ?? 0,
            flaps ?? LandingFlapsConfig.Full,
            runwayCondition,
            approachSpeed ?? 0,
            windDirection ?? 0,
            windMagnitude ?? 0,
            runwayHeading ?? 0,
            reverseThrust,
            altitude ?? 0,
            temperature ?? 0,
            slope ?? 0,
            overweightProcedure,
            pressure ?? 0,
        );

        dispatch(setLandingValues({
            maxAutobrakeLandingDist: Math.round(landingDistances.maxAutobrakeDist),
            mediumAutobrakeLandingDist: Math.round(landingDistances.mediumAutobrakeDist),
            lowAutobrakeLandingDist: Math.round(landingDistances.lowAutobrakeDist),
            runwayVisualizationLabels: [
                {
                    label: 'MAX MANUAL',
                    distance: landingDistances.maxAutobrakeDist,
                    type: LabelType.Main,
                },
                {
                    label: 'MEDIUM',
                    distance: landingDistances.mediumAutobrakeDist,
                    type: LabelType.Main,
                },
                {
                    label: 'LOW',
                    distance: landingDistances.lowAutobrakeDist,
                    type: LabelType.Main,
                },
            ],
            runwayNumber: Math.round((runwayHeading ?? 0) / 10),
            displayedRunwayLength: runwayLength ?? 0,
        }));
    };

    const handleSyncValues = async (icao: string): Promise<void> => {
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
                const parsedMetar: MetarParserType = metarParser(json.metar);

                const weightKgs = Math.round(totalWeight * POUNDS_TO_KGS);

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
        } else if (weightUnit === 'kg') {
            weight /= 2.20462;
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

    const handleApproachSpeedChange = (value: string): void => {
        let approachSpeed: number | undefined = parseInt(value);

        if (Number.isNaN(approachSpeed)) {
            approachSpeed = undefined;
        }

        dispatch(setLandingValues({ approachSpeed }));
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
            temperature = (temperature - 32) * 5 / 9;
        }

        dispatch(setLandingValues({ temperature }));
    };

    const handleFlapsChange = (newValue: number | string): void => {
        let flaps: LandingFlapsConfig = parseInt(newValue.toString());

        if (flaps !== LandingFlapsConfig.Full && flaps !== LandingFlapsConfig.Conf3) {
            flaps = LandingFlapsConfig.Full;
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

    const handleReverseThrustChange = (newValue: boolean): void => {
        const reverseThrust: boolean = newValue;

        dispatch(setLandingValues({ reverseThrust }));
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
            runwayLength /= 3.28084;
        }

        dispatch(setLandingValues({ runwayLength }));
    };

    const handleOverweightProcedureChange = (newValue: boolean): void => {
        const overweightProcedure: boolean = newValue;

        dispatch(setLandingValues({ overweightProcedure }));
    };

    const handlePressureChange = (value: string): void => {
        let pressure: number | undefined = parseFloat(value);

        if (Number.isNaN(pressure)) {
            pressure = undefined;
        } else if (pressureUnit === 'inHg') {
            pressure *= 33.864;
        }

        dispatch(setLandingValues({ pressure }));
    };

    const handleClearInputs = (): void => {
        dispatch(clearLandingValues());
    };

    const areInputsValid = (): boolean => windDirection !== undefined
            && windMagnitude !== undefined
            && weight !== undefined
            && runwayHeading !== undefined
            && approachSpeed !== undefined
            && altitude !== undefined
            && slope !== undefined
            && temperature !== undefined
            && pressure !== undefined
            && runwayLength !== undefined;

    const handleAutoFill = () => {
        if (autoFillSource === 'METAR') {
            handleSyncValues(icao);
        } else {
            handleSyncValues(arrivingAirport);
            dispatch(setLandingValues({ icao: arrivingAirport }));
        }
    };

    const isAutoFillIcaoValid = () => {
        if (autoFillSource === 'METAR') {
            return isValidIcao(icao);
        }
        return isValidIcao(arrivingAirport);
    };

    const [temperatureUnit, setTemperatureUnit] = useState<'C' | 'F'>(usingMetric ? 'C' : 'F');
    const [pressureUnit, setPressureUnit] = useState<'hPa' | 'inHg'>(usingMetric ? 'hPa' : 'inHg');
    const [distanceUnit, setDistanceUnit] = useState<'ft' | 'm'>(usingMetric ? 'ft' : 'm');
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(usingMetric ? 'kg' : 'lb');

    const handleTemperatureUnitChange = (newValue: 'C'| 'F'): void => {
        setTemperatureUnit(newValue);
    };

    const getTemperatureDisplayValue = () => {
        if (temperature !== undefined) {
            if (temperatureUnit === 'F') {
                return (temperature * 9 / 5) + 32;
            }
            return temperature;
        }
        return undefined;
    };

    const handlePressureUnitChange = (newValue: 'hPa'| 'inHg'): void => {
        setPressureUnit(newValue);
    };

    const getPressureDisplayValue = () => {
        if (pressure !== undefined) {
            if (pressureUnit === 'inHg') {
                return pressure / 33.864;
            }
            return pressure;
        }
        return undefined;
    };

    const handleDistanceUnitChange = (newValue: 'ft' | 'm') => {
        setDistanceUnit(newValue);
    };

    const getDistanceDisplayValue = () => {
        if (runwayLength !== undefined) {
            if (distanceUnit === 'ft') {
                return runwayLength * 3.28084;
            }
            return runwayLength;
        }
        return undefined;
    };

    const handleWeightUnitChange = (newValue: 'kg' | 'lb'): void => {
        setWeightUnit(newValue);
    };

    const getWeightDisplayValue = () => {
        if (weight !== undefined) {
            if (weightUnit === 'lb') {
                return weight * 2.20462;
            }
            return weight;
        }
        return undefined;
    };

    return (
        <div className="flex flex-row justify-between h-efb">
            <div className="w-full">
                <div className="flex flex-col justify-between w-full h-full">
                    <div className="mb-4">
                        <div className="mt-4 mb-8">
                            <p>Airport ICAO</p>
                            <div className="flex flex-row justify-between mt-4">
                                <SimpleInput className="w-64 uppercase" noLabel value={icao} placeholder="ICAO" onChange={handleICAOChange} maxLength={4} />
                                <div className="flex flex-row">
                                    <button
                                        onClick={handleAutoFill}
                                        className={`rounded-md rounded-r-none flex flex-row justify-center items-center px-8 py-2 gap-x-4 text-white bg-indigo-800 outline-none ${!isAutoFillIcaoValid() && 'opacity-50'}`}
                                        type="button"
                                        disabled={!isAutoFillIcaoValid()}
                                    >
                                        <CloudArrowDown size={26} />
                                        Fill from
                                    </button>
                                    <SelectInput
                                        value={autoFillSource}
                                        className="w-36 rounded-l-none"
                                        options={[
                                            { value: 'METAR', displayValue: 'METAR' },
                                            { value: 'OFP', displayValue: 'OFP' },
                                        ]}
                                        onChange={(value: 'METAR' | 'OFP') => setAutoFillSource(value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-row justify-between">
                            <div className="flex flex-col gap-y-4">
                                <Label text="Wind Direction">
                                    <SimpleInput
                                        className="w-64"
                                        noLabel
                                        value={windDirection}
                                        placeholder="&deg;"
                                        min={0}
                                        max={360}
                                        padding={3}
                                        decimalPrecision={0}
                                        onChange={handleWindDirectionChange}
                                        number
                                    />
                                </Label>
                                <Label text="Wind Magnitude">
                                    <SimpleInput
                                        noLabel
                                        className="w-64"
                                        value={windMagnitude}
                                        placeholder="kts"
                                        min={0}
                                        decimalPrecision={1}
                                        onChange={handleWindMagnitudeChange}
                                        number
                                    />
                                </Label>
                                <Label text="Temperature">
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            noLabel
                                            className="w-full rounded-r-none"
                                            value={getTemperatureDisplayValue()}
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
                                            onChange={handleTemperatureUnitChange}
                                        />
                                    </div>
                                </Label>
                                <Label text="QNH">
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            noLabel
                                            className="w-full rounded-r-none"
                                            value={getPressureDisplayValue()}
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
                                            onChange={handlePressureUnitChange}
                                        />
                                    </div>
                                </Label>
                                <Label text="Runway Altitude">
                                    <SimpleInput
                                        noLabel
                                        className="w-64"
                                        value={altitude}
                                        placeholder="ft ASL"
                                        min={-2000}
                                        max={20000}
                                        decimalPrecision={0}
                                        onChange={handleAltitudeChange}
                                        number
                                    />
                                </Label>
                                <Label text="Runway Heading">
                                    <SimpleInput
                                        noLabel
                                        className="w-64"
                                        value={runwayHeading}
                                        placeholder="&deg;"
                                        min={0}
                                        max={360}
                                        padding={3}
                                        decimalPrecision={0}
                                        onChange={handleRunwayHeadingChange}
                                        number
                                    />
                                </Label>
                                <Label text="Runway Condition">
                                    <SelectInput
                                        className="w-64"
                                        defaultValue={initialState.landing.runwayCondition}
                                        value={runwayCondition}
                                        onChange={handleRunwayConditionChange}
                                        dropdownOnTop
                                        options={[
                                            { value: 0, displayValue: 'Dry (6)' },
                                            { value: 1, displayValue: 'Good (5)' },
                                            { value: 2, displayValue: 'Good-Medium (4)' },
                                            { value: 3, displayValue: 'Medium (3)' },
                                            { value: 4, displayValue: 'Medium-Poor (2)' },
                                            { value: 5, displayValue: 'Poor (1)' },
                                        ]}
                                    />
                                </Label>
                            </div>
                            <div className="flex flex-col gap-y-4">
                                <Label text="Runway Slope">
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
                                        noLabel
                                    />
                                </Label>
                                <Label text="Runway LDA">
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            noLabel
                                            className="w-full rounded-r-none"
                                            value={getDistanceDisplayValue()}
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
                                                { value: 'ft', displayValue: 'ft' },
                                                { value: 'm', displayValue: 'm' },
                                            ]}
                                            onChange={handleDistanceUnitChange}
                                        />
                                    </div>
                                </Label>
                                <Label text="Approach Speed">
                                    <SimpleInput
                                        className="w-64"
                                        value={approachSpeed}
                                        placeholder="kts"
                                        min={90}
                                        max={350}
                                        decimalPrecision={0}
                                        onChange={handleApproachSpeedChange}
                                        number
                                        noLabel
                                    />
                                </Label>
                                <Label text="Weight">
                                    <div className="flex flex-row w-64">
                                        <SimpleInput
                                            className="w-full rounded-r-none"
                                            value={getWeightDisplayValue()}
                                            placeholder={weightUnit}
                                            min={weightUnit === 'kg' ? 41000 : 90389}
                                            max={weightUnit === 'kg' ? 100000 : 220462}
                                            decimalPrecision={0}
                                            onChange={handleWeightChange}
                                            number
                                            noLabel
                                        />
                                        <SelectInput
                                            value={weightUnit}
                                            className="w-20 rounded-l-none"
                                            options={[
                                                { value: 'kg', displayValue: 'kg' },
                                                { value: 'lb', displayValue: 'lb' },
                                            ]}
                                            onChange={handleWeightUnitChange}
                                        />
                                    </div>
                                </Label>
                                <Label text="Flaps Configuration">
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
                                <Label text="Overweight Procedure">
                                    <SelectInput
                                        className="w-64"
                                        defaultValue={initialState.landing.overweightProcedure}
                                        value={overweightProcedure}
                                        onChange={handleOverweightProcedureChange}
                                        options={[
                                            { value: false, displayValue: 'No' },
                                            { value: true, displayValue: 'Yes' },
                                        ]}
                                    />
                                </Label>
                                <Label text="Reverse Thrust">
                                    <SelectInput
                                        className="w-64"
                                        defaultValue={initialState.landing.reverseThrust}
                                        value={reverseThrust}
                                        onChange={handleReverseThrustChange}
                                        options={[
                                            { value: false, displayValue: 'No' },
                                            { value: true, displayValue: 'Yes' },
                                        ]}
                                    />
                                </Label>
                            </div>
                        </div>
                        <div className="flex flex-row mt-14 space-x-4">
                            <button
                                onClick={handleCalculateLanding}
                                className={`rounded-md flex flex-row justify-center items-center py-2 gap-x-4 w-1/2 text-white bg-blue-500 outline-none ${!areInputsValid() && 'opacity-50'}`}
                                type="button"
                                disabled={!areInputsValid()}
                            >
                                <Calculator size={26} />
                                Calculate
                            </button>
                            <button
                                onClick={handleClearInputs}
                                className="flex flex-row gap-x-4 justify-center items-center py-2 w-1/2 text-white bg-red-500 rounded-md outline-none"
                                type="button"
                            >
                                <Trash size={26} />
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="flex overflow-hidden flex-row w-full rounded-xl border-2 divide-x-2 border-theme-accent divide-theme-accent">
                        <OutputDisplay label="Maximum Manual" value={`${maxAutobrakeLandingDist}m`} error={maxAutobrakeLandingDist > displayedRunwayLength} />
                        <OutputDisplay label="Medium" value={`${mediumAutobrakeLandingDist}m`} error={mediumAutobrakeLandingDist > displayedRunwayLength} />
                        <OutputDisplay label="Low" value={`${lowAutobrakeLandingDist}m`} error={lowAutobrakeLandingDist > displayedRunwayLength} />
                    </div>
                </div>
            </div>
            <RunwayVisualizationWidget mainLength={displayedRunwayLength} labels={runwayVisualizationLabels} runwayNumber={runwayNumber} />
        </div>
    );
};
