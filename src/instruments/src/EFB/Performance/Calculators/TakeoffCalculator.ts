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
 // QRH Operating speeds used to determine stall speeds (operating speed = 1.23 * VS)

import { getTailWind } from '../Calculators/CommonCalculations';

export enum TakeoffFlapsConfig {
	Conf1F,
	Conf2,
	Conf3
}

/**
 * Minimum V2 limited by VMU/VMCA
 * Pressure altitude corrections are ignored as they are < 0.5kts for takeoff altitudes
 * Indexes: 0 - Config 1 + F, 1 - Config 2, 2 - Config 3.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const vmuVmcaMinV2Speeds = [
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

/**
 * The value at a given index corresponds to the pressure altitude represented
 * in `vmcgVmcaMinV1Speeds` at the same index, in feet
 */
const v1PressureAltitudeIndexes = [-2000, 0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9200, 14100];

/**
 * Minimum V1 limited by VMCG/VMCA
 * Indexes: 0 - Config 1 + F, 1 - Config 2, 2 - Config 3.
 * Sub-Indexes: Retrieve from `v1PressureAltitudeIndexes`
 */
const vmcgVmcaMinV1Speeds = [
	[117, 115, 114, 113, 112, 112, 111, 110, 109, 108, 106, 100], // Conf 1 + F
	[115, 113, 112, 111, 111, 110, 109, 108, 107, 106, 104, 100], // Conf 2
	[114, 112, 111, 110, 110, 110, 109, 108, 107, 105, 104, 100] // Conf 3
];


/**
 * The value at a given index corresponds to the pressure altitude represented
 * in `vmcgVmcaMinVrSpeeds` and `vmcgVmcaMinV2Speeds` at the same index, in feet
 */
const vrV2PressureAltitudeIndexes = [-2000, 0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9200, 10200];

/**
 * Minimum Vr limited by VMCG/VMCA
 * Indexes: 0 - Config 1 + F, 1 - Config 2, 2 - Config 3.
 * Sub-Indexes: Retrieve from `vrV2PressureAltitudeIndexes`
 */
const vmcgVmcaMinVrSpeeds = [
    [121, 119, 118, 116, 116, 116, 115, 114, 113, 111, 110, 102], // Conf 1 + F
    [119, 117, 116, 115, 114, 114, 113, 112, 111, 109, 108, 100], // Conf 2
    [118, 116, 115, 114, 114, 114, 113, 112, 110, 109, 107, 100] // Conf 3
];

/**
 * Minimum V2 limited by VMCG/VMCA
 * Indexes: 0 - Config 1 + F, 1 - Config 2, 2 - Config 3.
 * Sub-Indexes: Retrieve from `vrV2PressureAltitudeIndexes`
 */
const vmcgVmcaMinV2Speeds = [
    [124, 121, 120, 119, 119, 119, 118, 117, 115, 114, 112, 104], // Conf 1 + F
    [123, 121, 120, 119, 119, 119, 117, 116, 115, 114, 112, 103], // Conf 2
    [123, 121, 120, 119, 119, 118, 117, 116, 115, 114, 112, 103] // Conf 3
];


/**
 * Stall speeds
 * Indexes: 0 - Config 1 + F, 1 - Config 2, 2 - Config 3.
 * Sub-Indexes: 0 to 8 represent gross weight (t) in 5t steps from 40 to 80.
 */
const stallSpeeds = [
	[
		() => 106,
		() => 106,
		(m) => 106 + (m - 50),
		(m) => 111 + 1.2 * (m - 55),
		(m) => 117 + 0.8 * (m - 60),
		(m) => 121 + (m - 65),
		(m) => 126 + 0.8 * (m - 70),
		(m) => 130 + (m - 75),
		(m) => 135 + (m - 80)
    ], // Conf 1 + F
    [
        () => 100, // TODO: Conf 2 isn't included in FCOM operating speeds so can't be calculated, used 50% between 1+F and conf 3
        (m) => 100 + 0.6 * (m - 45),
        (m) => 103 + (m - 50),
        (m) => 108 + (m - 55),
        (m) => 113 + (m - 60),
        (m) => 118 + 0.8 * (m - 65),
        (m) => 122 + 1.2 * (m - 70),
        (m) => 128 + 0.6 * (m - 75),
        (m) => 131 + (m - 80)
    ], // Conf 2
    [
        () => 94,
        (m) => 94 + 1.2 * (m - 45),
        (m) => 100 + (m - 50),
        (m) => 105 + 0.8 * (m - 55),
        (m) => 109 + (m - 60),
        (m) => 114 + 0.8 * (m - 65),
        (m) => 118 + 0.8 * (m - 70),
        (m) => 122 + 0.8 * (m - 75),
        (m) => 126 + 0.8 * (m - 80)
    ] // Conf 3
];

