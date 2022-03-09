//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Common } from './common';

export class AtmosphericConditions {
    private ambientTemperatureFromSim: Celcius;

    private altitudeFromSim: Feet;

    private casFromSim: Knots;

    private computedIsaDeviation: Celcius;

    private pressureAltFromSim: Feet;

    constructor(private tropoPause: Feet) {
        this.update();
    }

    update() {
        this.ambientTemperatureFromSim = SimVar.GetSimVarValue('AMBIENT TEMPERATURE', 'celsius');
        this.altitudeFromSim = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
        this.casFromSim = this.computeCasFromTas(this.altitudeFromSim, SimVar.GetSimVarValue('AIRSPEED TRUE', 'knots'));
        this.pressureAltFromSim = SimVar.GetSimVarValue('PRESSURE ALTITUDE', 'feet');

        this.computedIsaDeviation = this.ambientTemperatureFromSim - Common.getIsaTemp(this.altitudeFromSim);
    }

    get currentStaticAirTemperature(): Celcius {
        return this.ambientTemperatureFromSim;
    }

    get currentAltitude(): Feet {
        return this.altitudeFromSim;
    }

    get currentAirspeed(): Knots {
        return this.casFromSim;
    }

    get isaDeviation(): Celcius {
        return this.computedIsaDeviation;
    }

    predictStaticAirTemperatureAtAltitude(altitude: Feet): number {
        return Common.getIsaTemp(altitude, altitude > this.tropoPause) + this.isaDeviation;
    }

    totalAirTemperatureFromMach(altitude: Feet, mach: number) {
        // From https://en.wikipedia.org/wiki/Total_air_temperature, using gamma = 1.4
        return (this.predictStaticAirTemperatureAtAltitude(altitude) + 273.15) * (1 + 0.2 * mach ** 2) - 273.15;
    }

    computeMachFromCas(altitude: Feet, speed: Knots): number {
        const deltaSrs = Common.getDelta(altitude, altitude > this.tropoPause);

        return Common.CAStoMach(speed, deltaSrs);
    }

    computeCasFromMach(altitude: Feet, mach: Mach): number {
        const deltaSrs = Common.getDelta(altitude, altitude > this.tropoPause);

        return Common.machToCas(mach, deltaSrs);
    }

    computeCasFromTas(altitude: Feet, speed: Knots): Knots {
        const thetaSrs = Common.getTheta(altitude, this.isaDeviation, altitude > this.tropoPause);
        const deltaSrs = Common.getDelta(altitude, altitude > this.tropoPause);

        return Common.TAStoCAS(speed, thetaSrs, deltaSrs);
    }

    computeTasFromCas(altitude: Feet, speed: Knots): Knots {
        const thetaSrs = Common.getTheta(altitude, this.isaDeviation, altitude > this.tropoPause);
        const deltaSrs = Common.getDelta(altitude, altitude > this.tropoPause);

        return Common.CAStoTAS(speed, thetaSrs, deltaSrs);
    }

    /**
     * Computes the ambient pressure measured at the static ports that was used to compute the indicated altitude.
     * @param altitude An indicated altitude
     * @param qnh The QNH setting at which the indicated altitude is measured
     * @returns The estimated ambient pressure based on the indicated altitude for this QNH setting
     */
    private estimateAmbientPressure(altitude: Feet, qnh: Millibar): Millibar {
        return qnh * (1 - altitude / 145442.15) ** (1 / 0.190263);
    }

    /**
     * Computes the pressure altitude for a given ambient pressure. The pressure altitude is the altitude that would be indicated if the QNH was set to 1013.
     * @param pressure The ambient pressure
     * @returns
     */
    private computePressureAltitude(pressure: Millibar): Feet {
        // Equation from Boeing Jet Transport Performance Methods document
        return 145442.15 * (1 - ((pressure / 1013.25) ** 0.190263));
    }

    /**
     * Estimates what the pressure altitude would be at a given altitude that was indicated for some QNH setting.
     * If the QNH setting is 1013, the returned pressure altitude is the same as the indicated one
     * @param altitude The indicated altitude to be converted to a pressure altitude
     * @param qnh The QNH setting at which the indicated altitude is measured
     * @returns
     */
    estimatePressureAltitude(altitude: Feet, qnh: Millibar) {
        const ambientPressure = this.estimateAmbientPressure(altitude, qnh);
        return this.computePressureAltitude(ambientPressure);
    }

    /**
     * This is a hack because the QNH setting is a bit broken in MSFS as of 09/03/22.
     * For now, we just linearly extrapolate the pressure altitude based on the linear deviation
     * @param altitude The indicated altitude at which to estimate the pressure altitude
     */
    estimatePressureAltitudeInMsfs(altitude: Feet) {
        // We add 2000 to avoid a division by zero
        return this.pressureAltFromSim * (2000 + altitude) / (2000 + this.altitudeFromSim);
    }
}
