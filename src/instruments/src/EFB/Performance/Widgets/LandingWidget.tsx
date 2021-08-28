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

import React, { useContext } from 'react';
import { Metar } from '@flybywiresim/api-client';
import metarParser from 'aewx-metar-parser';
import LandingCalculator, { LandingFlapsConfig, LandingRunwayConditions } from '../Calculators/LandingCalculator';
import RunwayVisualizationWidget, { LabelType } from './RunwayVisualizationWidget';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import SelectInput from '../../Components/Form/SelectInput/SelectInput';
import OutputDisplay from '../../Components/Form/OutputDisplay/OutputDisplay';
import { useSimVar } from '../../../Common/simVars';
import { MetarParserType } from '../../../Common/metarTypes';
import { EPerformanceActions, PerformanceContext, performanceInitialState } from '../../Store/performance-context';
import { Units } from '@shared/units';

const poundsToKgs = 0.453592;

export const LandingWidget = () => {
    const calculator: LandingCalculator = new LandingCalculator();

    const { performanceState, performanceDispatch } = useContext(PerformanceContext);

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
    } = performanceState.landing;

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

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: {
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
            },
        });
    };

    const handleSyncValues = async (): Promise<void> => {
        if (!isValidIcao()) return;
        const metarResult = await Metar.get(icao);
        const parsedMetar: MetarParserType = metarParser(metarResult.metar);

        const weightKgs = Math.round(totalWeight * poundsToKgs);

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: {
                weight: weightKgs,
                windDirection: parsedMetar.wind.degrees,
                windMagnitude: parsedMetar.wind.speed_kts,
                temperature: parsedMetar.temperature.celsius,
                pressure: parsedMetar.barometer.mb,
            },
        });
    };

    const isValidIcao = (): boolean => icao.length === 4;

    const handleICAOChange = (icao: string): void => {
        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { icao },

        });
    };

    const handleWindDirectionChange = (value: string): void => {
        let windDirection: number | undefined = parseInt(value);

        if (Number.isNaN(windDirection)) {
            windDirection = undefined;
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { windDirection },
        });
    };

    const handleWindMagnitudeChange = (value: string): void => {
        let magnitude: number | undefined = parseInt(value);

        if (Number.isNaN(magnitude)) {
            magnitude = undefined;
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { magnitude },
        });
    };

    const handleWeightChange = (value: string): void => {
        let weight: number | undefined = parseInt(value);

        if (Number.isNaN(weight)) {
            weight = undefined;
        } else {
            weight = Units.userToKilogram(weight);
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { weight },
        });
    };

    const handleRunwayHeadingChange = (value: string): void => {
        let runwayHeading: number | undefined = parseInt(value);

        if (Number.isNaN(runwayHeading)) {
            runwayHeading = undefined;
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { runwayHeading },
        });
    };

    const handleApproachSpeedChange = (value: string): void => {
        let approachSpeed: number | undefined = parseInt(value);

        if (Number.isNaN(approachSpeed)) {
            approachSpeed = undefined;
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { approachSpeed },
        });
    };

    const handleAltitudeChange = (value: string): void => {
        let altitude: number | undefined = parseInt(value);

        if (Number.isNaN(altitude)) {
            altitude = undefined;
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { altitude },
        });
    };

    const handleTemperatureChange = (value: string): void => {
        let temperature: number | undefined = parseFloat(value);

        if (Number.isNaN(temperature)) {
            temperature = undefined;
        } else {
            temperature = Units.userToCelsius(temperature);
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { temperature },
        });
    };

    const handleFlapsChange = (newValue: number | string): void => {
        let flaps: LandingFlapsConfig = parseInt(newValue.toString());

        if (flaps !== LandingFlapsConfig.Full && flaps !== LandingFlapsConfig.Conf3) {
            flaps = LandingFlapsConfig.Full;
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { flaps },
        });
    };

    const handleRunwayConditionChange = (newValue: number | string): void => {
        let runwayCondition: LandingRunwayConditions = parseInt(newValue.toString());

        if (!runwayCondition) {
            runwayCondition = LandingRunwayConditions.Dry;
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { runwayCondition },
        });
    };

    const handleReverseThrustChange = (newValue: boolean): void => {
        const reverseThrust: boolean = newValue;

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { reverseThrust },
        });
    };

    const handleRunwaySlopeChange = (value: string): void => {
        let slope: number | undefined = parseInt(value);

        if (Number.isNaN(slope)) {
            slope = undefined;
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { slope },
        });
    };

    const handleRunwayLengthChange = (value: string): void => {
        let runwayLength: number | undefined = parseInt(value);

        if (Number.isNaN(runwayLength)) {
            runwayLength = undefined;
        } else {
            runwayLength = Units.userToMetre(runwayLength);
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { runwayLength },
        });
    };

    const handleOverweightProcedureChange = (newValue: boolean): void => {
        const overweightProcedure: boolean = newValue;

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { overweightProcedure },
        });
    };

    const handlePressureChange = (value: string): void => {
        let pressure: number | undefined = parseFloat(value);

        if (Number.isNaN(pressure)) {
            pressure = undefined;
        } else {
            pressure = Units.userToHectopascal(pressure);
        }

        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { pressure },
        });
    };

    const handleClearInputs = (): void => {
        performanceDispatch({
            type: EPerformanceActions.SET_LANDING,
            payload: { ...performanceInitialState },
        });
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

    const calculateButtonClass = `mx-2 w-2/4 text-white bg-green-500 p-2 flex items-center justify-center rounded-lg focus:outline-none text-lg ${areInputsValid() ? '' : 'opacity-50'}`;

    return (
        <div className="flex flex-grow">
            <div className="text-white overflow-hidden bg-navy-lighter rounded-2xl shadow-lg p-6 h-efb-nav mr-3 w-9/12">
                <div className="w-full">
                    <div className="text-center mb-4">
                        <div className="flex mx-2 flex-1 justify-center">
                            <SimpleInput className="uppercase" label="Airport ICAO" value={icao} onChange={handleICAOChange} maxLength={4} />

                        </div>
                        <div className="flex">
                            <div className="flex-1 m-2.5 column-left">
                                <SimpleInput
                                    className="w-56 my-1.5"
                                    label="Wind Direction"
                                    value={windDirection}
                                    min={0}
                                    max={360}
                                    padding={3}
                                    decimalPrecision={0}
                                    onChange={handleWindDirectionChange}
                                    number
                                />
                                <SimpleInput
                                    className="w-56 my-1.5"
                                    label="Wind Magnitude"
                                    value={windMagnitude}
                                    placeholder="KTS"
                                    min={0}
                                    decimalPrecision={1}
                                    onChange={handleWindMagnitudeChange}
                                    number
                                />
                                <SimpleInput
                                    className="w-56 my-1.5"
                                    label="Temperature"
                                    value={Units.celsiusToUser(temperature)}
                                    placeholder={Units.userTemperatureUnit}
                                    min={-50}
                                    max={55}
                                    decimalPrecision={1}
                                    onChange={handleTemperatureChange}
                                    number
                                />
                                <SimpleInput
                                    className="w-56 my-1.5"
                                    label="QNH"
                                    value={Units.hectopascalToUserString(pressure)}
                                    placeholder={Units.userPressureUnit}
                                    min={Units.metricUnits ? 745 : 22.00}
                                    max={Units.metricUnits ? 1100 : 32.48}
                                    decimalPrecision={Units.metricUnits ? 0 : 2}
                                    onChange={handlePressureChange}
                                    number
                                />
                                <SimpleInput
                                    className="w-56 my-1.5"
                                    label="Rwy Altitude"
                                    value={altitude}
                                    placeholder='ft MSL'
                                    min={-2000}
                                    max={20000}
                                    decimalPrecision={0}
                                    onChange={handleAltitudeChange}
                                    number
                                />
                                <SimpleInput
                                    className="w-56 my-1.5"
                                    label="Rwy Heading"
                                    value={runwayHeading}
                                    min={0}
                                    max={360}
                                    padding={3}
                                    decimalPrecision={0}
                                    onChange={handleRunwayHeadingChange}
                                    number
                                />
                                <SelectInput
                                    className="w-56 my-1.5"
                                    label="Rwy Condition"
                                    defaultValue={runwayCondition}
                                    onChange={handleRunwayConditionChange}
                                    dropdownOnTop
                                    options={[
                                        { value: 0, displayValue: 'Dry' },
                                        { value: 1, displayValue: 'Good' },
                                        { value: 2, displayValue: 'Good-Medium' },
                                        { value: 3, displayValue: 'Medium' },
                                        { value: 4, displayValue: 'Medium-Poor' },
                                        { value: 5, displayValue: 'Poor' },
                                    ]}
                                />
                            </div>
                            <div className="flex-1 m-2.5 column-right">
                                <SimpleInput
                                    className="w-56 my-1.5"
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
                                    className="w-56 my-1.5"
                                    label="Rwy LDA"
                                    value={Units.kilogramToUser(runwayLength)}
                                    placeholder={Units.userLengthUnit}
                                    min={0}
                                    max={Units.metricUnits ? 6000 : 20000}
                                    decimalPrecision={0}
                                    onChange={handleRunwayLengthChange}
                                    number
                                    reverse
                                />
                                <SimpleInput
                                    className="w-56 my-1.5"
                                    label="Approach Speed"
                                    value={approachSpeed}
                                    placeholder="KTS"
                                    min={90}
                                    max={350}
                                    decimalPrecision={0}
                                    onChange={handleApproachSpeedChange}
                                    number
                                    reverse
                                />
                                <SimpleInput
                                    className="w-56 my-1.5"
                                    label="Weight"
                                    value={Units.kilogramToUser(weight)}
                                    placeholder={Units.userWeightUnit}
                                    min={Units.metricUnits ? 41000 : 90400}
                                    max={Units.metricUnits ? 100000 : 220000}
                                    decimalPrecision={0}
                                    onChange={handleWeightChange}
                                    number
                                    reverse
                                />
                                <SelectInput
                                    className="w-56 my-1.5"
                                    label="Flaps"
                                    defaultValue={flaps}
                                    onChange={handleFlapsChange}
                                    reverse
                                    options={[
                                        { value: 1, displayValue: 'Full' },
                                        { value: 0, displayValue: 'CONF 3' },
                                    ]}
                                />
                                <SelectInput
                                    className="w-56 my-1.5"
                                    label="Overweight Proc"
                                    defaultValue={overweightProcedure}
                                    onChange={handleOverweightProcedureChange}
                                    reverse
                                    options={[
                                        { value: false, displayValue: 'No' },
                                        { value: true, displayValue: 'Yes' },
                                    ]}
                                />
                                <SelectInput
                                    className="w-56 my-1.5"
                                    label="Reverse Thrust"
                                    defaultValue={reverseThrust}
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
                            >
                                Calculate
                            </button>
                            <button
                                onClick={handleSyncValues}
                                className={`mx-2 w-1/4 text-white bg-teal-light p-2 flex items-center justify-center rounded-lg
                                focus:outline-none text-lg ${isValidIcao() ? '' : 'opacity-50'}`}
                                type="button"
                                disabled={!isValidIcao()}
                            >
                                Get METAR
                            </button>
                            <button
                                onClick={handleClearInputs}
                                className="mx-2 w-1/4 text-lg font-medium bg-blue-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none"
                                type="button"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="border-t border-white pt-3">
                        <div className="flex flex-col items-center m-3">
                            <div className="flex items-end">
                                <OutputDisplay label="MAX MANUAL" value={`${Math.round(Units.metreToUser(maxAutobrakeLandingDist))}\xa0${Units.userLengthUnit}`} error={maxAutobrakeLandingDist > displayedRunwayLength} />
                                <OutputDisplay label="MEDIUM" value={`${Math.round(Units.metreToUser(mediumAutobrakeLandingDist))}\xa0${Units.userLengthUnit}`} error={mediumAutobrakeLandingDist > displayedRunwayLength} />
                                <OutputDisplay label="LOW" value={`${Math.round(Units.metreToUser(lowAutobrakeLandingDist))}\xa0${Units.userLengthUnit}`} error={lowAutobrakeLandingDist > displayedRunwayLength} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-white overflow-hidden bg-navy-lighter rounded-2xl shadow-lg p-6 h-efb-nav ml-3 w-3/12">
                <RunwayVisualizationWidget mainLength={displayedRunwayLength} labels={runwayVisualizationLabels} runwayNumber={runwayNumber} />
            </div>
        </div>
    );
};

export default LandingWidget;
