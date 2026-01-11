import { ConsumerSubject, EventBus, Vec2Math } from '@microsoft/msfs-sdk';
import { NavigationEvents } from '../navigation/Navigation';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { debugFormatWindEntry, WindEntry } from '../flightplanning/data/wind';
import { FlightPlan } from '../flightplanning/plans/FlightPlan';
import { FlightPhaseManagerEvents } from '../flightphase';
import { FmgcFlightPhase } from '../../../shared/src/flightphase';
import { WindUtils } from '../guidance/vnav/wind/WindUtils';

export class HistoryWind {
  private readonly sub = this.bus.getSubscriber<NavigationEvents & FlightPhaseManagerEvents>();

  private previousAltitude: number | null = null;

  private readonly altitude = ConsumerSubject.create(this.sub.on('fms_nav_pressure_altitude').atFrequency(1), null);
  private readonly windDirection = ConsumerSubject.create(this.sub.on('fms_nav_wind_direction'), null);
  private readonly windSpeed = ConsumerSubject.create(this.sub.on('fms_nav_wind_speed'), null);

  private readonly RecordedWindCache: WindEntry[] = [
    { altitude: 5_000, vector: Vec2Math.create() },
    { altitude: 15_000, vector: Vec2Math.create() },
    { altitude: 25_000, vector: Vec2Math.create() },
    { altitude: 35_000, vector: Vec2Math.create() },
  ] as const;
  private readonly cruiseWind = { altitude: NaN, vector: Vec2Math.create() };
  private readonly interpolationCache = { altitude: NaN, vector: Vec2Math.create() };

  // private readonly historyWinds: (WindEntry | null)[] = [null, null, null, null, null];
  // TODO for debugging only
  private readonly historyWinds: (WindEntry | null)[] = [
    { altitude: 5_000, vector: Vec2Math.setFromPolar(20, 50 * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()) },
    { altitude: 15_000, vector: Vec2Math.setFromPolar(30, 70 * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()) },
    { altitude: 25_000, vector: Vec2Math.setFromPolar(35, 70 * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()) },
    { altitude: 35_000, vector: Vec2Math.setFromPolar(45, 65 * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()) },
    { altitude: 37_000, vector: Vec2Math.setFromPolar(45, 65 * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()) },
  ];

  private flightPhase = FmgcFlightPhase.Preflight;

  constructor(
    private readonly bus: EventBus,
    private readonly activePlan: FlightPlan,
  ) {
    this.altitude.sub(this.handleAltitudeChange.bind(this));
    this.sub.on('fmgc_flight_phase').handle((newPhase) => {
      if (this.flightPhase === FmgcFlightPhase.Preflight && newPhase !== FmgcFlightPhase.Preflight) {
        this.resetRecordedWinds();
      }

      this.flightPhase = newPhase;
    });
  }

  private handleAltitudeChange(currentAltitude: number | null) {
    const windSpeed = this.windSpeed.get();
    const windDirection = this.windDirection.get();

    if (currentAltitude !== null && this.previousAltitude !== null && windDirection !== null && windSpeed !== null) {
      for (let i = 0; i < this.RecordedWindCache.length; i++) {
        const windEntry = this.RecordedWindCache[i];
        const recordedAlt = windEntry.altitude;

        if (currentAltitude <= recordedAlt && this.previousAltitude > recordedAlt) {
          Vec2Math.setFromPolar(windSpeed, windDirection * MathUtils.DEGREES_TO_RADIANS, windEntry.vector);
          this.historyWinds[i] = windEntry;

          console.log(`[FMS/History Winds] Recording wind ${debugFormatWindEntry(windEntry)}`);
        }
      }

      const cruiseLevel = this.activePlan.performanceData.cruiseFlightLevel.get();
      if (cruiseLevel !== null) {
        const cruiseAltitude = cruiseLevel * 100;
        const cruiseAltAlreadyExists = this.historyWinds.some(
          (wind) => wind !== null && wind.altitude === cruiseAltitude,
        );

        if (!cruiseAltAlreadyExists && currentAltitude <= cruiseAltitude && this.previousAltitude > cruiseAltitude) {
          this.cruiseWind.altitude = cruiseAltitude;
          Vec2Math.setFromPolar(windSpeed, windDirection * MathUtils.DEGREES_TO_RADIANS, this.cruiseWind.vector);

          this.historyWinds[this.RecordedWindCache.length] = this.cruiseWind;

          console.log(`[FMS/History Winds] Recording wind ${debugFormatWindEntry(this.cruiseWind)}`);
        }
      }
    }

    this.previousAltitude = currentAltitude;
  }

  private resetRecordedWinds() {
    for (let i = 0; i < this.historyWinds.length; i++) {
      this.historyWinds[i] = null;
    }
  }

  public getRecordedWinds(cruiseLevel: number | null): Readonly<WindEntry>[] {
    const hasRecordedCruiseWind = this.historyWinds[this.historyWinds.length - 1] !== null;
    const filtered = this.historyWinds.filter((wind) => wind !== null).sort((a, b) => a.altitude - b.altitude);

    if (cruiseLevel !== null && filtered.length >= 0) {
      const cruiseAltitude = cruiseLevel * 100;

      this.interpolationCache.altitude = cruiseAltitude;
      WindUtils.interpolateWindEntries(filtered, cruiseAltitude, this.interpolationCache.vector);

      if (hasRecordedCruiseWind) {
        filtered[filtered.length - 1] = this.interpolationCache;
      } else {
        filtered.push(this.interpolationCache);
      }
    }

    return filtered.sort((a, b) => a.altitude - b.altitude);
  }
}
