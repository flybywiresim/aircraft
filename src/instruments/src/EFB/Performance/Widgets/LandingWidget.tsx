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

import React, { useState } from 'react';
import { Metar } from '@flybywiresim/api-client';
import metarParser from 'aewx-metar-parser';
import LandingCalculator, { LandingFlapsConfig, LandingRunwayConditions } from '../Calculators/LandingCalculator';
import RunwayVisualizationWidget, { DistanceLabel, LabelType } from './RunwayVisualizationWidget';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import SelectInput from '../../Components/Form/SelectInput/SelectInput';
import OutputDisplay from '../../Components/Form/OutputDisplay/OutputDisplay';
import Help from '../../Components/Help';
import Card from '../../Components/Card/Card';
import { useSimVar } from '../../../Common/simVars';
import { MetarParserType } from '../../../Common/metarTypes';

const poundsToKgs = 0.453592;

export const LandingWidget = () => {
    const calculator: LandingCalculator = new LandingCalculator();

    const [totalWeight] = useSimVar('TOTAL WEIGHT', 'Pounds', 1000);

    const [icao, setIcao] = useState<string>('');
    const [windDirection, setWindDirection] = useState<number>();
    const [windMagnitude, setWindMagnitude] = useState<number>();
    const [weight, setWeight] = useState<number>();
    const [runwayHeading, setRunwayHeading] = useState<number>();
    const [approachSpeed, setApproachSpeed] = useState<number>();
    const [flaps, setFlaps] = useState(LandingFlapsConfig.Full);
    const [runwayCondition, setRunwayCondition] = useState(LandingRunwayConditions.Dry);
    const [reverseThrust, setReverseThrust] = useState(false);
    const [altitude, setAltitude] = useState<number>();
    const [slope, setSlope] = useState<number>();
    const [temperature, setTemperature] = useState<number>();
    const [overweightProcedure, setOverweightProcedure] = useState(false);
    const [pressure, setPressure] = useState<number>();
    const [runwayLength, setRunwayLength] = useState<number>();
    const [maxAutobrakeLandingDist, setMaxAutobrakeLandingDist] = useState<number>(0);
    const [mediumAutobrakeLandingDist, setMediumAutobrakeLandingDist] = useState<number>(0);
    const [lowAutobrakeLandingDist, setLowAutobrakeLandingDist] = useState<number>(0);
    const [runwayVisualizationLabels, setRunwayVisualizationLabels] = useState<DistanceLabel[]>([]);
    const [runwayNumber, setRunwayNumber] = useState<number>();
    const [displayedRunwayLength, setDisplayedRunwayLength] = useState<number>(0);

    const calculateLanding = (): void => {
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

        setMaxAutobrakeLandingDist(Math.round(landingDistances.maxAutobrakeDist));
        setMediumAutobrakeLandingDist(Math.round(landingDistances.mediumAutobrakeDist));
        setLowAutobrakeLandingDist(Math.round(landingDistances.lowAutobrakeDist));

        setRunwayVisualizationLabels([
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
        ]);

        setRunwayNumber(Math.round((runwayHeading ?? 0) / 10));
        setDisplayedRunwayLength(runwayLength ?? 0);
    };

    const syncValues = async (): Promise<void> => {
        if (!isValidIcao()) return;
        const metarResult = await Metar.get(icao);
        const parsedMetar: MetarParserType = metarParser(metarResult.metar);

        const weightKgs = Math.round(totalWeight * poundsToKgs);

        setWeight(weightKgs);
        setWindDirection(parsedMetar.wind.degrees);
        setWindMagnitude(parsedMetar.wind.speed_kts);
        setTemperature(parsedMetar.temperature.celsius);
        setPressure(parsedMetar.barometer.mb);
    };

    const isValidIcao = (): boolean => icao.length === 4;

    const handleWindDirectionChange = (value: string): void => {
        let direction: number | undefined = parseInt(value);

        if (Number.isNaN(direction)) {
            direction = undefined;
        }

        setWindDirection(direction);
    };

    const handleWindMagnitudeChange = (value: string): void => {
        let magnitude: number | undefined = parseInt(value);

        if (Number.isNaN(magnitude)) {
            magnitude = undefined;
        }

        setWindMagnitude(magnitude);
    };

    const handleWeightChange = (value: string): void => {
        let weight: number | undefined = parseInt(value);

        if (Number.isNaN(weight)) {
            weight = undefined;
        }

        setWeight(weight);
    };

    const handleRunwayHeadingChange = (value: string): void => {
        let runwayHeading: number | undefined = parseInt(value);

        if (Number.isNaN(runwayHeading)) {
            runwayHeading = undefined;
        }

        setRunwayHeading(runwayHeading);
    };

    const handleApproachSpeedChange = (value: string): void => {
        let speed: number | undefined = parseInt(value);

        if (Number.isNaN(speed)) {
            speed = undefined;
        }

        setApproachSpeed(speed);
    };

    const handleAltitudeChange = (value: string): void => {
        let altitude: number | undefined = parseInt(value);

        if (Number.isNaN(altitude)) {
            altitude = undefined;
        }

        setAltitude(altitude);
    };

    const handleTemperatureChange = (value: string): void => {
        let temperature: number | undefined = parseFloat(value);

        if (Number.isNaN(temperature)) {
            temperature = undefined;
        }

        setTemperature(temperature);
    };

    const handleFlapsChange = (newValue: number | string): void => {
        let flaps: LandingFlapsConfig = parseInt(newValue.toString());

        if (flaps !== LandingFlapsConfig.Full && flaps !== LandingFlapsConfig.Conf3) {
            flaps = LandingFlapsConfig.Full;
        }

        setFlaps(flaps);
    };

    const handleRunwayConditionChange = (newValue: number | string): void => {
        let runwayCondition: LandingRunwayConditions = parseInt(newValue.toString());

        if (!runwayCondition) {
            runwayCondition = LandingRunwayConditions.Dry;
        }

        setRunwayCondition(runwayCondition);
    };

    const handleReverseThrustChange = (newValue: number | string): void => {
        const reverseThrust: boolean = parseInt(newValue.toString()) === 1;

        setReverseThrust(reverseThrust);
    };

    const handleRunwaySlopeChange = (value: string): void => {
        let slope: number | undefined = parseInt(value);

        if (Number.isNaN(slope)) {
            slope = undefined;
        }

        setSlope(slope);
    };

    const handleRunwayLengthChange = (value: string): void => {
        let runwayLength: number | undefined = parseInt(value);

        if (Number.isNaN(runwayLength)) {
            runwayLength = undefined;
        }

        setRunwayLength(runwayLength);
    };

    const handleOverweightProcedureChange = (newValue: number | string): void => {
        const overweightProcedure: boolean = parseInt(newValue.toString()) === 1;

        setOverweightProcedure(overweightProcedure);
    };

    const handlePressureChange = (value: string): void => {
        let pressure: number | undefined = parseFloat(value);

        if (Number.isNaN(pressure)) {
            pressure = undefined;
        }

        setPressure(pressure);
    };

    const clearInputs = (): void => {
        setIcao('');
        setWindDirection(undefined);
        setWindMagnitude(undefined);
        setWeight(undefined);
        setRunwayHeading(undefined);
        setApproachSpeed(undefined);
        setAltitude(undefined);
        setSlope(undefined);
        setTemperature(undefined);
        setPressure(undefined);
        setRunwayLength(undefined);
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

    const calculateButtonClass = `my-3 mx-2 w-1/2 font-medium bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none ${areInputsValid() ? '' : 'disabled'}`;

    return (
        <div className="flex flex-grow">
            <Card className="w-1/2 mr-4">
                <div className="w-full">
                    <div className="text-center mb-4">
                        <div className="flex mx-2 flex-1 justify-center">
                            <SimpleInput label="Airport ICAO" value={icao} onChange={(value) => setIcao(value)} />
                            <button
                                onClick={syncValues}
                                className={`mx-2 font-medium p-2 bg-blue-500 text-white flex items-center justify-center rounded-lg focus:outline-none ${isValidIcao() ? '' : 'disabled'}`}
                                type="button"
                                disabled={!isValidIcao()}
                            >
                                Auto-fill
                            </button>
                        </div>
                        <div className="flex">
                            <div className="flex-1 m-2.5 column-left">
                                <SimpleInput
                                    label="Wind Direction"
                                    value={windDirection}
                                    min={0}
                                    max={360}
                                    padding={3}
                                    decimalPrecision={0}
                                    onChange={handleWindDirectionChange}
                                    className="py-2"
                                    number
                                />
                                <SimpleInput
                                    label="Wind Magnitude"
                                    value={windMagnitude}
                                    placeholder="KTS"
                                    min={0}
                                    decimalPrecision={1}
                                    onChange={handleWindMagnitudeChange}
                                    className="py-2"
                                    number
                                />
                                <SimpleInput
                                    label="Temperature"
                                    value={temperature}
                                    placeholder="°C"
                                    min={-50}
                                    max={55}
                                    decimalPrecision={1}
                                    onChange={handleTemperatureChange}
                                    className="py-2"
                                    number
                                />
                                <SimpleInput
                                    label="QNH"
                                    value={pressure}
                                    placeholder="mb"
                                    min={800}
                                    max={1200}
                                    decimalPrecision={2}
                                    onChange={handlePressureChange}
                                    className="py-2"
                                    number
                                />
                                <SimpleInput
                                    label="Rwy Altitude"
                                    value={altitude}
                                    placeholder='" ASL'
                                    min={-2000}
                                    max={20000}
                                    decimalPrecision={0}
                                    onChange={handleAltitudeChange}
                                    className="py-2"
                                    number
                                />
                                <SimpleInput
                                    label="Rwy Heading"
                                    value={runwayHeading}
                                    min={0}
                                    max={360}
                                    padding={3}
                                    decimalPrecision={0}
                                    onChange={handleRunwayHeadingChange}
                                    className="py-2"
                                    number
                                />
                                <SelectInput
                                    label="Rwy Condition"
                                    defaultValue={0}
                                    onChange={handleRunwayConditionChange}
                                    dropdownOnTop
                                    className="py-2"
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
                                    label="Rwy Slope"
                                    value={slope}
                                    placeholder="%"
                                    min={-2}
                                    max={2}
                                    decimalPrecision={1}
                                    onChange={handleRunwaySlopeChange}
                                    className="py-2"
                                    number
                                    reverse
                                />
                                <div className="flex justify-start items-center">
                                    <SimpleInput
                                        label="Rwy LDA"
                                        value={runwayLength}
                                        placeholder="m"
                                        min={0}
                                        max={6000}
                                        decimalPrecision={0}
                                        onChange={handleRunwayLengthChange}
                                        className="py-2"
                                        number
                                        reverse
                                    />
                                    <Help title="Landing Distance Available (LDA)">
                                        The distance available on the runway which is suitable for the ground run of the landing.
                                    </Help>
                                </div>
                                <SimpleInput
                                    label="Approach Speed"
                                    value={approachSpeed}
                                    placeholder="KTS"
                                    min={90}
                                    max={350}
                                    decimalPrecision={0}
                                    onChange={handleApproachSpeedChange}
                                    className="py-2"
                                    number
                                    reverse
                                />
                                <SimpleInput
                                    label="Weight"
                                    value={weight}
                                    placeholder="KG"
                                    min={41000}
                                    max={100000}
                                    decimalPrecision={0}
                                    onChange={handleWeightChange}
                                    className="py-2"
                                    number
                                    reverse
                                />
                                <SelectInput
                                    label="Flaps"
                                    defaultValue={1}
                                    onChange={handleFlapsChange}
                                    reverse
                                    className="py-2"
                                    options={[
                                        { value: 1, displayValue: 'Full' },
                                        { value: 0, displayValue: 'CONF 3' },
                                    ]}
                                />
                                <SelectInput
                                    label="Overweight Proc"
                                    defaultValue={0}
                                    onChange={handleOverweightProcedureChange}
                                    reverse
                                    className="py-2"
                                    options={[
                                        { value: 0, displayValue: 'No' },
                                        { value: 1, displayValue: 'Yes' },
                                    ]}
                                />
                                <SelectInput
                                    label="Reverse Thrust"
                                    defaultValue={0}
                                    onChange={handleReverseThrustChange}
                                    reverse
                                    className="py-2"
                                    options={[
                                        { value: 0, displayValue: 'No' },
                                        { value: 1, displayValue: 'Yes' },
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="flex">
                            <button
                                onClick={calculateLanding}
                                className={calculateButtonClass}
                                type="button"
                            >
                                Calculate
                            </button>
                            <button
                                onClick={clearInputs}
                                className="my-3 mx-2 w-1/2 font-medium bg-blue-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none"
                                type="button"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="border-t border-white pt-3">
                        <div className="flex flex-col items-center m-3">
                            <div className="flex items-end">
                                <OutputDisplay label="MAX MANUAL" value={`${maxAutobrakeLandingDist}m`} error={maxAutobrakeLandingDist > displayedRunwayLength} />
                                <OutputDisplay label="MEDIUM" value={`${mediumAutobrakeLandingDist}m`} error={mediumAutobrakeLandingDist > displayedRunwayLength} />
                                <OutputDisplay label="LOW" value={`${lowAutobrakeLandingDist}m`} error={lowAutobrakeLandingDist > displayedRunwayLength} />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
            <Card childrenContainerClassName="h-full">
                <RunwayVisualizationWidget mainLength={displayedRunwayLength} labels={runwayVisualizationLabels} runwayNumber={runwayNumber} />
            </Card>
        </div>
    );
};

export default LandingWidget;
