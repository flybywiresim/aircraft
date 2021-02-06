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

 // TODO: Factor temperature into V1 calculation
 // TODO: Adjust v-speeds for tail/head wind

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
 * Stall speed table
 * calls function(gross weight (t), landing gear) which returns CAS.
 * Indexes: 0 - Config 1 + F, 1 - Config 2, 2 - Config 3, 3 - Config Full
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
const vs = [
	[
        () => 93,
        (m) => 93 + m - 40,
        (m) => 98 + m - 45,
        (m) => 103 + m - 50,
        (m) => 108 + .8 * (m - 55),
        (m) => 112 + m - 60,
        (m) => 117 + .8 + (m - 65),
        (m) => 121 + .8 + (m - 70),
        (m) => 125 + m - 75,
        () => 130
    ], // Conf 1 + F
    [
        () => 91,
        (m) => 91 + m - 40,
        (m) => 96 + m - 45,
        (m) => 101 + .8 * (m - 50),
        (m) => 105 + m - 55,
        (m) => 110 + .8 * (m - 60),
        (m) => 114 + m - 65,
        (m) => 119 + .6 * (m - 70),
        (m) => 122 + .8 * (m - 75),
        () => 126
    ], // Conf 2
    [
        (_, ldg) => 91 - ldg * 2,
        (m, ldg) => 91 + m - 40 - ldg * 2,
        (m, ldg) => 96 + m - 45 - ldg * 2,
        (m, ldg) => 101 + .8 * (m - 50) - ldg * 2,
        (m, ldg) => 105 + m - 55 - ldg * 2,
        (m, ldg) => 110 + .8 * (m - 60) - ldg * 2,
        (m, ldg) => 114 + m - 65 - ldg * 2,
        (m, ldg) => 119 + .6 * (m - 70) - ldg * 2,
        (m, ldg) => 122 + .8 * (m - 75) - ldg * 2,
        (_, ldg) => 126 - ldg * 2
    ], // Conf 3
    [
        () => 84,
        (m) => 84 + .8 * (m - 40),
        (m) => 88 + m - 45,
        (m) => 93 + .8 * (m - 50),
        (m) => 97 + .8 * (m - 55),
        (m) => 101 + .8 * (m - 60),
        (m) => 105 + .8 * (m - 65),
        (m) => 109 + .8 * (m - 70),
        (m) => 113 + .6 * (m - 75),
        () => 116
    ] // Conf Full
];

function getVDist(V: number, m: number, b: number, T: number): number {
	return distanceAtAccelTime(timeAtAccelVelocity(V, m, b, T), T, m, b);
}

function getBrakingDistance(V: number, m: number, B: number): number {
	return (m * (V ** 2)) / (2 * B);
}

function distanceAtAccelTime(t: number, T: number, m: number, b: number): number {
	return 2 * T * ((m * (Math.E ** ((-b * t)/m)) - m) / b**2 + t / b);
}

function timeAtAccelVelocity(V: number, m: number, b: number, T: number): number {
	return (-m * Math.log(1 - ((V * b) / (2 * T)))) / b;
}

// Coefficient of drag for each flap configuration
const cdFlaps = [
	1671.16, // 1 + F
	1825.18, // 2
	1956.1 // 3
]

// Max thrust output of single engine in Newtons
const tMax = 120640;

// Braking force in Newtons
const brakeForce = 135000;

// Percentage safety margin over stall speed, usually determined by airport.
// 1.05 = 5% margin
const stallSafetyMargin = 1.05;

