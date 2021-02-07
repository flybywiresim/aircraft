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
import RunwayVisualizationWidget, { DistanceLabel } from './RunwayVisualizationWidget';
import PerformanceInput from '../Components/PerformanceInput';
import PerformanceSelectInput from '../Components/PerformanceSelectInput';
import PerformanceOutputDisplay from '../Components/PerformanceOutputDisplay';

type TakeoffWidgetProps = {};
type TakeoffWidgetState = {
	weight: number,
	flaps: TakeoffFlapsConfig,
	temperature: number,
	runwayHeading: number,
	pressure: number,
	runwayLength: number,
	altitude: number,
	runwayTooShort: boolean,
	v1: number,
	vr: number,
	v2: number,
	runwayVisualisationLabels: DistanceLabel[],
	runwayNumber?: number,
	displayedRunwayLength: number
};

export default class TakeoffWidget extends React.Component<TakeoffWidgetProps, TakeoffWidgetState> {
	private calculator: TakeoffCalculator = new TakeoffCalculator();

	constructor(props: TakeoffWidgetProps) {
		super(props);
		this.state = {
			weight: 0,
			flaps: TakeoffFlapsConfig.Conf1F,
			temperature: 0,
			runwayHeading: 0,
			pressure: 1013.25,
			runwayLength: 0,
			altitude: 0,
			runwayTooShort: false,
			v1: 0,
			vr: 0,
			v2: 0,
			runwayVisualisationLabels: [],
			displayedRunwayLength: 0
		}
	}

	private calculate = (): void => {
		let takeoffPerformance = this.calculator.calculateTakeoffPerformance(this.state.weight,
			this.state.flaps,
			this.state.temperature,
			this.state.pressure,
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

			newState.runwayNumber = Math.round(this.state.runwayHeading / 10);
			newState.displayedRunwayLength = this.state.runwayLength;

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

	private handleFlapsChange = (newValue: number | string): void => {
		let flaps: TakeoffFlapsConfig = parseInt(newValue.toString());

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.flaps = flaps;
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
		return (
			<div className="flex flex-grow">
				<div className="w-1/2 mr-5 bg-gray-800 rounded-xl p-6 text-white shadow-lg flex items-center">
					<div className="w-full">
						<div className="text-center mb-6">
							<div className="flex">
								<div className="flex-1 m-2.5 column-left">
									<PerformanceInput label="OAT" placeholder="°C" onChange={this.handleTemperatureChange} />
									<PerformanceInput label="QNH" placeholder="mb" onChange={this.handlePressureChange}/>
									<PerformanceInput label="Rwy Heading" onChange={this.handleRunwayHeadingChange} />
									<PerformanceInput label="Rwy Length" placeholder="m" onChange={this.handleRunwayLengthChange} />

								</div>
								<div className="flex-1 m-2.5 column-right">
									<PerformanceInput label="Rwy Altitude" placeholder={"\" ASL"} onChange={this.handleAltitudeChange} reverse/>
									<PerformanceInput label="Weight" placeholder="KG" onChange={this.handleWeightChange} reverse/>
									<PerformanceSelectInput label="Flaps" defaultValue="0" onChange={this.handleFlapsChange} reverse options={[
										[0, "1 + F"],
										[1, "2"],
										[2, "3"]
									]} />
								</div>
							</div>
							<button className="my-3 w-full font-medium bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none"
								onClick={this.calculate}>Calculate</button>
						</div>
						<div className="border-t border-white pt-3">
							<div className="flex flex-col items-center m-3">
								<h1>Takeoff Speeds</h1>
								<div className="flex">
									<PerformanceOutputDisplay label="V1" value={this.state.v1} error={this.state.runwayTooShort} />
									<PerformanceOutputDisplay label="VR" value={this.state.vr} error={this.state.runwayTooShort} />
									<PerformanceOutputDisplay label="V2" value={this.state.v2} error={this.state.runwayTooShort} />
								</div>
							</div>
							{this.state.runwayTooShort &&
								<div className="error-message">Runway too short for takeoff!</div>
							}
						</div>
					</div>
				</div>
				<div className="bg-gray-800 rounded-xl px-2 py-8 text-white shadow-lg flex items-center">
					<RunwayVisualizationWidget runwayLength={this.state.displayedRunwayLength} labels={this.state.runwayVisualisationLabels} runwayNumber={this.state.runwayNumber} />
				</div>
			</div>
		);
	}
}
