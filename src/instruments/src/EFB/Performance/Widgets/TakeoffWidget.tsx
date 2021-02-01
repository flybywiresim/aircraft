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
import { getTailWind } from '../CommonCalculations';

type TakeoffWidgetProps = {};
type TakeoffWidgetState = {
	weight: number,
	flaps: FlapsConfig,
	temperature: number,
	windDirection: number,
	windMagnitude: number,
	runwayHeading: number,
	v1: number,
	vr: number,
	v2: number,
	flexTemp: string,
};

/**
 * V2 speed table for takeoff
 * Indexes: 0 - Config 1 + F, 1 - Config 2, 2 - Config 3.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const takeoffV2Speeds = [
    [
        () => 126,
        () => 126,
        () => 126,
        (m) => 126 + 0.2 * (m - 50),
        (m) => 127 + m - 55,
        (m) => 132 + m - 60,
        (m) => 137 + m - 65,
        (m) => 142 + m - 70,
        (m) => 147 + m - 75,
        () => 151
    ], // Conf 1 + F
    [
        () => 126,
        () => 126,
        () => 126,
        () => 126,
        (m) => 126 + 0.2 * (m - 55),
        (m) => 127 + m - 60,
        (m) => 132 + m - 65,
        (m) => 137 + 0.8 * (m - 70),
        (m) => 141 + m - 75,
        () => 146
    ], // Conf 2
    [
        () => 125,
        () => 125,
        () => 125,
        () => 125,
        () => 125,
        (m) => 125 + 0.6 * (m - 60),
        (m) => 128 + 0.8 * (m - 65),
        (m) => 128 + m - 70,
        (m) => 128 + 0.8 * (m - 75),
        () => 141
    ] // Conf 3
];

enum FlapsConfig {
	Conf1F,
	Conf2,
	Conf3
}

// Hacky numbers used to guess flex temp
const maxTOWeightAt40Degrees = 75000;
const maxTOWeightAt68Degrees = 52500;

const invalidValueDisplay: string = "---";

export default class TakeoffWidget extends React.Component<TakeoffWidgetProps, TakeoffWidgetState> {
	constructor(props: TakeoffWidgetProps) {
		super(props);
		this.state = {
			weight: 0,
			flaps: FlapsConfig.Conf1F,
			temperature: 0,
			windDirection: 0,
			windMagnitude: 0,
			runwayHeading: 0,
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
		let mass = this.state.weight / 1000;
		let flaps = this.state.flaps;
		let altitude = 0;

		let v2 = this.getV2(mass, flaps, altitude, this.state.temperature);
        let vr = v2 - 4;
		let v1 = v2 - 5;

		let flexTemp = this.getFlexTemp(this.state.weight);

		let flexV2 = this.getV2(mass, flaps, altitude, flexTemp);

		let flexTempString = flexTemp.toString();

		if (flexTemp <= 40) {
			flexTempString = invalidValueDisplay;
		}


		this.setState(prevState => {
			let newState = { ...prevState };

			newState.v1 = v1;
			newState.vr = vr;
			newState.v2 = v2;
			newState.flexTemp = flexTempString;

			return newState;
		});
	};

	private getV2(mass: number, flaps: FlapsConfig, altitude: number, temperature: number): number {
		let v2 = Math.floor(takeoffV2Speeds[flaps][this.getTakeoffTableIndex(mass)](mass) + (flaps === 1 ? (Math.abs(altitude * 0.0002)) : 0));

		v2 += this.getTemperatureOffset(v2, temperature)
		v2 += this.getWindOffset(this.state.windDirection, this.state.windMagnitude, this.state.runwayHeading);

		return Math.round(v2);;
	}

	/**
	 * Find the temperature at which our current weight is the maximum allowed TOW
	 * This is then the flex takeoff temp
	 * @param weight Weight in KGs
	 */
	private getFlexTemp(weight: number): number {
		if (weight < maxTOWeightAt68Degrees) {
			return 68;
		}
		if (weight > maxTOWeightAt40Degrees) {
			return 40;
		}

		// Solve straight line between TOW @ 40 degrees and TOW @ 68 degrees
		// weight = (gradient * temp) + offset
		// therefore: temp = (weight - offset) / gradient
		let dy = maxTOWeightAt68Degrees - maxTOWeightAt40Degrees;
		let dx = 28;
		let gradient = dy / dx;
		let offset = maxTOWeightAt40Degrees - (gradient * 40);

		let temperature = (weight - offset) / gradient;
		return Math.round(temperature);
	}

	/**
	 * Returns an offset for a given takeoff speed
	 * Approximation based on linear 1kt decrease per 2°C increase after 44°C
	 * Minimum speed 125kts
	 * @param speed
	 * @param temperature
	 */
	private getTemperatureOffset(speed: number, temperature: number): number {
		if (temperature < 44) {
			return 0;
		}
		let decrease = (temperature - 44) / 2;
		let newSpeed = speed - decrease;
		return newSpeed > 125
			? -decrease
			: -(speed - 125);
	}

	/**
	 * Returns an offset for the takeoff speed
	 * Approximation based on tail wind calculation with fixed change per 10kts
	 * @param windDirection Wind direction relative to North
	 * @param windMagnitude Wind magnitude in kts
	 * @param runwayHeading Runway heading
	 */
	private getWindOffset(windDirection: number, windMagnitude: number, runwayHeading: number): number {
		var tailWindOffsetPer10kts = -6.7;
		var headWindOffsetPer10kts = 5;

		var tailWind = getTailWind(windDirection, windMagnitude, runwayHeading);

		if (tailWind > 0) {
			return (tailWind / 10) * tailWindOffsetPer10kts;
		}
		return ((-tailWind) / 10) * headWindOffsetPer10kts;
	}

	/**
	 * Converts mass into an index from 0-8 for use with TO table
	 * @param mass Mass in tons
	 */
	private getTakeoffTableIndex = (mass: number): number => {
		let index = Math.ceil(((mass > 80 ? 80 : mass) - 40) / 5);
		return index >= 0
			? index
			: 0;
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
		})
	}

	private handleTemperatureChange = (event: React.FormEvent<HTMLInputElement>): void => {
		let temperature = parseInt(event.currentTarget.value);

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
		let flaps: FlapsConfig = parseInt(event.currentTarget.value);

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
