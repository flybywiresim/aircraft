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
import PerformanceInput from '../Components/PerformanceInput';
import PerformanceSelectInput from '../Components/PerformanceSelectInput';
import PerformanceOutputDisplay from '../Components/PerformanceOutputDisplay';

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
			this.state.overweightProcedure
		);

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.maxAutobrakeLandingDist = Math.round(landingDistances.maxAutobrakeDist);
			newState.mediumAutobrakeLandingDist = Math.round(landingDistances.mediumAutobrakeDist);
			newState.lowAutobrakeLandingDist = Math.round(landingDistances.lowAutobrakeDist);

			newState.runwayVisualizationLabels = [
				{
					label: 'MAX',
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

	private handleWindChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let wind = event.currentTarget.value;
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

	private handleWeightChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let weight = parseInt(event.currentTarget.value);

		if (!weight) {
			weight = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.weight = weight;
			return newState;
		});
	}

	private handleRunwayHeadingChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let runwayHeading = parseInt(event.currentTarget.value);

		if (!runwayHeading) {
			runwayHeading = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.runwayHeading = runwayHeading;
			return newState;
		});
	}

	private handleApproachSpeedChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let speed = parseInt(event.currentTarget.value);

		if (!speed) {
			speed = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.approachSpeed = speed;
			return newState;
		});
	}

	private handleAltitudeChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let altitude = parseInt(event.currentTarget.value);

		if (!altitude) {
			altitude = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.altitude = altitude;
			return newState;
		});
	}

	private handleTemperatureChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let temperature = parseFloat(event.currentTarget.value);

		if (!temperature) {
			temperature = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.temperature = temperature;
			return newState;
		});
	}

	private handleFlapsChange = (event: React.FormEvent<HTMLSelectElement>): void => {
		let flaps: LandingFlapsConfig = parseInt(event.currentTarget.value);

		if (flaps !== LandingFlapsConfig.Full && flaps !== LandingFlapsConfig.Conf3) {
			flaps = LandingFlapsConfig.Full;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.flaps = flaps;
			return newState;
		});
	}

	private handleRunwayConditionChange = (event: React.FormEvent<HTMLSelectElement>): void => {
		let runwayCondition: LandingRunwayConditions = parseInt(event.currentTarget.value);

		if (!runwayCondition) {
			runwayCondition = LandingRunwayConditions.Dry;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.runwayCondition = runwayCondition
			return newState;
		});
	}

	private handleReverseThrustChange = (event: React.FormEvent<HTMLSelectElement>): void => {
		let reverseThrust: boolean = parseInt(event.currentTarget.value) == 1;

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.reverseThrust = reverseThrust;
			return newState;
		});
	}

	private handleRunwaySlopeChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let slope = parseInt(event.currentTarget.value);

		if (!slope) {
			slope = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.slope = slope;
			return newState;
		});
	}

	private handleRunwayLengthChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let runwayLength = parseInt(event.currentTarget.value);

		if (!runwayLength) {
			runwayLength = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.runwayLength = runwayLength;
			return newState;
		});
	}

	private handleOverweightProcedureChange = (event: React.FormEvent<HTMLSelectElement>): void => {
		let overweightProcedure: boolean = parseInt(event.currentTarget.value) == 1;

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.overweightProcedure = overweightProcedure;
			return newState;
		});
	}

	public render() {
		return (
			<div className="flex flex-grow">
				<div className="w-5/12 mr-5 bg-gray-800 rounded-xl p-6 text-white shadow-lg flex items-center">
					<div className="w-full">
						<div className="text-center mb-6">
							<div className="flex">
								<div className="flex-1 m-2.5 column-left">
									<PerformanceInput label="Wind (KTS)" placeholder="DIR/MAG" onChange={this.handleWindChange} />
									<PerformanceInput label="Weight" placeholder="KG" onChange={this.handleWeightChange} />
									<PerformanceInput label="Rwy Heading" onChange={this.handleRunwayHeadingChange} />
									<PerformanceInput label="Approach Speed" placeholder="KTS" onChange={this.handleApproachSpeedChange} />
									<PerformanceInput label="Rwy Altitude" placeholder='" ASL' onChange={this.handleAltitudeChange} />
									<PerformanceInput label="Temperature" placeholder='°C' onChange={this.handleTemperatureChange} />
								</div>
								<div className="flex-1 m-2.5 column-right">
									<PerformanceSelectInput label="Flaps" defaultValue="1" onChange={this.handleFlapsChange} reverse>
										<option value="1">Full</option>
										<option value="0">CONF 3</option>
									</PerformanceSelectInput>
									<PerformanceSelectInput label="Rwy Condition" defaultValue="0" onChange={this.handleRunwayConditionChange} reverse>
										<option value="0">Dry</option>
										<option value="1">Good</option>
										<option value="2">Medium</option>
										<option value="3">Poor</option>
									</PerformanceSelectInput>
									<PerformanceSelectInput label="Reverse Thrust" defaultValue="0" onChange={this.handleReverseThrustChange} reverse>
										<option value="0">No</option>
										<option value="1">Yes</option>
									</PerformanceSelectInput>
									<PerformanceInput label="Rwy Slope" placeholder="%" onChange={this.handleRunwaySlopeChange} reverse />
									<PerformanceSelectInput label="Overweight Proc" defaultValue="0" onChange={this.handleOverweightProcedureChange} reverse>
										<option value="0">No</option>
										<option value="1">Yes</option>
									</PerformanceSelectInput>
									<PerformanceInput label="Rwy Length" placeholder="m" onChange={this.handleRunwayLengthChange} reverse/>
								</div>
							</div>
							<button onClick={this.calculateLanding}
								className="my-3 w-full font-medium bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none">
								Calculate
							</button>
						</div>
						<div className="border-t border-white pt-3">
							<div className="flex flex-col items-center m-3">
								<div className="flex">
									<PerformanceOutputDisplay label="MAX" value={this.state.maxAutobrakeLandingDist + "m"} error={this.state.maxAutobrakeLandingDist > this.state.displayedRunwayLength} />
									<PerformanceOutputDisplay label="MEDIUM" value={this.state.mediumAutobrakeLandingDist + "m"} error={this.state.mediumAutobrakeLandingDist > this.state.displayedRunwayLength} />
									<PerformanceOutputDisplay label="LOW" value={this.state.lowAutobrakeLandingDist + "m"} error={this.state.lowAutobrakeLandingDist > this.state.displayedRunwayLength} />
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