// Knots to m/s
const knotsToMS = 0.51444444

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
	 * @param runwayLength Runway length in meters
	 */
	public calculateTakeoffPerformance(weight: number, flaps: TakeoffFlapsConfig, temperature: number, pressure: number,
		windDirection: number, windMagnitude: number, runwayHeading: number, runwayLength: number, altitude: number):
		{ v1: number, vr: number, v2: number, runwayTooShort: boolean, v1Dist: number, rtoDist: number } {

		let weightTons = weight / 1000;

		let pressureAltitude = altitude + this.getPressureAltitude(pressure);

		let v2 = this.getV2(weightTons, flaps, pressureAltitude, temperature, pressure, windDirection, windMagnitude, runwayHeading);
		let vr = this.getVr(weightTons, flaps, pressureAltitude, temperature, pressure, windDirection, windMagnitude, runwayHeading)
		let v1Data = this.getV1(weightTons, flaps, pressureAltitude, temperature, windDirection, windMagnitude, runwayHeading, runwayLength, vr);

		let v1 = v1Data.v1;

		if (!v1Data.valid) {
			vr = 0;
			v2 = 0;
		} else {
			vr = v1 > vr ? v1 : vr; // vr must be >= v1
			v2 = vr > v2 ? vr : v2; // v2 must be >= vr
		}

		return {
			v1,
			vr,
			v2,
			v1Dist: v1Data.v1Dist,
			rtoDist: v1Data.rtoDist,
			runwayTooShort: !v1Data.valid
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
	private getV2(weightTons: number, flaps: TakeoffFlapsConfig, pressureAltitude: number, temperature: number, pressure: number,
		windDirection: number, windMagnitude: number, runwayHeading: number): number {

		let stallSpeed = vs[flaps][this.getTakeoffTableIndex(weightTons)](weightTons, true);
		let vmuVmcaMinV2 = Math.floor(vmuVmcaMinV2Speeds[flaps][this.getTakeoffTableIndex(weightTons)](weightTons));
		let vmcgVmcaMinV2 = this.getMinSpeedFromPressureAltitudeTable(pressureAltitude, flaps, vmcgVmcaMinV2Speeds, vrV2PressureAltitudeIndexes);

		return Math.max(stallSpeed * 1.13, vmuVmcaMinV2, vmcgVmcaMinV2);
	}

	/**
	 * Calculates VR for the given conditions
	 * @param weightTons Aircraft weight in tons
	 * @param flaps
	 * @param altitude
	 * @param temperature OAT in °C
	 * @param windDirection Direction wind is coming from relative to north
	 * @param windMagnitude Wind magnitude in kts
	 * @param runwayHeading
	 */
	private getVr(weightTons: number, flaps: TakeoffFlapsConfig, pressureAltitude: number, temperature: number, pressure: number,
		windDirection: number, windMagnitude: number, runwayHeading: number): number {

		let stallSpeed = vs[flaps][this.getTakeoffTableIndex(weightTons)](weightTons, true);
		let vmcgVmcaMinVr = this.getMinSpeedFromPressureAltitudeTable(pressureAltitude, flaps, vmcgVmcaMinVrSpeeds, vrV2PressureAltitudeIndexes);

		return Math.max(stallSpeed * stallSafetyMargin, vmcgVmcaMinVr);
	}

	private getV1(weightTons: number, flaps: TakeoffFlapsConfig, pressureAltitude: number, temperature: number,
		windDirection: number, windMagnitude: number, runwayHeading: number, runwayLength: number, targetVr: number): { v1: number, v1Dist: number, brakeDist: number, rtoDist: number, valid: boolean } {

		let stallSpeed = Math.round(vs[flaps][this.getTakeoffTableIndex(weightTons)](weightTons, true) * knotsToMS * stallSafetyMargin);
		let vmcgVmcaMinV1 = this.getMinSpeedFromPressureAltitudeTable(pressureAltitude, flaps, vmcgVmcaMinV1Speeds, v1PressureAltitudeIndexes) * knotsToMS;

		let minV1Speed = Math.max(stallSpeed, vmcgVmcaMinV1);

		let pressure = this.altitudeToPressure(pressureAltitude);
		let pressurePascals = pressure * 100;
		let temperatureKelvin = temperature + 273.15;

		let airDensity = pressurePascals / (287.058 * temperatureKelvin);

		let b = cdFlaps[flaps] * airDensity;

		let thrust = tMax;
		if (airDensity < 1.2985) {
			thrust *= (airDensity / 1.2985);
		}

		let mass = weightTons * 1000;

		let v1 = minV1Speed;
		let v1Dist: number = getVDist(minV1Speed, mass, b, thrust);
		let brakeDist: number = getBrakingDistance(minV1Speed, mass, brakeForce);

		if (v1Dist + brakeDist > runwayLength) {
			return {
				v1: 0,
				v1Dist: v1Dist,
				brakeDist: brakeDist,
				rtoDist: v1Dist + brakeDist,
				valid: false
			}
		}


		for (let candidateSpeed = stallSpeed + 0.5; candidateSpeed <= targetVr * knotsToMS; candidateSpeed += 0.5) {
			let candidateVDist = getVDist(candidateSpeed, mass, b, thrust);
			let candidateBrakeDist = getBrakingDistance(candidateSpeed, mass, brakeForce);

			if (candidateVDist + candidateBrakeDist > runwayLength) {
				break;
			} else {
				v1 = candidateSpeed;
				v1Dist = candidateVDist;
				brakeDist = candidateBrakeDist;
			}
		}

		let v1Knots = v1 / knotsToMS;
		let windCorrection = this.getWindOffset(windDirection, windMagnitude, runwayHeading);

		if (v1Knots + windCorrection < minV1Speed) {
			windCorrection = 0
		}

		return {
			v1: v1Knots + windCorrection,
			v1Dist,
			brakeDist,
			rtoDist: v1Dist + brakeDist,
			valid: true
		}
	}

	/**
	 * Returns an offset for the takeoff speed
	 * Approximation based on tail wind calculation with fixed change per 10kts
	 * Offset based off average change in example RTOW charts from FCOM
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
	 * Inverse of getPressureAltitude. Gets ISA standard pressure (mb) from altitude
	 * @param altitude Altitude ASL in feet
	 */
	private altitudeToPressure(altitude: number): number {
		return 1013.25 * (1- (altitude / 145366.45) )**5.2553026
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
