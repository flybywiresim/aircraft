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

import React from 'react';
import { Metar } from '@flybywiresim/api-client';
import metarParser from 'aewx-metar-parser';
import LandingCalculator, { LandingFlapsConfig, LandingRunwayConditions } from '../Calculators/LandingCalculator';
import RunwayVisualizationWidget, { LabelType } from './RunwayVisualizationWidget';
import { SimpleInput } from '../../Components/Form/SimpleInput/SimpleInput';
import SelectInput from '../../Components/Form/SelectInput/SelectInput';
import OutputDisplay from '../../Components/Form/OutputDisplay/OutputDisplay';
import { useSimVar } from '../../../Common/simVars';
import { MetarParserType } from '../../../Common/metarTypes';
import { useAppDispatch, useAppSelector } from '../../Store/store';
import { clearLandingValues, initialState, setLandingValues } from '../../Store/features/performance';

const poundsToKgs = 0.453592;

export const LandingWidget = () => {
    const dispatch = useAppDispatch();

    const calculator: LandingCalculator = new LandingCalculator();

    const [totalWeight] = useSimVar('TOTAL WEIGHT', 'Pounds', 1000);

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

    const handleSyncValues = async (): Promise<void> => {
        if (!isValidIcao()) return;
        const metarResult = await Metar.get(icao);
        const parsedMetar: MetarParserType = metarParser(metarResult.metar);

        const weightKgs = Math.round(totalWeight * poundsToKgs);

        dispatch(setLandingValues({
            weight: weightKgs,
            windDirection: parsedMetar.wind.degrees,
            windMagnitude: parsedMetar.wind.speed_kts,
            temperature: parsedMetar.temperature.celsius,
            pressure: parsedMetar.barometer.mb,
        }));
    };

    const isValidIcao = (): boolean => icao.length === 4;

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

    const calculateButtonClass = `mx-2 w-2/4  bg-green-500 p-2 flex items-center justify-center rounded-lg focus:outline-none text-lg ${areInputsValid() ? '' : 'opacity-50'}`;

    return (
        <div className="flex flex-grow">
            <div className="overflow-hidden p-6 mr-3 w-9/12 text-white rounded-2xl bg-navy-lighter h-efb-nav">
                <div className="w-full">
                    <div className="mb-4 text-center">
                        <div className="flex flex-1 justify-center mx-2">
                            <SimpleInput className="uppercase" label="Airport ICAO" value={icao} onChange={handleICAOChange} maxLength={4} />

                        </div>
                        <div className="flex">
                            <div className="flex-1 m-2.5 column-left">
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="Wind Direction"
                                    value={windDirection}
                                    placeholder="°"
                                    min={0}
                                    max={360}
                                    padding={3}
                                    decimalPrecision={0}
                                    onChange={handleWindDirectionChange}
                                    number
                                />
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="Wind Magnitude"
                                    value={windMagnitude}
                                    placeholder="kts"
                                    min={0}
                                    decimalPrecision={1}
                                    onChange={handleWindMagnitudeChange}
                                    number
                                />
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="Temperature"
                                    value={temperature}
                                    placeholder="°C"
                                    min={-50}
                                    max={55}
                                    decimalPrecision={1}
                                    onChange={handleTemperatureChange}
                                    number
                                />
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="QNH"
                                    value={pressure}
                                    placeholder="hPa"
                                    min={800}
                                    max={1200}
                                    decimalPrecision={2}
                                    onChange={handlePressureChange}
                                    number
                                />
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="Rwy Altitude"
                                    value={altitude}
                                    placeholder="ft ASL"
                                    min={-2000}
                                    max={20000}
                                    decimalPrecision={0}
                                    onChange={handleAltitudeChange}
                                    number
                                />
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="Rwy Heading"
                                    value={runwayHeading}
                                    placeholder="°"
                                    min={0}
                                    max={360}
                                    padding={3}
                                    decimalPrecision={0}
                                    onChange={handleRunwayHeadingChange}
                                    number
                                />
                                <SelectInput
                                    className="my-1.5 w-56"
                                    label="Rwy Condition"
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
                            </div>
                            <div className="flex-1 m-2.5 column-right">
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="Rwy Slope"
                                    value={slope}
                                    placeholder="%"
                                    min={-2}
                                    max={2}
                                    decimalPrecision={1}
                                    onChange={handleRunwaySlopeChange}
                                    number
                                    reverse
                                />
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="Rwy LDA"
                                    value={runwayLength}
                                    placeholder="m"
                                    min={0}
                                    max={6000}
                                    decimalPrecision={0}
                                    onChange={handleRunwayLengthChange}
                                    number
                                    reverse
                                />
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="Approach Speed"
                                    value={approachSpeed}
                                    placeholder="kts"
                                    min={90}
                                    max={350}
                                    decimalPrecision={0}
                                    onChange={handleApproachSpeedChange}
                                    number
                                    reverse
                                />
                                <SimpleInput
                                    className="my-1.5 w-56"
                                    label="Weight"
                                    value={weight}
                                    placeholder="kg"
                                    min={41000}
                                    max={100000}
                                    decimalPrecision={0}
                                    onChange={handleWeightChange}
                                    number
                                    reverse
                                />
                                <SelectInput
                                    className="my-1.5 w-56"
                                    label="Flaps"
                                    defaultValue={initialState.landing.flaps}
                                    value={flaps}
                                    onChange={handleFlapsChange}
                                    reverse
                                    options={[
                                        { value: 1, displayValue: 'FULL' },
                                        { value: 0, displayValue: 'CONF 3' },
                                    ]}
                                />
                                <SelectInput
                                    className="my-1.5 w-56"
                                    label="Overweight Proc"
                                    defaultValue={initialState.landing.overweightProcedure}
                                    value={overweightProcedure}
                                    onChange={handleOverweightProcedureChange}
                                    reverse
                                    options={[
                                        { value: false, displayValue: 'No' },
                                        { value: true, displayValue: 'Yes' },
                                    ]}
                                />
                                <SelectInput
                                    className="my-1.5 w-56"
                                    label="Reverse Thrust"
                                    defaultValue={initialState.landing.reverseThrust}
                                    value={reverseThrust}
                                    onChange={handleReverseThrustChange}
                                    reverse
                                    options={[
                                        { value: false, displayValue: 'No' },
                                        { value: true, displayValue: 'Yes' },
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="flex">
                            <button
                                onClick={handleCalculateLanding}
                                className={calculateButtonClass}
                                type="button"
                                disabled={!areInputsValid()}
                            >
                                Calculate
                            </button>
                            <button
                                onClick={handleSyncValues}
                                className={`mx-2 w-1/4  bg-teal-light p-2 flex items-center justify-center rounded-lg
                                focus:outline-none text-lg ${isValidIcao() ? '' : 'opacity-50'}`}
                                type="button"
                                disabled={!isValidIcao()}
                            >
                                Get METAR
                            </button>
                            <button
                                onClick={handleClearInputs}
                                className="flex justify-center items-center p-2 mx-2 w-1/4 text-lg font-medium bg-blue-500 rounded-lg focus:outline-none"
                                type="button"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="pt-3 border-t border-white">
                        <div className="flex flex-col items-center m-3">
                            <div className="flex items-end">
                                <OutputDisplay label="MAX MANUAL" value={`${maxAutobrakeLandingDist}m`} error={maxAutobrakeLandingDist > displayedRunwayLength} />
                                <OutputDisplay label="MEDIUM" value={`${mediumAutobrakeLandingDist}m`} error={mediumAutobrakeLandingDist > displayedRunwayLength} />
                                <OutputDisplay label="LOW" value={`${lowAutobrakeLandingDist}m`} error={lowAutobrakeLandingDist > displayedRunwayLength} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="overflow-hidden p-6 ml-3 w-3/12 text-white rounded-2xl bg-navy-lighter h-efb-nav">
                <RunwayVisualizationWidget mainLength={displayedRunwayLength} labels={runwayVisualizationLabels} runwayNumber={runwayNumber} />
            </div>
        </div>
    );
};

export default LandingWidget;
