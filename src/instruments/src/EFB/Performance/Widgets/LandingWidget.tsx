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
 // TODO: good-to-medium and medium-to-poor conditions

import React from 'react';
import { getTailWind } from '../CommonCalculations';

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
	altitude: number,
	temperature: number,
	slope: number,
	overweightProcedure: boolean,
	landingDistance: number
};

enum RunwayConditions {
	Dry,
	Good,
	Medium,
	Poor,
}

enum FlapsConfig {
	Conf3,
	Full
}

enum AutobrakeMode {
	Low,
	Medium,
	Max // Manual brake is the same as max auto
}


/**
 * Landing data for a specific aircraft configuration with a specific runway condition
 */
type LandingData = {
	refDistance: number,
	weightCorrectionAbove: number, // per 1T above 68T
	weightCorrectionBelow: number, // per 1T below 68T
	speedCorrection: number, // Per 5kt
	altitudeCorrection: number, // Per 1000ft ASL
	windCorrection: number, // Per 5KT tail wind
	tempCorrection: number, // Per 10 deg C above ISA
	slopeCorrection: number, // Per 1% down slope
	reverserCorrection: number, // Per thrust reverser operative
	overweightProcedureCorrection: number // If overweight procedure applied
};

type FlapsConfigLandingData = {
	[flapsConfig in FlapsConfig]: LandingData
};

type AutobrakeConfigLandingData = {
	[autobrakeConfig in AutobrakeMode]: FlapsConfigLandingData
}

type RunwayConditionLandingData = {
	[runwayCondition in RunwayConditions]: AutobrakeConfigLandingData;
}

const dryRunwayLandingData: AutobrakeConfigLandingData = {
	[AutobrakeMode.Max]: {
		[FlapsConfig.Full]: {
			refDistance: 1060,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -10,
			speedCorrection: 70,
			altitudeCorrection: 40,
			windCorrection: 130,
			tempCorrection: 30,
			slopeCorrection: 20,
			reverserCorrection: 0,
			overweightProcedureCorrection: 910
		},
		[FlapsConfig.Conf3]: {
			refDistance: 1210,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -10,
			speedCorrection: 80,
			altitudeCorrection: 50,
			windCorrection: 130,
			tempCorrection: 40,
			slopeCorrection: 30,
			reverserCorrection: -10,
			overweightProcedureCorrection: 1080
		}
	},
	[AutobrakeMode.Medium]: {
		[FlapsConfig.Full]: {
			refDistance: 1330,
			weightCorrectionAbove: 30,
			weightCorrectionBelow: -10,
			speedCorrection: 90,
			altitudeCorrection: 50,
			windCorrection: 140,
			tempCorrection: 40,
			slopeCorrection: 10,
			reverserCorrection: 0,
			overweightProcedureCorrection: 220
		},
		[FlapsConfig.Conf3]: {
			refDistance: 1510,
			weightCorrectionAbove: 40,
			weightCorrectionBelow: -10,
			speedCorrection: 100,
			altitudeCorrection: 50,
			windCorrection: 140,
			tempCorrection: 50,
			slopeCorrection: 10,
			reverserCorrection: 0,
			overweightProcedureCorrection: 230
		}
	},
	[AutobrakeMode.Low]: {
		[FlapsConfig.Full]: {
			refDistance: 1860,
			weightCorrectionAbove: 40,
			weightCorrectionBelow: -10,
			speedCorrection: 130,
			altitudeCorrection: 70,
			windCorrection: 200,
			tempCorrection: 70,
			slopeCorrection: 30,
			reverserCorrection: 0,
			overweightProcedureCorrection: 210
		},
		[FlapsConfig.Conf3]: {
			refDistance: 2160,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -10,
			speedCorrection: 140,
			altitudeCorrection: 80,
			windCorrection: 220,
			tempCorrection: 70,
			slopeCorrection: 30,
			reverserCorrection: -10,
			overweightProcedureCorrection: 230
		}
	}
};

