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

 /* Speeds and distances source:
	A320 Quick Reference Handbook (Revision 40)
 */

import React from 'react';

type LandingWidgetProps = {};
type LandingWidgetState = {
	windDirection: number,
	windMagnitude: number,
	weight: number,
	runwayHeading: number,
	approachSpeed: number,
	flaps: FlapsConfig,
	runwayCondition: RunwayConditions,
	autobrakeMode: AutobrakeMode,
	reverseThrust: boolean,
	landingDistance: number,
	minimumRunwayLength: number
};

enum RunwayConditions {
	Dry,
	Wet,
	Snow,
	Slush,
	Water,
	Ice
}

enum FlapsConfig {
	Conf3,
	Full
}

enum AutobrakeMode {
	Manual,
	Low,
	Medium,
	Max
}

const targetApproachSpeed: number = 131.5;

export default class LandingWidget extends React.Component<LandingWidgetProps, LandingWidgetState> {
	constructor(props: LandingWidget) {
		super(props);
		this.state = {
			windDirection: 0,
			windMagnitude: 0,
			weight: 0,
			runwayHeading: 0,
			approachSpeed: 0,
			flaps: FlapsConfig.Full,
			runwayCondition: RunwayConditions.Dry,
			autobrakeMode: AutobrakeMode.Low,
			reverseThrust: false,
			landingDistance: 0,
			minimumRunwayLength: 0
		};
	}

