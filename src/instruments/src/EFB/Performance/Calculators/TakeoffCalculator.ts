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

import { getTailWind } from '../Calculators/CommonCalculations';

export enum TakeoffFlapsConfig {
	Conf1F,
	Conf2,
	Conf3
}

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

// Hacky numbers used to approximate flex temp
const maxTOWeightAt40Degrees = 75000;
const maxTOWeightAt68Degrees = 52500;

const invalidValueDisplay: string = "---";

export default class TakeoffCalculator {
	/**
	 * Return the VSpeeds for the given conditions
	 * @param weight Aircraft weight in kgs
	 * @param flaps
	 * @param temperature OAT in °C
	 * @param windDirection Direction wind is coming from relative to north
	 * @param windMagnitude Wind magnitude in kts
	 * @param runwayHeading
	 */
	public calculateTakeoffPerformance(weight: number, flaps: TakeoffFlapsConfig, temperature: number, windDirection: number,
		windMagnitude: number, runwayHeading: number): { v1: number, vr: number, v2: number, flexTemp: number | null } {

		let weightTons = weight / 1000;
		let altitude = 0;

		let v2 = this.getV2(weightTons, flaps, altitude, temperature, windDirection, windMagnitude, runwayHeading);
		let vr = v2 - 4;
		let v1 = v2 - 5;

		let flexTemp: number | null = this.getFlexTemp(weight);

		if (flexTemp <= temperature) {
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
	private getV2(weightTons: number, flaps: TakeoffFlapsConfig, altitude: number, temperature: number,
		windDirection: number, windMagnitude: number, runwayHeading: number): number {

		let v2 = Math.floor(takeoffV2Speeds[flaps][this.getTakeoffTableIndex(weightTons)](weightTons) + (flaps === 1 ? (Math.abs(altitude * 0.0002)) : 0));

		v2 += this.getTemperatureOffset(v2, temperature)
		v2 += this.getWindOffset(windDirection, windMagnitude, runwayHeading);

		return Math.round(v2);;
	}

	/**
	 * Find the temperature at which our current weight is the maximum allowed TOW
	 * This is then the flex takeoff temp
	 * @param weight Weight in tons
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
}
