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

import React from 'react';

type WakeoffWidgetProps = {};
type TakeoffWidgetState = {};

export default class TakeoffWidget extends React.Component<WakeoffWidgetProps, TakeoffWidgetState> {
	public render() {
		return (
			<div className="performance-widget bg-gray-800 rounded-xl p-6 text-white shadow-lg h-full">
				<img className="performance-icon" src="../Assets/cfm_leap1-a.svg"></img>
				<div className="inputs text-center mb-6">
					<div className="columns">
						<div className="column column-left">
							<div className="input-field">
								<div className="input-label">OAT</div>
								<div className="input-container">
									<input placeholder="°C"/>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Wind (KTS)</div>
								<div className="input-container">
									<input placeholder="DIR/MAG"/>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Runway Length</div>
								<div className="input-container">
									<input placeholder="Meters"/>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Runway Heading</div>
								<div className="input-container">
									<input />
								</div>
							</div>
						</div>
						<div className="column column-right">
							<div className="input-field">
								<div className="input-label">Weight</div>
								<div className="input-container">
									<input placeholder="KG"/>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Flaps</div>
								<div className="input-container">
									<input/>
								</div>
							</div>
							<div className="input-field">
								<div className="input-label">Runway Condition</div>
								<div className="input-container">
									<select defaultValue="0">
										<option value="0">Dry</option>
										<option value="1">Wet</option>
										<option value="2">Snow</option>
										<option value="3">Slush</option>
										<option value="4">Standing Water</option>
									</select>
								</div>
							</div>
						</div>
					</div>
					<button className="calculate-button w-full font-medium bg-green-500 p-2 text-white flex items-center justify-center rounded-lg focus:outline-none">Calculate</button>
				</div>
				<div className="results">
					<div className="section">
						<h1>TOGA</h1>
						<div className="values">
							<div className="output-field">
								<div className="output-label">V1</div>
								<div className="output-container">
									<input disabled id="toga-v1-output"></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">VR</div>
								<div className="output-container">
									<input disabled id="toga-vr-output"></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">V2</div>
								<div className="output-container">
									<input disabled id="toga-v2-output"></input>
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
									<input disabled id="flex-temp-output"></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">V1</div>
								<div className="output-container">
									<input disabled id="flex-v1-output"></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">VR</div>
								<div className="output-container">
									<input disabled id="flex-vr-output"></input>
								</div>
							</div>
							<div className="output-field">
								<div className="output-label">V2</div>
								<div className="output-container">
									<input disabled id="flex-v2-output"></input>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
