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

 // Data and calculations obtained from Quick Reference Handbook (In Flight Procedures, Landing Performance Assessment/Landing Distance)

import React from 'react';
import LandingCalculator, { LandingFlapsConfig, LandingRunwayConditions } from '../Calculators/LandingCalculator';
import RunwayVisualizationWidget, { DistanceLabel } from './RunwayVisualizationWidget';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import SelectInput from '../../Components/Form/SelectInput/SelectInput';
import OutputDisplay from '../../Components/Form/OutputDisplay/OutputDisplay';

type LandingWidgetProps = {};
type LandingWidgetState = {
	windDirection: number,
	windMagnitude: number,
	weight: number,
	runwayHeading: number,
	approachSpeed: number,
	flaps: LandingFlapsConfig,
	runwayCondition: LandingRunwayConditions,
	reverseThrust: boolean,
	altitude: number,
	temperature: number,
	slope: number,
	overweightProcedure: boolean,
	pressure: number,
	runwayLength: number,
	maxAutobrakeLandingDist: number,
	mediumAutobrakeLandingDist: number,
	lowAutobrakeLandingDist: number,
	runwayVisualizationLabels: DistanceLabel[],
	runwayNumber?: number,
	displayedRunwayLength: number
};

export default class LandingWidget extends React.Component<LandingWidgetProps, LandingWidgetState> {
	private calculator: LandingCalculator = new LandingCalculator();
	constructor(props: LandingWidget) {
		super(props);
		this.state = {
			windDirection: 0,
			windMagnitude: 0,
			weight: 0,
			runwayHeading: 0,
			approachSpeed: 0,
			flaps: LandingFlapsConfig.Full,
			runwayCondition: LandingRunwayConditions.Dry,
			reverseThrust: false,
			altitude: 0,
			slope: 0,
			temperature: 0,
			overweightProcedure: false,
			pressure: 1013.25,
			runwayLength: 0,
			maxAutobrakeLandingDist: 0,
			mediumAutobrakeLandingDist: 0,
			lowAutobrakeLandingDist: 0,
			runwayVisualizationLabels: [],
			displayedRunwayLength: 0
		};
	}

