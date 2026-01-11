import { ConsumerSubject, EventBus, Vec2Math } from '@microsoft/msfs-sdk';
import { NavigationEvents } from '../navigation/Navigation';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { WindEntry } from '../flightplanning/data/wind';
import { FlightPlan } from '../flightplanning/plans/FlightPlan';
import { FlightPhaseManagerEvents } from '../flightphase';
import { FmgcFlightPhase } from '../../../shared/src/flightphase';
import { WindUtils } from '../guidance/vnav/wind/WindUtils';

export class HistoryWind {
  private static readonly LOCALSTORAGE_KEY: string = 'A32NX.HistoryWinds';

  private readonly sub = this.bus.getSubscriber<NavigationEvents & FlightPhaseManagerEvents>();

  private previousAltitude: number | null = null;

  private readonly altitude = ConsumerSubject.create(this.sub.on('fms_nav_pressure_altitude').atFrequency(1), null);
  private readonly windDirection = ConsumerSubject.create(this.sub.on('fms_nav_wind_direction'), null);
  private readonly windSpeed = ConsumerSubject.create(this.sub.on('fms_nav_wind_speed'), null);

  private flightPhase = FmgcFlightPhase.Preflight;

  private readonly defaultRecordedWind: WindEntry[] = [
    { altitude: 5_000, vector: Vec2Math.create() },
    { altitude: 15_000, vector: Vec2Math.create() },
    { altitude: 25_000, vector: Vec2Math.create() },
  ];
  private readonly recordedCruiseWind = { altitude: NaN, vector: Vec2Math.create() };

  private readonly interpolationCache = { altitude: NaN, vector: Vec2Math.create() };

  private readonly historyWinds: (WindEntry | null)[] = Array(this.defaultRecordedWind.length + 1).fill(null);

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

    this.syncFromLocalStorage();
  }

  private handleAltitudeChange(currentAltitude: number | null) {
    const windSpeed = this.windSpeed.get();
    const windDirection = this.windDirection.get();
    let requiresSync = false;

    if (currentAltitude !== null && this.previousAltitude !== null && windDirection !== null && windSpeed !== null) {
      for (let i = 0; i < this.defaultRecordedWind.length; i++) {
        const windEntry = this.defaultRecordedWind[i];
        const recordedAlt = windEntry.altitude;

        if (currentAltitude <= recordedAlt && this.previousAltitude > recordedAlt) {
          Vec2Math.setFromPolar(windSpeed, windDirection * MathUtils.DEGREES_TO_RADIANS, windEntry.vector);

          this.historyWinds[i] = windEntry;
          requiresSync = true;
        }
      }

      const cruiseLevel = this.activePlan.performanceData.cruiseFlightLevel.get();
      if (cruiseLevel !== null) {
        const cruiseAltitude = cruiseLevel * 100;
        const cruiseAltAlreadyExists = this.historyWinds.some(
          (wind) => wind !== null && wind.altitude === cruiseAltitude,
        );

        if (!cruiseAltAlreadyExists && currentAltitude <= cruiseAltitude && this.previousAltitude > cruiseAltitude) {
          this.recordedCruiseWind.altitude = cruiseAltitude;
          Vec2Math.setFromPolar(
            windSpeed,
            windDirection * MathUtils.DEGREES_TO_RADIANS,
            this.recordedCruiseWind.vector,
          );

          this.historyWinds[this.defaultRecordedWind.length] = this.recordedCruiseWind;
          requiresSync = true;
        }
      }
    }

    if (requiresSync) {
      this.syncToLocalStorage();
    }

    this.previousAltitude = currentAltitude;
  }

  private resetRecordedWinds() {
    for (let i = 0; i < this.historyWinds.length; i++) {
      this.historyWinds[i] = null;
    }

    this.syncToLocalStorage();
  }

  public getRecordedWinds(cruiseLevel: number | null): Readonly<WindEntry>[] {
    const historyWinds = this.historyWinds.filter((wind) => wind !== null).sort((a, b) => a.altitude - b.altitude);

    const shouldAddInterpolatedWind =
      historyWinds.length >= 0 &&
      cruiseLevel !== null &&
      !historyWinds.some((wind) => wind.altitude === cruiseLevel * 100);

    if (shouldAddInterpolatedWind) {
      const cruiseAltitude = cruiseLevel * 100;

      this.interpolationCache.altitude = cruiseAltitude;
      WindUtils.interpolateWindEntries(historyWinds, cruiseAltitude, this.interpolationCache.vector);

      historyWinds.push(this.interpolationCache);
    }

    return historyWinds.sort((a, b) => a.altitude - b.altitude);
  }

  private syncToLocalStorage() {
    localStorage.setItem(HistoryWind.LOCALSTORAGE_KEY, JSON.stringify(this.historyWinds));
  }

  private syncFromLocalStorage() {
    const historyWindsString = localStorage.getItem(HistoryWind.LOCALSTORAGE_KEY);
    if (historyWindsString === null) {
      return;
    }

    try {
      const deserialized = JSON.parse(historyWindsString);

      if (Array.isArray(deserialized) && deserialized.length === this.historyWinds.length) {
        for (let i = 0; i < deserialized.length; i++) {
          this.historyWinds[i] = deserialized[i];
        }
      } else {
        console.log(`[FMS/History Winds] Deserialized history winds with invalid format: "${historyWindsString}"`);
      }
    } catch (e) {
      console.log(`[FMS/History Winds] Error deserializing history winds from local storage: ${e}`);
    }
  }
}
