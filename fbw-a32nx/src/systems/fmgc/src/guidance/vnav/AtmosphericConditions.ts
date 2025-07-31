// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { Common } from './common';

export class AtmosphericConditions {
  private ambientTemperatureFromSim: Celsius;

  private altitudeFromSim: Feet;

  private casFromSim: Knots;

  private tasFromSim: Knots;

  private windSpeedFromSim: Knots;

  private windDirectionFromSim: DegreesTrue;

  private computedIsaDeviation: Celsius;

  private pressureAltFromSim: Feet;

  constructor(private observer: VerticalProfileComputationParametersObserver) {
    this.update();
  }

  // FIXME this data should come from the FMS navigation function (NavigationEvents on the bus)
  update() {
    this.ambientTemperatureFromSim = SimVar.GetSimVarValue('AMBIENT TEMPERATURE', 'celsius');
    this.altitudeFromSim = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
    this.tasFromSim = SimVar.GetSimVarValue('AIRSPEED TRUE', 'knots');
    this.casFromSim = SimVar.GetSimVarValue('AIRSPEED INDICATED', 'knots');
    // TODO filter?
    this.windSpeedFromSim = SimVar.GetSimVarValue('AMBIENT WIND VELOCITY', 'Knots');
    this.windDirectionFromSim = SimVar.GetSimVarValue('AMBIENT WIND DIRECTION', 'Degrees');
    // This is what the AP uses
    this.pressureAltFromSim = SimVar.GetSimVarValue('INDICATED ALTITUDE:4', 'feet');

    this.computedIsaDeviation = this.ambientTemperatureFromSim - Common.getIsaTemp(this.altitudeFromSim);
  }

  get currentStaticAirTemperature(): Celsius {
    return this.ambientTemperatureFromSim;
  }

  get currentAltitude(): Feet {
    return this.altitudeFromSim;
  }

  get currentAirspeed(): Knots {
    return this.casFromSim;
  }

  get currentTrueAirspeed(): Knots {
    return this.tasFromSim;
  }

  get currentWindSpeed(): Knots {
    return this.windSpeedFromSim;
  }

  get currentWindDirection(): DegreesTrue {
    return this.windDirectionFromSim;
  }

  get currentPressureAltitude(): Feet {
    return this.pressureAltFromSim;
  }

  getCurrentWindVelocityComponent(direction: DegreesTrue): Knots {
    return Math.cos(Avionics.Utils.diffAngle(direction, this.currentWindDirection)) * this.currentWindSpeed;
  }

  get isaDeviation(): Celsius {
    return this.computedIsaDeviation;
  }

  private get tropoPause(): Feet {
    return this.observer.get().tropoPause;
  }

  predictStaticAirTemperatureAtAltitude(altitude: Feet): number {
    return Common.getIsaTemp(altitude, altitude > this.tropoPause) + this.isaDeviation;
  }

  totalAirTemperatureFromMach(altitude: Feet, mach: number) {
    // From https://en.wikipedia.org/wiki/Total_air_temperature, using gamma = 1.4
    return (this.predictStaticAirTemperatureAtAltitude(altitude) + 273.15) * (1 + 0.2 * mach ** 2) - 273.15;
  }

  computeMachFromCas(altitude: Feet, speed: Knots): number {
    const delta = Common.getDelta(altitude, altitude > this.tropoPause);

    return Common.CAStoMach(speed, delta);
  }

  computeCasFromMach(altitude: Feet, mach: Mach): number {
    const delta = Common.getDelta(altitude, altitude > this.tropoPause);

    return Common.machToCas(mach, delta);
  }

  computeCasFromTas(altitude: Feet, speed: Knots): Knots {
    const theta = Common.getTheta(altitude, this.isaDeviation, altitude > this.tropoPause);
    const delta = Common.getDelta(altitude, altitude > this.tropoPause);

    return Common.TAStoCAS(speed, theta, delta);
  }

  computeTasFromCas(altitude: Feet, speed: Knots): Knots {
    const theta = Common.getTheta(altitude, this.isaDeviation, altitude > this.tropoPause);
    const delta = Common.getDelta(altitude, altitude > this.tropoPause);

    return Common.CAStoTAS(speed, theta, delta);
  }

  /**
   * Returns a Mach number if the CAS is taken above crossover altitude.
   * @param cas The corrected airspeed
   * @param mach The Mach number which will be used if it is lower than the Mach number corresponding ot `cas`.
   * @param altitude The altitude at which to perform the conversion
   * @returns
   */
  casOrMach(cas: Knots, mach: Mach, altitude: Feet): Knots | Mach {
    const machAsIas = this.computeCasFromMach(altitude, mach);

    if (cas > machAsIas) {
      return mach;
    }

    return cas;
  }
}