	private calculateLanding = (): void => {
		let landingDistances = this.calculator.calculateLandingDistances(
			this.state.weight,
			this.state.flaps,
			this.state.runwayCondition,
			this.state.approachSpeed,
			this.state.windDirection,
			this.state.windMagnitude,
			this.state.runwayHeading,
			this.state.reverseThrust,
			this.state.altitude,
			this.state.temperature,
			this.state.slope,
			this.state.overweightProcedure,
			this.state.pressure
		);

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.maxAutobrakeLandingDist = Math.round(landingDistances.maxAutobrakeDist);
			newState.mediumAutobrakeLandingDist = Math.round(landingDistances.mediumAutobrakeDist);
			newState.lowAutobrakeLandingDist = Math.round(landingDistances.lowAutobrakeDist);

			newState.runwayVisualizationLabels = [
				{
					label: 'MAX MANUAL',
					distance: landingDistances.maxAutobrakeDist
				},
				{
					label: 'MEDIUM',
					distance: landingDistances.mediumAutobrakeDist
				},
				{
					label: 'LOW',
					distance: landingDistances.lowAutobrakeDist
				}
			]

			newState.runwayNumber = Math.round(this.state.runwayHeading / 10);
			newState.displayedRunwayLength = this.state.runwayLength;

			return newState;
		});
	}

	private handleWindChange = (value: string): void => {
		let wind = value;
		let splitWind = wind.split('/');
		let direction = parseInt(splitWind[0]);
		let magnitude = parseInt(splitWind[1]);

		if (Number.isNaN(direction) || Number.isNaN(magnitude)) {
			direction = 0;
			magnitude = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.windDirection = direction;
			newState.windMagnitude = magnitude;
			return newState;
		});
	}

	private handleWeightChange = (value: string): void => {
		let weight = parseInt(value);

		if (!weight) {
			weight = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.weight = weight;
			return newState;
		});
	}

	private handleRunwayHeadingChange = (value: string): void => {
		let runwayHeading = parseInt(value);

		if (!runwayHeading) {
			runwayHeading = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.runwayHeading = runwayHeading;
			return newState;
		});
	}

	private handleApproachSpeedChange = (value: string): void => {
		let speed = parseInt(value);

		if (!speed) {
			speed = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.approachSpeed = speed;
			return newState;
		});
	}

	private handleAltitudeChange = (value: string): void => {
		let altitude = parseInt(value);

		if (!altitude) {
			altitude = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.altitude = altitude;
			return newState;
		});
	}

	private handleTemperatureChange = (value: string): void => {
		let temperature = parseFloat(value);

		if (!temperature) {
			temperature = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.temperature = temperature;
			return newState;
		});
	}

	private handleFlapsChange = (newValue: number | string): void => {
		let flaps: LandingFlapsConfig = parseInt(newValue.toString());

		if (flaps !== LandingFlapsConfig.Full && flaps !== LandingFlapsConfig.Conf3) {
			flaps = LandingFlapsConfig.Full;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.flaps = flaps;
			return newState;
		});
	}

	private handleRunwayConditionChange = (newValue: number | string): void => {
		let runwayCondition: LandingRunwayConditions = parseInt(newValue.toString());

		if (!runwayCondition) {
			runwayCondition = LandingRunwayConditions.Dry;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.runwayCondition = runwayCondition
			return newState;
		});
	}

	private handleReverseThrustChange = (newValue: number | string): void => {
		let reverseThrust: boolean = parseInt(newValue.toString()) == 1;

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.reverseThrust = reverseThrust;
			return newState;
		});
	}

	private handleRunwaySlopeChange = (value: string): void => {
		let slope = parseInt(value);

		if (!slope) {
			slope = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.slope = slope;
			return newState;
		});
	}

	private handleRunwayLengthChange = (value: string): void => {
		let runwayLength = parseInt(value);

		if (!runwayLength) {
			runwayLength = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.runwayLength = runwayLength;
			return newState;
		});
	}

	private handleOverweightProcedureChange = (newValue: number | string): void => {
		let overweightProcedure: boolean = parseInt(newValue.toString()) == 1;

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.overweightProcedure = overweightProcedure;
			return newState;
		});
	}

	private handlePressureChange = (value: string): void => {
		let pressure = parseFloat(value);

		if (!pressure) {
			pressure = 1013.25;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.pressure = pressure;
			return newState;
		});
	}

	public render() {
		return (
			<div className="flex flex-grow">
				<div className="w-1/2 mr-5 bg-gray-800 rounded-xl p-6 text-white shadow-lg flex items-center">
					<div className="w-full">
						<div className="text-center mb-6">
							<div className="flex">
								<div className="flex-1 m-2.5 column-left">
									<SimpleInput label="Wind (KTS)" placeholder="DIR/MAG" onChange={this.handleWindChange} />
									<SimpleInput label="Temperature" placeholder='°C' onChange={this.handleTemperatureChange} />
									<SimpleInput label="QNH" placeholder="mb" onChange={this.handlePressureChange} />
									<SimpleInput label="Rwy Altitude" placeholder='" ASL' onChange={this.handleAltitudeChange} />
									<SimpleInput label="Rwy Heading" onChange={this.handleRunwayHeadingChange} />
									<SelectInput label="Rwy Condition" defaultValue="0" onChange={this.handleRunwayConditionChange} dropdownOnTop options={[
										[0, "Dry"],
										[1, "Good"],
										[2, "Good-Medium"],
										[3, "Medium"],
										[4, "Medium-Poor"],
										[5, "Poor"]
									]} />
									<SimpleInput label="Rwy Slope" placeholder="%" onChange={this.handleRunwaySlopeChange} />
								</div>
								<div className="flex-1 m-2.5 column-right">
									<SimpleInput label="Rwy LDA" placeholder="m" onChange={this.handleRunwayLengthChange} reverse/>
									<SimpleInput label="Approach Speed" placeholder="KTS" onChange={this.handleApproachSpeedChange} reverse/>
									<SimpleInput label="Weight" placeholder="KG" onChange={this.handleWeightChange} reverse />
									<SelectInput label="Flaps" defaultValue="1" onChange={this.handleFlapsChange} reverse options={[
										[1, "Full"],
										[0, "CONF 3"]
									]} />
									<SelectInput label="Overweight Proc" defaultValue="0" onChange={this.handleOverweightProcedureChange} reverse options={[
										[0, "No"],
										[1, "Yes"]
									]} />
									<SelectInput label="Reverse Thrust" defaultValue="0" onChange={this.handleReverseThrustChange} reverse options={[
										[0, "No"],
										[1, "Yes"]
									]} />
								</div>
							</div>
							<button onClick={this.calculateLanding}
								className="my-3 w-full font-medium bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none">
								Calculate
							</button>
						</div>
						<div className="border-t border-white pt-3">
							<div className="flex flex-col items-center m-3">
								<div className="flex items-end">
									<OutputDisplay label="MAX MANUAL" value={this.state.maxAutobrakeLandingDist + "m"} error={this.state.maxAutobrakeLandingDist > this.state.displayedRunwayLength} />
									<OutputDisplay label="MEDIUM" value={this.state.mediumAutobrakeLandingDist + "m"} error={this.state.mediumAutobrakeLandingDist > this.state.displayedRunwayLength} />
									<OutputDisplay label="LOW" value={this.state.lowAutobrakeLandingDist + "m"} error={this.state.lowAutobrakeLandingDist > this.state.displayedRunwayLength} />
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="bg-gray-800 rounded-xl px-2 py-8 text-white shadow-lg flex items-center">
					<RunwayVisualizationWidget runwayLength={this.state.displayedRunwayLength} labels={this.state.runwayVisualizationLabels} runwayNumber={this.state.runwayNumber} />
				</div>
			</div>
			);
	}
}
