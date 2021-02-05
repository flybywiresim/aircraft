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
import classNames from "classnames";
import LandingCalculator, { LandingFlapsConfig, LandingRunwayConditions } from '../Calculators/LandingCalculator';
import RunwayVisualizationWidget, { DistanceLabel } from './RunwayVisualizationWidget';

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
	runwayNumber?: number
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
			runwayVisualizationLabels: []
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
				<div className="w-5/12 mr-5 bg-gray-800 rounded-xl p-6 text-white shadow-lg flex items-center relative">
					<div className="text-white text-2xl absolute -top-2 right-3 transform -translate-y-full">Data input</div>
					<div className="w-full">
						<div className="inputs text-center mb-6">
							<div className="flex">
								<div className="column column-left">
									<div className="input-field">
										<div className="input-label">Wind (KTS)</div>
										<div className="input-container">
											<input placeholder="DIR/MAG" onChange={this.handleWindChange} />
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Weight</div>
										<div className="input-container">
											<input placeholder="KG" onChange={this.handleWeightChange} />
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Rwy Heading</div>
										<div className="input-container">
											<input onChange={this.handleRunwayHeadingChange} />
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Approach Speed</div>
										<div className="input-container">
											<input placeholder="KTS" onChange={this.handleApproachSpeedChange} />
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Rwy Altitude</div>
										<div className="input-container">
											<input placeholder='" ASL' onChange={this.handleAltitudeChange} />
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Temperature</div>
										<div className="input-container">
											<input placeholder='°C' onChange={this.handleTemperatureChange} />
										</div>
									</div>
								</div>
								<div className="column column-right">
									<div className="input-field">
										<div className="input-label">Flaps</div>
										<div className="input-container">
											<select defaultValue="1" onChange={this.handleFlapsChange}>
												<option value="1">Full</option>
												<option value="0">CONF 3</option>
											</select>
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Rwy Condition</div>
										<div className="input-container">
											<select defaultValue="0" onChange={this.handleRunwayConditionChange}>
												<option value="0">Dry</option>
												<option value="1">Good</option>
												<option value="2">Medium</option>
												<option value="3">Poor</option>
											</select>
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Reverse Thrust</div>
										<div className="input-container">
											<select defaultValue="0" onChange={this.handleReverseThrustChange}>
												<option value="0">No</option>
												<option value="1">Yes</option>
											</select>
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Rwy Slope</div>
										<div className="input-container">
											<input placeholder='%' onChange={this.handleRunwaySlopeChange} />
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Overweight Proc</div>
										<div className="input-container">
											<select defaultValue="0" onChange={this.handleOverweightProcedureChange}>
												<option value="0">No</option>
												<option value="1">Yes</option>
											</select>
										</div>
									</div>
									<div className="input-field">
										<div className="input-label">Rwy Length</div>
										<div className="input-container">
											<input placeholder='m' onChange={this.handleRunwayLengthChange} />
										</div>
									</div>
								</div>
							</div>
							<button onClick={this.calculateLanding}
								className="calculate-button w-full font-medium bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none">
								Calculate
							</button>
						</div>
						<div className="results">
							<div className="section">
								<div className="values">
									<div className="output-field">
										<div className="output-label">MAX</div>
										<div className="output-container">
											<input
												className={classNames({
													disabled: true,
													error: this.state.maxAutobrakeLandingDist > this.state.runwayLength
												})}
												id="landing-distance-output"
												value={this.state.maxAutobrakeLandingDist + "m"}>
											</input>
										</div>
									</div>
									<div className="output-field">
										<div className="output-label">MEDIUM</div>
										<div className="output-container">
											<input
												className={classNames({
													disabled: true,
													error: this.state.mediumAutobrakeLandingDist > this.state.runwayLength
												})}
												id="landing-distance-output"
												value={this.state.mediumAutobrakeLandingDist + "m"}>
											</input>
										</div>
									</div>
									<div className="output-field">
										<div className="output-label">LOW</div>
										<div className="output-container">
											<input
												className={classNames({
													disabled: true,
													error: this.state.lowAutobrakeLandingDist > this.state.runwayLength
												})}
												id="landing-distance-output"
												value={this.state.lowAutobrakeLandingDist + "m"}>
											</input>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="bg-gray-800 rounded-xl px-2 py-8 text-white shadow-lg flex items-center relative">
					<div className="text-white text-2xl absolute -top-2 right-3 transform -translate-y-full">Runway</div>
					<RunwayVisualizationWidget runwayLength={this.state.runwayLength} labels={this.state.runwayVisualizationLabels} runwayNumber={this.state.runwayNumber} />
				</div>
			</div>
			);
	}
}