const goodRunwayLandingData: AutobrakeConfigLandingData = {
	[AutobrakeMode.Max]: {
		[FlapsConfig.Full]: {
			refDistance: 1320,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -10,
			speedCorrection: 110,
			altitudeCorrection: 70,
			windCorrection: 200,
			tempCorrection: 60,
			slopeCorrection: 50,
			reverserCorrection: -20,
			overweightProcedureCorrection: 710
		},
		[FlapsConfig.Conf3]: {
			refDistance: 1570,
			weightCorrectionAbove: 60,
			weightCorrectionBelow: -20,
			speedCorrection: 120,
			altitudeCorrection: 80,
			windCorrection: 230,
			tempCorrection: 70,
			slopeCorrection: 50,
			reverserCorrection: -30,
			overweightProcedureCorrection: 810
		}
	},
	[AutobrakeMode.Medium]: {
		[FlapsConfig.Full]: {
			refDistance: 1380,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -10,
			speedCorrection: 110,
			altitudeCorrection: 70,
			windCorrection: 200,
			tempCorrection: 60,
			slopeCorrection: 50,
			reverserCorrection: 0,
			overweightProcedureCorrection: 200
		},
		[FlapsConfig.Conf3]: {
			refDistance: 1630,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -20,
			speedCorrection: 120,
			altitudeCorrection: 80,
			windCorrection: 230,
			tempCorrection: 70,
			slopeCorrection: 60,
			reverserCorrection: -20,
			overweightProcedureCorrection: 290
		}
	},
	[AutobrakeMode.Low]: {
		[FlapsConfig.Full]: {
			refDistance: 1860,
			weightCorrectionAbove: 40,
			weightCorrectionBelow: -10,
			speedCorrection: 130,
			altitudeCorrection: 70,
			windCorrection: 200,
			tempCorrection: 70,
			slopeCorrection: 30,
			reverserCorrection: 0,
			overweightProcedureCorrection: 210
		},
		[FlapsConfig.Conf3]: {
			refDistance: 2160,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -20,
			speedCorrection: 140,
			altitudeCorrection: 80,
			windCorrection: 220,
			tempCorrection: 70,
			slopeCorrection: 30,
			reverserCorrection: -10,
			overweightProcedureCorrection: 230
		}
	}
}

const mediumRunwayLandingData: AutobrakeConfigLandingData = {
	[AutobrakeMode.Max]: {
		[FlapsConfig.Full]: {
			refDistance: 1760,
			weightCorrectionAbove: 40,
			weightCorrectionBelow: -10,
			speedCorrection: 100,
			altitudeCorrection: 70,
			windCorrection: 220,
			tempCorrection: 60,
			slopeCorrection: 110,
			reverserCorrection: -90,
			overweightProcedureCorrection: 750
		},
		[FlapsConfig.Conf3]: {
			refDistance: 2050,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -20,
			speedCorrection: 110,
			altitudeCorrection: 80,
			windCorrection: 240,
			tempCorrection: 70,
			slopeCorrection: 120,
			reverserCorrection: -120,
			overweightProcedureCorrection: 880
		}
	},
	[AutobrakeMode.Medium]: {
		[FlapsConfig.Full]: {
			refDistance: 1810,
			weightCorrectionAbove: 40,
			weightCorrectionBelow: -10,
			speedCorrection: 110,
			altitudeCorrection: 70,
			windCorrection: 230,
			tempCorrection: 60,
			slopeCorrection: 110,
			reverserCorrection: -100,
			overweightProcedureCorrection: 200
		},
		[FlapsConfig.Conf3]: {
			refDistance: 2100,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -20,
			speedCorrection: 110,
			altitudeCorrection: 80,
			windCorrection: 240,
			tempCorrection: 70,
			slopeCorrection: 130,
			reverserCorrection: -140,
			overweightProcedureCorrection: 300
		}
	},
	[AutobrakeMode.Low]: {
		[FlapsConfig.Full]: {
			refDistance: 1960,
			weightCorrectionAbove: 40,
			weightCorrectionBelow: -10,
			speedCorrection: 130,
			altitudeCorrection: 70,
			windCorrection: 240,
			tempCorrection: 70,
			slopeCorrection: 100,
			reverserCorrection: -40,
			overweightProcedureCorrection: 230
		},
		[FlapsConfig.Conf3]: {
			refDistance: 2270,
			weightCorrectionAbove: 50,
			weightCorrectionBelow: -20,
			speedCorrection: 140,
			altitudeCorrection: 80,
			windCorrection: 250,
			tempCorrection: 80,
			slopeCorrection: 110,
			reverserCorrection: -70,
			overweightProcedureCorrection: 260
		}
	}
};

