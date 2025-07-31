import { MathUtils } from '@microsoft/msfs-sdk';

export class A380AltitudeUtils {
  /**
   * Calculates the recommended maximum altitude for the A380-842.
   * @param gw Gross weight in kilograms.
   * @param disa ISA delta temperature in °C.
   * @param round The quantum to round the result to, default 500 feet.
   * @returns The recommended maximum altitude in feet.
   */
  static calculateRecommendedMaxAltitude(gw: number, disa: number, round = 500) {
    return MathUtils.round(
      52442 -
        1.24194943e-2 * gw -
        3.50813174e-8 * gw ** 2 -
        53.7792269 * disa -
        1.87989779e-4 * gw * disa -
        4.46181779 * disa ** 2,
      round,
    );
  }

  /**
   * Returns the ISA temperature for a given altitude
   * @param alt altitude in ft
   * @returns ISA temp in C°
   */
  static getIsaTemp(alt: Feet) {
    return Math.min(alt, 36089) * -0.0019812 + 15;
  }

  /**
   * Returns the deviation from ISA temperature and OAT at given altitude
   * @param alt altitude in ft
   * @returns ISA temp deviation from OAT in C°
   */
  static getIsaTempDeviation(alt = Simplane.getAltitude(), sat = Simplane.getAmbientTemperature()) {
    return sat - this.getIsaTemp(alt);
  }
}
