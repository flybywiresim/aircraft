import { ConsumerSubject, EventBus, Vec2Math } from '@microsoft/msfs-sdk';
import { NavigationEvents } from '../navigation/Navigation';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { debugFormatWindEntry, WindEntry } from '../flightplanning/data/wind';
import { FlightPlan } from '../flightplanning/plans/FlightPlan';

export class HistoryWind {
  private readonly sub = this.bus.getSubscriber<NavigationEvents>();

  private previousAltitude: number | null = null;

  private readonly altitude = ConsumerSubject.create(this.sub.on('fms_nav_pressure_altitude').atFrequency(1), null);
  private readonly windDirection = ConsumerSubject.create(this.sub.on('fms_nav_wind_direction'), null);
  private readonly windSpeed = ConsumerSubject.create(this.sub.on('fms_nav_wind_speed'), null);

  private readonly climbWinds: Map<number, WindEntry> = new Map();

  /** The altitudes at which winds are recorded on the descent. Winds will also be recorded at the T/C */
  private readonly DefaultRecordedAltitudes = [5000, 15_000, 25_000, 35_000];

  private previousCruiseAltitude: number | null = null;

  constructor(
    private readonly bus: EventBus,
    private readonly activePlan: FlightPlan,
  ) {
    this.altitude.sub(this.handleAltitudeChange.bind(this));
  }

  private handleAltitudeChange(currentAltitude: number | null) {
    const currentWindSpeed = this.windSpeed.get();
    const currentWindDirection = this.windDirection.get();

    if (
      currentAltitude !== null &&
      this.previousAltitude !== null &&
      currentWindDirection !== null &&
      currentWindSpeed !== null
    ) {
      for (const recordedAlt of this.DefaultRecordedAltitudes) {
        if (currentAltitude <= recordedAlt && this.previousAltitude > recordedAlt) {
          const windEntry = {
            altitude: recordedAlt,
            vector: Vec2Math.setFromPolar(
              currentWindSpeed,
              currentWindDirection * MathUtils.DEGREES_TO_RADIANS,
              Vec2Math.create(),
            ),
          };

          console.log(`[FMS/History Winds] Recording wind ${debugFormatWindEntry(windEntry)}`);
          this.climbWinds.set(recordedAlt, windEntry);
        }
      }

      const cruiseLevel = this.activePlan.performanceData.cruiseFlightLevel.get();
      if (cruiseLevel !== null) {
        const cruiseAltitude = cruiseLevel * 100;

        if (currentAltitude <= cruiseAltitude && this.previousAltitude > cruiseAltitude) {
          const windEntry = {
            altitude: cruiseAltitude,
            vector: Vec2Math.setFromPolar(
              currentWindSpeed,
              currentWindDirection * MathUtils.DEGREES_TO_RADIANS,
              Vec2Math.create(),
            ),
          };

          console.log(`[FMS/History Winds] Recording wind ${debugFormatWindEntry(windEntry)}`);
          this.climbWinds.set(cruiseAltitude, windEntry);
          this.previousCruiseAltitude = cruiseAltitude;
        }
      }
    }

    this.previousAltitude = currentAltitude;
  }

  public getClimbWinds(): WindEntry[] {
    return [...this.climbWinds.values()];
  }
}