const poorRunwayLandingData: AutobrakeConfigLandingData = {
	[AutobrakeMode.Max]: {
		[FlapsConfig.Full]: {
			refDistance: 2760,
			weightCorrectionAbove: 60,
			weightCorrectionBelow: -20,
			speedCorrection: 140,
			altitudeCorrection: 110,
			windCorrection: 430,
			tempCorrection: 110,
			slopeCorrection: 460,
			reverserCorrection: -370,
			overweightProcedureCorrection: 550
		},
		[FlapsConfig.Conf3]: {
			refDistance: 3250,
			weightCorrectionAbove: 70,
			weightCorrectionBelow: -30,
			speedCorrection: 150,
			altitudeCorrection: 130,
			windCorrection: 470,
			tempCorrection: 130,
			slopeCorrection: 550,
			reverserCorrection: -490,
			overweightProcedureCorrection: 660
		}
	},
	[AutobrakeMode.Medium]: {
		[FlapsConfig.Full]: {
			refDistance: 2790,
			weightCorrectionAbove: 60,
			weightCorrectionBelow: -20,
			speedCorrection: 130,
			altitudeCorrection: 110,
			windCorrection: 440,
			tempCorrection: 100,
			slopeCorrection: 470,
			reverserCorrection: -380,
			overweightProcedureCorrection: 230
		},
		[FlapsConfig.Conf3]: {
			refDistance: 2280,
			weightCorrectionAbove: 70,
			weightCorrectionBelow: -30,
			speedCorrection: 150,
			altitudeCorrection: 130,
			windCorrection: 470,
			tempCorrection: 120,
			slopeCorrection: 560,
			reverserCorrection: -490,
			overweightProcedureCorrection: 310
		}
	},
	[AutobrakeMode.Low]: {
		[FlapsConfig.Full]: {
			refDistance: 2830,
			weightCorrectionAbove: 60,
			weightCorrectionBelow: -20,
			speedCorrection: 140,
			altitudeCorrection: 110,
			windCorrection: 440,
			tempCorrection: 110,
			slopeCorrection: 470,
			reverserCorrection: -380,
			overweightProcedureCorrection: 220
		},
		[FlapsConfig.Conf3]: {
			refDistance: 3330,
			weightCorrectionAbove: 70,
			weightCorrectionBelow: -30,
			speedCorrection: 140,
			altitudeCorrection: 130,
			windCorrection: 470,
			tempCorrection: 120,
			slopeCorrection: 560,
			reverserCorrection: -500,
			overweightProcedureCorrection: 290
		}
	}
}

/**
 * Stores all landing data for the aircraft.
 * Retrieve with runwayConditionLandingData[runwayCondition][autobrakeMode][flapsConfig]
 */
const runwayConditionLandingData: RunwayConditionLandingData = {
	[RunwayConditions.Dry]: dryRunwayLandingData,
	[RunwayConditions.Good]: goodRunwayLandingData,
	[RunwayConditions.Medium]: mediumRunwayLandingData,
	[RunwayConditions.Poor]: poorRunwayLandingData
}

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
			autobrakeMode: AutobrakeMode.Medium,
			reverseThrust: false,
			altitude: 0,
			slope: 0,
			temperature: 0,
			overweightProcedure: false,
			landingDistance: 0
		};
	}

	private calculateLanding = (): void => {
		let operationalLandingDistance = this.calculateRequiredLandingDistance();

		this.setState(prevState => {
			let newState = { ...prevState };
			newState.landingDistance = Math.round(operationalLandingDistance);
			return newState;
		});
	}

	private calculateRequiredLandingDistance = (): number => {
		// TODO: Get target speed from VLS table, QRH section VAPP DETERMINATION WITHOUT FAILURE
		let targetApproachSpeed: number = 131.5;

		let landingData = runwayConditionLandingData[this.state.runwayCondition][this.state.autobrakeMode][this.state.flaps];

		let tailWind = getTailWind(this.state.windDirection, this.state.windMagnitude, this.state.runwayHeading);
		if (tailWind < 0) {
			tailWind = 0;
		}

		let weightDifference = (this.state.weight / 1000) - 68;
		let weightCorrection: number;
		if (weightDifference < 0) {
			weightCorrection = landingData.weightCorrectionBelow * Math.abs(weightDifference);
		} else {
			weightCorrection = landingData.weightCorrectionAbove * weightDifference;
		}

		let speedDifference = this.state.approachSpeed - targetApproachSpeed;
		if (speedDifference < 0) {
			speedDifference = 0;
		}

		let speedCorrection = (speedDifference / 5) * landingData.speedCorrection;
		let windCorrection = tailWind * landingData.windCorrection;
		let reverserCorrection;
		if (this.state.reverseThrust) {
			reverserCorrection = landingData.reverserCorrection * 2;
		} else {
			reverserCorrection = 0;
		}

		let altitudeCorrection = (this.state.altitude / 1000) * landingData.altitudeCorrection;
		let slopeCorrection = this.state.slope < 0
			? Math.abs(this.state.slope) * landingData.slopeCorrection
			: 0;
		let temperatureCorrection = this.state.temperature > 15
			? ((this.state.temperature - 15) / 10) * landingData.tempCorrection
			: 0;
		let overweightProcCorrection = this.state.overweightProcedure
			? landingData.overweightProcedureCorrection
			: 0;

		let requiredLandingDistance =
			landingData.refDistance + weightCorrection + speedCorrection + windCorrection + reverserCorrection
			+ altitudeCorrection + slopeCorrection + temperatureCorrection + overweightProcCorrection;

		return Math.round(requiredLandingDistance);
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
		let temperature = parseInt(event.currentTarget.value);

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
								<div className="input-label">Autobrake Mode</div>
								<div className="input-container">
									<select defaultValue="1" onChange={this.handleAutobrakeChange}>
										<option value="0">Low</option>
										<option value="1">Medium</option>
										<option value="2">Max</option>
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
						</div>
					</div>
				</div>
			</div>
    	);
	}
}
