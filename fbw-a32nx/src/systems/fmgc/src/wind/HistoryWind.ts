// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { ConsumerSubject, EventBus, Vec2Math } from '@microsoft/msfs-sdk';
import { NavigationEvents } from '../navigation/Navigation';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { HistoryWindEntry } from '../flightplanning/data/wind';
import { FlightPhaseManagerEvents } from '../flightphase';
import { FmgcFlightPhase } from '../../../shared/src/flightphase';
import { WindUtils } from '../guidance/vnav/wind/WindUtils';

export class HistoryWind {
  private static readonly LOCALSTORAGE_KEY: string =
    (process.env.AIRCRAFT_PROJECT_PREFIX?.toUpperCase() ?? 'UNK') + '.HistoryWinds';

  private readonly sub = this.bus.getSubscriber<NavigationEvents & FlightPhaseManagerEvents>();

  private previousAltitude: number | null = null;

  private readonly altitude = ConsumerSubject.create(this.sub.on('fms_nav_pressure_altitude').atFrequency(1), null);
  private readonly windDirection = ConsumerSubject.create(this.sub.on('fms_nav_wind_direction'), null);
  private readonly windSpeed = ConsumerSubject.create(this.sub.on('fms_nav_wind_speed'), null);

  private flightPhase = FmgcFlightPhase.Preflight;

  private readonly defaultRecordedWind: HistoryWindEntry[] = [
    { altitude: 5_000, vector: Vec2Math.create(), isEmpty: true },
    { altitude: 15_000, vector: Vec2Math.create(), isEmpty: true },
    { altitude: 25_000, vector: Vec2Math.create(), isEmpty: true },
  ];
  private readonly recordedCruiseWind: HistoryWindEntry = { altitude: NaN, vector: Vec2Math.create(), isEmpty: false };

  private readonly interpolationCache: HistoryWindEntry = { altitude: NaN, vector: Vec2Math.create(), isEmpty: false };

  private readonly historyWinds: (HistoryWindEntry | null)[] = Array(this.defaultRecordedWind.length + 1).fill(null);

  constructor(
    private readonly bus: EventBus,
    private readonly filterEmptyOnInterpolation: boolean,
  ) {
    this.altitude.sub(this.handleAltitudeChange.bind(this));
    this.sub.on('fmgc_flight_phase').handle(this.handleFlightPhaseChange.bind(this));
    for (let i = 0; i < this.defaultRecordedWind.length; i++) {
      this.historyWinds[i] = this.defaultRecordedWind[i];
    }
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
          windEntry.isEmpty = false;
          this.historyWinds[i] = windEntry;
          requiresSync = true;
        }
      }
    }

    if (requiresSync) {
      this.syncToLocalStorage();
    }

    this.previousAltitude = currentAltitude;
  }

  private handleFlightPhaseChange(newPhase: FmgcFlightPhase) {
    if (this.flightPhase === FmgcFlightPhase.Preflight && newPhase !== FmgcFlightPhase.Preflight) {
      this.resetRecordedWinds();
    }
    if (this.flightPhase <= FmgcFlightPhase.Cruise && newPhase > FmgcFlightPhase.Cruise) {
      this.tryRecordCruiseWind();
    }

    this.flightPhase = newPhase;
  }

  private tryRecordCruiseWind() {
    const cruiseAltitude = this.altitude.get();
    const windSpeed = this.windSpeed.get();
    const windDirection = this.windDirection.get();

    if (cruiseAltitude !== null && windSpeed !== null && windDirection !== null) {
      this.recordedCruiseWind.altitude = cruiseAltitude;
      Vec2Math.setFromPolar(windSpeed, windDirection * MathUtils.DEGREES_TO_RADIANS, this.recordedCruiseWind.vector);
      this.historyWinds[this.defaultRecordedWind.length] = this.recordedCruiseWind;
    }

    this.syncToLocalStorage();
  }

  private resetRecordedWinds() {
    for (let i = 0; i < this.historyWinds.length; i++) {
      this.historyWinds[i] = null;
    }

    this.syncToLocalStorage();
  }

  public getRecordedWinds(cruiseLevel: number | null, sortAscending = true): Readonly<HistoryWindEntry>[] {
    const historyWinds = this.historyWinds.filter((wind) => wind !== null).sort((a, b) => a.altitude - b.altitude);
    const interpolationSourceWinds = this.filterEmptyOnInterpolation
      ? historyWinds.filter((entry) => entry.isEmpty !== true)
      : historyWinds;
    const cruiseAltitude = cruiseLevel !== null ? cruiseLevel * 100 : null;

    const shouldAddInterpolatedWind =
      cruiseAltitude !== null &&
      !interpolationSourceWinds.some((wind) => wind.altitude === cruiseAltitude) &&
      interpolationSourceWinds.length >= 0 &&
      (!this.filterEmptyOnInterpolation || // If we are filtering the empty entries, we only want to interpolate if there are entries between the CRZ FL.
        (interpolationSourceWinds.some((wind) => wind.altitude < cruiseAltitude && !wind.isEmpty) &&
          interpolationSourceWinds.some((wind) => wind.altitude > cruiseAltitude && !wind.isEmpty)));

    if (shouldAddInterpolatedWind) {
      this.interpolationCache.altitude = cruiseAltitude;
      WindUtils.interpolateWindEntries(interpolationSourceWinds, cruiseAltitude, this.interpolationCache.vector);
      historyWinds.push(this.interpolationCache);
    } else if (
      this.filterEmptyOnInterpolation &&
      cruiseAltitude !== null &&
      !historyWinds.some((wind) => wind.altitude === cruiseAltitude)
    ) {
      historyWinds.push({
        altitude: cruiseAltitude,
        vector: Vec2Math.create(),
        isEmpty: true,
      });
    }
    return historyWinds.sort((a, b) => (sortAscending ? a.altitude - b.altitude : b.altitude - a.altitude));
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
          if (deserialized[i] !== null) {
            this.historyWinds[i] = deserialized[i];
          }
        }
      } else {
        console.log(`[FMS/History Winds] Deserialized history winds with invalid format: "${historyWindsString}"`);
      }
    } catch (e) {
      console.log(`[FMS/History Winds] Error deserializing history winds from local storage: ${e}`);
    }
  }
}