	private calculateLanding = (): void => {
		// let operationalLandingDistance = this.calculateOperationalLandingDistance();
		let operationalLandingDistance = this.calculateRequiredLandingDistance();

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.landingDistance = Math.round(operationalLandingDistance);
			newState.minimumRunwayLength = Math.round(operationalLandingDistance / 0.6);
			return newState;
		});
	}

	private calculateRequiredLandingDistance = (): number => {
		let requiredLandingDistanceReference = this.getRequiredLandingDistanceReference(this.state.weight, this.state.flaps,
			this.state.autobrakeMode, this.state.runwayCondition);

		let approachSpeedCorrection = requiredLandingDistanceReference * this.getApproachSpeedCorrection(this.state.approachSpeed);
		let windCorrection = requiredLandingDistanceReference * this.getWindCorrection(this.state.windDirection, this.state.windMagnitude, this.state.runwayHeading, this.state.runwayCondition);
		let reverseThrustCorrection = requiredLandingDistanceReference * this.getReverseThrustCorrection(this.state.reverseThrust, this.state.runwayCondition);

		let requiredLandingDistance = requiredLandingDistanceReference + approachSpeedCorrection + windCorrection + reverseThrustCorrection;
		return Math.round(requiredLandingDistance);
	}

	private getRequiredLandingDistanceReference = (weight: number, flapsConfig: FlapsConfig, autobrakeMode: AutobrakeMode, runwayCondition: RunwayConditions): number => {
		// TODO: This shouldn't be linear, use look-up table
		let minWeight: number = 58000;
		let maxWeight: number = 94000;
		let minWeightRefDistance: number;
		let maxWeightRefDistance: number

		if (autobrakeMode == AutobrakeMode.Medium) {
			minWeightRefDistance = this.getMediumAutobrakeMinWeightRefDist(flapsConfig, runwayCondition);
			maxWeightRefDistance = this.getMediumAutobrakeMaxWeightRefDist(flapsConfig, runwayCondition);
		} else if (autobrakeMode == AutobrakeMode.Low) {
			minWeightRefDistance = this.getLowAutobrakeMinWeightRefDist(flapsConfig, runwayCondition);
			maxWeightRefDistance = this.getLowAutobrakeMaxWeightRefDist(flapsConfig, runwayCondition);
		} else {
			minWeightRefDistance = this.getMaxBrakeMinWeightRefDist(flapsConfig, runwayCondition);
			maxWeightRefDistance = this.getMaxBrakeMaxWeightRefDist(flapsConfig, runwayCondition);
		}

		// Compute straight line between the minimum and maximum weight points
		let dy = maxWeightRefDistance - minWeightRefDistance;
		let dx = maxWeight - minWeight;

		let gradient = dy / dx;
		let offset = minWeightRefDistance - (minWeight * gradient);

		return (weight * gradient) + offset;
	}

	private getMediumAutobrakeMinWeightRefDist = (flapsConfig: FlapsConfig, runwayCondition: RunwayConditions): number => {
		if (flapsConfig == FlapsConfig.Conf3) {
			return ([1340, 1410, 1580, 1700, 1770, 2980])[runwayCondition];
		}
		return ([1280, 1330, 1500, 1590, 1660, 2790])[runwayCondition]
	}

	private getMediumAutobrakeMaxWeightRefDist = (flapsConfig: FlapsConfig, runwayCondition: RunwayConditions): number => {
		if (flapsConfig == FlapsConfig.Conf3) {
			return ([1970, 2200, 2170, 2690, 2700, 4290])[runwayCondition];
		}
		return ([1800, 1980, 1970, 2440, 2580, 3940])[runwayCondition];
	}

	private getLowAutobrakeMinWeightRefDist = (flapsConfig: FlapsConfig, runwayCondition: RunwayConditions): number => {
		if (flapsConfig == FlapsConfig.Conf3) {
			return ([1920, 1920, 1870, 1860, 1900, 3000])[runwayCondition];
		}
		return ([1830, 1830, 1780, 1770, 1810, 2810])[runwayCondition];
	}

	private getLowAutobrakeMaxWeightRefDist = (flapsConfig: FlapsConfig, runwayCondition: RunwayConditions): number => {
		if (flapsConfig == FlapsConfig.Conf3) {
			return ([2810, 2810, 2730, 2790, 2940, 4320])[runwayCondition];
		}
		return ([2590, 2590, 2520, 2540, 2660, 3960])[runwayCondition];
	}

	private getMaxBrakeMinWeightRefDist = (flapsConfig: FlapsConfig, runwayCondition: RunwayConditions): number => {
		if (flapsConfig == FlapsConfig.Conf3) {
			return ([860, 1110, 1390, 1490, 1550, 2780])[runwayCondition];
		}
		return ([820, 1040, 1310, 1390, 1430, 2590])[runwayCondition];
	}

	private getMaxBrakeMaxWeightRefDist = (flapsConfig: FlapsConfig, runwayCondition: RunwayConditions): number => {
		if (flapsConfig == FlapsConfig.Conf3) {
			return ([1570, 1860, 1980, 2370, 2520, 3950])[runwayCondition];
		}
		return ([1470, 1720, 1860, 2210, 2340, 3690])[runwayCondition];
	}

	private getApproachSpeedCorrection = (approachSpeed: number): number => {
		let approachSpeedDifference = approachSpeed - targetApproachSpeed;
		if (approachSpeedDifference < 0) {
			return 0;
		}

		let multiplier = approachSpeedDifference / 5;
		return 0.08 * multiplier;
	}

	private getWindCorrection = (windDirection: number, windMagnitude: number, runwayHeading: number, runwayCondition: RunwayConditions): number => {
		let tailWind = this.getTailWind(windDirection, windMagnitude, runwayHeading);
		if (tailWind < 0) {
			return 0;
		}

		let multiplier = tailWind / 10;
		// 			  Dry,   Wet,  Snow, Slush, Water,Ice
		let offset = ([0.16, 0.21, 0.16, 0.22, 0.24, 0.27])[runwayCondition];

		return offset * multiplier;
	}

	private getReverseThrustCorrection = (reverseThrust: boolean, runwayCondition: RunwayConditions): number => {
		if (reverseThrust) {
			// 	     Dry,   Wet,  Snow,  Slush,  Water,  Ice
			return ([-0.04, -0.08, -0.11, -0.15, -0.16, -0.28])[runwayCondition];
		}
		return 0;
	}

	private getTailWind = (windDirection: number, windMagnitude: number, runwayHeading: number): number => {
		let windDirectionRelativeToRwy = windDirection - runwayHeading;
		let windDirectionRelativeToRwyRadians = windDirectionRelativeToRwy * (Math.PI / 180);

		let tailWind = Math.cos(Math.PI - windDirectionRelativeToRwyRadians) * windMagnitude;
		return tailWind;
	}

	private handleWindChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let wind = event.currentTarget.value;
		let splitWind = wind.split('/');
		let direction = parseInt(splitWind[0]);
		let magnitude = parseInt(splitWind[1]);

		if (!direction || !magnitude) {
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

	private handleFlapsChange = (event: React.FormEvent<HTMLSelectElement>): void => {
		let flaps: FlapsConfig = parseInt(event.currentTarget.value);

		if (flaps !== FlapsConfig.Full && flaps !== FlapsConfig.Conf3) {
			flaps = FlapsConfig.Full;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.flaps = flaps;
			return newState;
		});
	}

	private handleRunwayConditionChange = (event: React.FormEvent<HTMLSelectElement>): void => {
		let runwayCondition: RunwayConditions = parseInt(event.currentTarget.value);

		if (!runwayCondition) {
			runwayCondition = RunwayConditions.Dry;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.runwayCondition = runwayCondition
			return newState;
		});
	}

	private handleAutobrakeChange = (event: React.FormEvent<HTMLSelectElement>): void => {
		let autobrakeMode: AutobrakeMode = parseInt(event.currentTarget.value);

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.autobrakeMode = autobrakeMode;
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

	public render() {
		return (
			<div className="performance-widget bg-gray-800 rounded-xl p-6 text-white shadow-lg h-full">
				<div className="inputs text-center mb-6">
					<div className="columns">
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
										<option value="1">Wet</option>
										<option value="2">Snow</option>
										<option value="3">Slush</option>
										<option value="4">Standing Water</option>
										<option value="5">Ice</option>
									</select>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Autobrake Mode</div>
								<div className="input-container">
									<select defaultValue="1" onChange={this.handleAutobrakeChange}>
										<option value="0">Manual</option>
										<option value="1">Low</option>
										<option value="2">Medium</option>
										<option value="3">Max</option>
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
								<div className="output-label">Landing Distance</div>
								<div className="output-container">
									<input disabled id="landing-distance-output" value={this.state.landingDistance + "m"}></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">Min Runway Length</div>
								<div className="output-container">
									<input disabled id="landing-distance-output" value={this.state.minimumRunwayLength + "m"}></input>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
    	);
	}
}
