import { MathUtils } from '@flybywiresim/fbw-sdk';
import { WindEntry } from '../../../flightplanning/data/wind';
import { ConsumerValue, EventBus, Vec2Math } from '@microsoft/msfs-sdk';
import { NavigationEvents } from '@fmgc/navigation/Navigation';

export type WindMeasurement = WindEntry;

export class WindObserver {
  private readonly sub = this.bus.getSubscriber<NavigationEvents>();

  private readonly windDirection = ConsumerValue.create(this.sub.on('fms_nav_wind_direction'), null);

  private readonly windSpeed = ConsumerValue.create(this.sub.on('fms_nav_wind_speed'), null);

  private readonly altitude = ConsumerValue.create(this.sub.on('fms_nav_pressure_altitude'), null);

  constructor(private readonly bus: EventBus) {}

  get(result: WindMeasurement): WindMeasurement | null {
    const windDirection = this.windDirection.get();
    const windSpeed = this.windSpeed.get();
    const altitude = this.altitude.get();

    if (windDirection === null || windSpeed === null || altitude === null) {
      return null;
    }

    result.altitude = altitude;
    Vec2Math.setFromPolar(windSpeed, windDirection * MathUtils.DEGREES_TO_RADIANS, result.vector);

    return result;
  }
}
