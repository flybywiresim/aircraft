import { Arinc429Register, MathUtils } from '@flybywiresim/fbw-sdk';
import { WindEntry } from '../../../flightplanning/data/wind';
import { Vec2Math } from '@microsoft/msfs-sdk';

export type WindMeasurement = WindEntry;

export class WindObserver {
  private readonly register: Arinc429Register = Arinc429Register.empty();

  get(result: WindMeasurement): WindMeasurement | null {
    for (let i = 1; i <= 3; i++) {
      this.register.setFromSimVar(`L:A32NX_ADIRS_IR_${i}_WIND_DIRECTION`);
      if (this.register.isNoComputedData() || this.register.isFailureWarning()) continue;
      const windDirection = this.register.value;

      this.register.setFromSimVar(`L:A32NX_ADIRS_IR_${i}_WIND_SPEED`);
      if (this.register.isNoComputedData() || this.register.isFailureWarning()) continue;
      const windSpeed = this.register.value;

      this.register.setFromSimVar(`L:A32NX_ADIRS_ADR_${i}_ALTITUDE`);
      if (this.register.isNoComputedData() || this.register.isFailureWarning()) continue;

      result.altitude = this.register.value;
      Vec2Math.setFromPolar(windSpeed, windDirection * MathUtils.DEGREES_TO_RADIANS, result.vector);

      return result;
    }

    return null;
  }
}
