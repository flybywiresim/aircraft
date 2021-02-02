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
import TakeoffCalculator, { TakeoffFlapsConfig } from '../Calculators/TakeoffCalculator';

type TakeoffWidgetProps = {};
type TakeoffWidgetState = {
	weight: number,
	flaps: TakeoffFlapsConfig,
	temperature: number,
	windDirection: number,
	windMagnitude: number,
	runwayHeading: number,
	pressure: number,
	v1: number,
	vr: number,
	v2: number,
	flexTemp: string,
};

const invalidValueDisplay: string = "---";

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
			pressure: 0,
			v1: 0,
			vr: 0,
			v2: 0,
			flexTemp: invalidValueDisplay
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
			this.state.runwayHeading);

		let flexTempString = takeoffPerformance.flexTemp
			? takeoffPerformance.flexTemp.toString()
			: invalidValueDisplay;


		this.setState(prevState => {
			let newState = { ...prevState };

			newState.v1 = takeoffPerformance.v1;
			newState.vr = takeoffPerformance.vr;
			newState.v2 = takeoffPerformance.v2;
			newState.flexTemp = flexTempString;

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

	private handlePressureChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let pressure = parseFloat(event.currentTarget.value);

		if (!pressure) {
			pressure = 0;
		}

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.pressure = pressure;
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
						</div>
					</div>
					<button className="calculate-button w-full font-medium bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none"
						onClick={this.updateVSpeeds}>Calculate</button>
				</div>
				<div className="results">
					<div className="section">
						<h1>TOGA</h1>
						<div className="values">
							<div className="output-field">
								<div className="output-label">V1</div>
								<div className="output-container">
									<input disabled value={this.state.v1}></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">VR</div>
								<div className="output-container">
									<input disabled value={this.state.vr}></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">V2</div>
								<div className="output-container">
									<input disabled value={this.state.v2}></input>
								</div>
							</div>
						</div>
					</div>
					<div className="section">
						<h1>Flex</h1>
						<div className="values">
							<div className="output-field">
								<div className="output-label">Temperature</div>
								<div className="output-container">
									<input disabled value={this.state.flexTemp + " °C"}></input>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
