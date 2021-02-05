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

 // Reference Operational Data Manual for approximations of weather impact on V speed

import React from 'react';
import classNames from "classnames";
import TakeoffCalculator, { TakeoffFlapsConfig } from '../Calculators/TakeoffCalculator';
import RunwayVisualizationWidget, { DistanceLabel } from './RunwayVisualizationWidget';

type TakeoffWidgetProps = {};
type TakeoffWidgetState = {
	weight: number,
	flaps: TakeoffFlapsConfig,
	temperature: number,
	windDirection: number,
	windMagnitude: number,
	runwayHeading: number,
	pressure: number,
	runwayLength: number,
	altitude: number,
	runwayTooShort: boolean,
	v1: number,
	vr: number,
	v2: number,
	runwayVisualisationLabels: DistanceLabel[]
};

export default class TakeoffWidget extends React.Component<TakeoffWidgetProps, TakeoffWidgetState> {
	private calculator: TakeoffCalculator = new TakeoffCalculator();

	constructor(props: TakeoffWidgetProps) {
		super(props);
		this.state = {
			weight: 0,
			flaps: TakeoffFlapsConfig.Conf1F,
			temperature: 0,
			windDirection: 0,
			windMagnitude: 0,
			runwayHeading: 0,
			pressure: 1013.25,
			runwayLength: 0,
			altitude: 0,
			runwayTooShort: false,
			v1: 0,
			vr: 0,
			v2: 0,
			runwayVisualisationLabels: []
		}
	}

	/**
	 * Updates displayed V Speeds for the current values in state
	 */
	private updateVSpeeds = (): void => {
		let takeoffPerformance = this.calculator.calculateTakeoffPerformance(this.state.weight,
			this.state.flaps,
			this.state.temperature,
			this.state.pressure,
			this.state.windDirection,
			this.state.windMagnitude,
			this.state.runwayHeading,
			this.state.runwayLength,
			this.state.altitude);

		this.setState(prevState => {
			let newState = { ...prevState };

			newState.v1 = Math.round(takeoffPerformance.v1);
			newState.vr = Math.round(takeoffPerformance.vr);
			newState.v2 = Math.round(takeoffPerformance.v2);
			newState.runwayTooShort = takeoffPerformance.runwayTooShort;

			newState.runwayVisualisationLabels = [
				{
					label: 'RTO',
					distance: takeoffPerformance.rtoDist
				},
				{
					label: 'V1',
					distance: takeoffPerformance.v1Dist
				}
			]

			return newState;
		});
	};

	private handleWeightChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let weight = parseInt(event.currentTarget.value);

		if (!weight) {
			weight = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.weight = weight;
			return newState;
		})
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
		})
	}

	private handleFlapsChange = (event: React.FormEvent<HTMLSelectElement>): void => {
		let flaps: TakeoffFlapsConfig = parseInt(event.currentTarget.value);

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.flaps = flaps;
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

	private handlePressureChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let pressure = parseFloat(event.currentTarget.value);

		if (!pressure) {
			pressure = 1013.25;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.pressure = pressure;
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


	public render() {
		return [(
			<div className="w-5/12 bg-gray-800 rounded-xl p-6 text-white shadow-lg">
				<div className="inputs text-center mb-6">
					<div className="flex">
						<div className="column column-left">
							<div className="input-field">
								<div className="input-label">OAT</div>
								<div className="input-container">
									<input placeholder="°C" onChange={this.handleTemperatureChange}/>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Wind (KTS)</div>
								<div className="input-container">
									<input placeholder="DIR/MAG" onChange={this.handleWindChange} />
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Rwy Heading</div>
								<div className="input-container">
									<input onChange={this.handleRunwayHeadingChange}/>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Rwy Length</div>
								<div className="input-container">
									<input placeholder="m" onChange={this.handleRunwayLengthChange}/>
								</div>
							</div>
						</div>
						<div className="column column-right">
							<div className="input-field">
								<div className="input-label">Weight</div>
								<div className="input-container">
									<input placeholder="KG" onChange={this.handleWeightChange}/>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Flaps</div>
								<div className="input-container">
									<select defaultValue="0" onChange={this.handleFlapsChange}>
										<option value="0">1 + F</option>
										<option value="1">2</option>
										<option value="2">3</option>
									</select>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Pressure</div>
								<div className="input-container">
									<input placeholder="mb" onChange={this.handlePressureChange}/>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Altitude</div>
								<div className="input-container">
									<input placeholder="m" onChange={this.handleAltitudeChange}/>
								</div>
							</div>
						</div>
					</div>
					<button className="calculate-button w-full font-medium bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none"
						onClick={this.updateVSpeeds}>Calculate</button>
				</div>
				<div className="results">
					<div className="section">
						<h1>Takeoff Speeds</h1>
						<div className="values">
							<div className="output-field">
								<div className="output-label">V1</div>
								<div className="output-container">
									<input disabled className={classNames({disabled: true, error: this.state.runwayTooShort})} value={this.state.v1}></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">VR</div>
								<div className="output-container">
									<input className={classNames({disabled: true, error: this.state.runwayTooShort})} value={this.state.vr}></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">V2</div>
								<div className="output-container">
									<input className={classNames({disabled: true, error: this.state.runwayTooShort})} value={this.state.v2}></input>
								</div>
							</div>
						</div>
					</div>
					{this.state.runwayTooShort &&
						<div className="error">Runway too short for takeoff!</div>
					}
				</div>
			</div>),
			<RunwayVisualizationWidget runwayLength={this.state.runwayLength} labels={ this.state.runwayVisualisationLabels }/>];
	}
}