// Hacky numbers used to approximate flex temp
const maxTOWeightAt40Degrees = 75000;
const maxTOWeightAt68Degrees = 52500;

export default class TakeoffCalculator {
	/**
	 * Return the VSpeeds for the given conditions
	 * @param weight Aircraft weight in kgs
	 * @param flaps
	 * @param temperature OAT in °C
	 * @param pressure Air pressure in mb
	 * @param windDirection Direction wind is coming from relative to north
	 * @param windMagnitude Wind magnitude in kts
	 * @param runwayHeading
	 */
	public calculateTakeoffPerformance(weight: number, flaps: TakeoffFlapsConfig, temperature: number, pressure: number,
		windDirection: number, windMagnitude: number, runwayHeading: number): { v1: number, vr: number, v2: number, flexTemp: number | null } {

		let weightTons = weight / 1000;
		let altitude = 0;

		let v2 = this.getV2(weightTons, flaps, altitude, temperature, pressure, windDirection, windMagnitude, runwayHeading);
		let vr = v2 - 4;
		let v1 = v2 - 5;

		let flexTemp: number | null = this.getFlexTemp(weight);

		if (flexTemp == null || flexTemp <= temperature) {
			flexTemp = null;
		}

		return {
			v1,
			vr,
			v2,
			flexTemp
		};
	};

	/**
	 * Calculates V2 for the given conditions
	 * @param weightTons Aircraft weight in tons
	 * @param flaps
	 * @param altitude
	 * @param temperature OAT in °C
	 * @param windDirection Direction wind is coming from relative to north
	 * @param windMagnitude Wind magnitude in kts
	 * @param runwayHeading
	 */
	private getV2(weightTons: number, flaps: TakeoffFlapsConfig, altitude: number, temperature: number, pressure: number,
		windDirection: number, windMagnitude: number, runwayHeading: number): number {

		let pressureAltitude = this.getPressureAltitude(pressure);

		let stallSpeed = stallSpeeds[flaps][this.getTakeoffTableIndex(weightTons)](weightTons);
		let vmuVmcaMinV2 = Math.floor(vmuVmcaMinV2Speeds[flaps][this.getTakeoffTableIndex(weightTons)](weightTons));
		let vmcgVmcaMinV2 = this.getMinSpeedFromPressureAltitudeTable(pressureAltitude, flaps, vmcgVmcaMinV2Speeds, vrV2PressureAltitudeIndexes);

		let v2 = Math.max(stallSpeed * 1.13, vmuVmcaMinV2, vmcgVmcaMinV2);

		return Math.round(v2);
	}

	/**
	 * Find the temperature at which our current weight is the maximum allowed TOW
	 * This is then the flex takeoff temp
	 * @param weight Weight in tons
	 */
	private getFlexTemp(weight: number): number | null {
		if (weight < maxTOWeightAt68Degrees) {
			return 68;
		}
		if (weight > maxTOWeightAt40Degrees) {
			return null;
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
	 * Converts a given pressure to equivilant pressure altitude
	 * @param pressure Pressure in mb
	 * @returns Pressure altitude in feet
	 */
	private getPressureAltitude(pressure: number): number {
		// See https://en.wikipedia.org/wiki/Pressure_altitude
		return 145366.45 * (1 - Math.pow(pressure / 1013.25, 0.190284));
	}

	/**
	 * Gets the min speed from a pressure altitude table (`vmcgVmcaMinV1Speeds`, `vmcgVmcaMinVrSpeeds` or `vmcgVmcaMinV2Speeds`)
	 * @param pressureAltitude Pressure altitude in feet
	 * @param flaps
	 * @param table The speed table
	 * @param altitudeIndexes Altitude "headings" for the table, indexes match table and from smallest to largest
	 */
	private getMinSpeedFromPressureAltitudeTable(pressureAltitude: number, flaps: TakeoffFlapsConfig, table: number[][], altitudeIndexes: number[]): number {
		let data = table[flaps];

		let previousAltitude = altitudeIndexes[0];
		let previousValue = data[0];

		if (pressureAltitude < previousAltitude) {
			return previousValue;
		}

		for (let i = 0; i < data.length; i++) {
			let currentAltitude = altitudeIndexes[i];
			let currentValue = data[i];
			if (currentAltitude > pressureAltitude) {
				return previousValue + (currentValue - previousValue) * ((pressureAltitude - previousAltitude) / (currentAltitude - previousAltitude));
			}
			previousAltitude = currentAltitude;
			previousValue = currentValue;
		}
		return data[data.length - 1];
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
}
