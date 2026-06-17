// @ts-strict-ignore
// Copyright (c) 2022-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Arinc429Register,
  IlsNavaid,
  NdbNavaid,
  VhfNavaid,
  VhfNavaidType,
  Icao,
  NearbyFacilityMonitor,
  NearbyFacilityType,
  NearbyFacility,
} from '@flybywiresim/fbw-sdk';

import { LandingSystemSelectionManager } from '@fmgc/navigation/LandingSystemSelectionManager';
import { NavaidSelectionManager, VorSelectionReason } from '@fmgc/navigation/NavaidSelectionManager';
import { NavaidTuner } from '@fmgc/navigation/NavaidTuner';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { RequiredPerformance } from '@fmgc/navigation/RequiredPerformance';
import { EventBus, Subject, Subscribable } from '@microsoft/msfs-sdk';
import { Coordinates } from 'msfs-geo';
import { FlightPlanService } from '../flightplanning/FlightPlanService';
import { NavigationDatabaseService } from '../flightplanning/NavigationDatabaseService';

export enum SelectedNavaidType {
  None,
  Dme,
  Vor,
  VorDme,
  VorTac,
  Tacan,
  Ils,
  Gls,
  Mls,
}

export enum SelectedNavaidMode {
  Auto,
  Manual,
  Rmp,
}

export interface SelectedNavaid {
  type: SelectedNavaidType;
  mode: SelectedNavaidMode;
  ident: string | null;
  frequency: number | null;
  facility: VhfNavaid | NdbNavaid | IlsNavaid | null;
}

export interface NavigationEvents {
  /** The selected pressure altitude in feet, or null if invalid/NCD. */
  fms_nav_pressure_altitude: number | null;
  /** Whether GPS primary is in use. */
  fms_nav_gps_primary: boolean;
  /** The selected wind direction in [0, 359.9], or null if invaliid/NCD */
  fms_nav_wind_direction: number | null;
  /** The selected wind speed in knots, or null if invalid/NCD */
  fms_nav_wind_speed: number | null;
}

export class Navigation implements NavigationProvider {
  private readonly publisher = this.bus.getPublisher<NavigationEvents>();

  private static readonly adiruOrder = [1, 3, 2];

  private static readonly arincWordCache = Arinc429Register.empty();

  requiredPerformance: RequiredPerformance;

  currentPerformance: number | undefined;

  private readonly _accuracyHigh = Subject.create(false);
  public readonly accuracyHigh: Subscribable<boolean> = this._accuracyHigh;

  ppos: Coordinates = { lat: 0, long: 0 };

  groundSpeed: Knots = 0;

  private radioHeight: number | null = null;

  private static readonly radioAltimeterVars = Array.from(
    { length: 2 },
    (_, i) => `L:A32NX_RA_${i + 1}_RADIO_ALTITUDE`,
  );

  private baroAltitude: number | null = null;

  private static readonly baroAltitudeVars = Array.from(
    { length: 3 },
    (_, i) => `L:A32NX_ADIRS_ADR_${i + 1}_BARO_CORRECTED_ALTITUDE_1`,
  );

  private pressureAltitude = Subject.create<number | null>(null);

  private static readonly pressureAltitudeVars = Array.from(
    { length: 3 },
    (_, i) => `L:A32NX_ADIRS_ADR_${i + 1}_ALTITUDE`,
  );

  private computedAirspeed: number | null = null;

  private static readonly computedAirspeedVars = Array.from(
    { length: 3 },
    (_, i) => `L:A32NX_ADIRS_ADR_${i + 1}_COMPUTED_AIRSPEED`,
  );

  private trueAirspeed: number | null = null;

  private static readonly trueAirspeedVars = Array.from(
    { length: 3 },
    (_, i) => `L:A32NX_ADIRS_ADR_${i + 1}_TRUE_AIRSPEED`,
  );

  private staticAirTemperature: number | null = null;

  private static readonly staticAirTemperatureVars = Array.from(
    { length: 3 },
    (_, i) => `L:A32NX_ADIRS_ADR_${i + 1}_STATIC_AIR_TEMPERATURE`,
  );

  private static readonly irDiscreteWordVars = Array.from(
    { length: 3 },
    (_, i) => `L:A32NX_ADIRS_IR_${i + 1}_MAINT_WORD`,
  );

  private isGpirsAvailable = false;
  private readonly gpsPrimary = Subject.create(false);

  private windDirection = Subject.create<number | null>(null);

  private static readonly windDirectionVars = Array.from(
    { length: 3 },
    (_, i) => `L:A32NX_ADIRS_IR_${i + 1}_WIND_DIRECTION`,
  );

  private windSpeed = Subject.create<number | null>(null);

  private static readonly windSpeedVars = Array.from({ length: 3 }, (_, i) => `L:A32NX_ADIRS_IR_${i + 1}_WIND_SPEED`);

  private readonly navaidSelectionManager: NavaidSelectionManager;

  private readonly landingSystemSelectionManager: LandingSystemSelectionManager;

  private readonly navaidTuner: NavaidTuner;

  private readonly selectedNavaids: SelectedNavaid[] = Array.from({ length: 4 }, () => ({
    type: SelectedNavaidType.None,
    mode: SelectedNavaidMode.Auto,
    ident: '',
    frequency: 0,
    facility: null,
  }));

  private nearbyAirportMonitor: NearbyFacilityMonitor;

  constructor(
    private readonly bus: EventBus,
    private flightPlanService: FlightPlanService,
  ) {
    this.requiredPerformance = new RequiredPerformance(this.bus, this.flightPlanService);
    this.navaidSelectionManager = new NavaidSelectionManager(this.flightPlanService, this);
    this.landingSystemSelectionManager = new LandingSystemSelectionManager(this.bus, this.flightPlanService, this);
    this.navaidTuner = new NavaidTuner(this.bus, this, this.navaidSelectionManager, this.landingSystemSelectionManager);
  }

  init(): void {
    this.navaidTuner.init();

    this.pressureAltitude.sub((v) => this.publisher.pub('fms_nav_pressure_altitude', v, false, true), true);
    this._accuracyHigh.sub((v) => {
      SimVar.SetSimVarValue('L:A32NX_FMGC_L_NAV_ACCURACY_HIGH', 'bool', v);
      SimVar.SetSimVarValue('L:A32NX_FMGC_R_NAV_ACCURACY_HIGH', 'bool', v);
    }, true);
    this.gpsPrimary.sub((v) => this.publisher.pub('fms_nav_gps_primary', v, false, true), true);
    this.windDirection.sub((v) => this.publisher.pub('fms_nav_wind_direction', v, false, true), true);
    this.windSpeed.sub((v) => this.publisher.pub('fms_nav_wind_speed', v, false, true), true);

    this.nearbyAirportMonitor = NavigationDatabaseService.activeDatabase.createNearbyFacilityMonitor(
      NearbyFacilityType.Airport,
    );
    this.nearbyAirportMonitor.setMaxResults(25);
    this.nearbyAirportMonitor.setRadius(250);
  }

  update(deltaTime: number): void {
    this.requiredPerformance.update(deltaTime);

    this.updateAttHdgPosData();
    this.updateCurrentPerformance();
    this.updatePosition();
    this.updateRadioHeight();
    this.updateAirData();
    this.updateInertialReference();

    this.navaidSelectionManager.update(deltaTime);
    this.landingSystemSelectionManager.update(deltaTime);

    this.navaidTuner.update(deltaTime);
  }

  /** Reset all state e.g. when the nav database is switched */
  resetState(): void {
    this.navaidSelectionManager.resetState();
    this.landingSystemSelectionManager.resetState();
    this.navaidTuner.resetState();

    // FIXME reset FMS position
  }

  private getAdiruValue(simVars: string[]): number | null {
    for (const adiru of Navigation.adiruOrder) {
      const simVar = simVars[adiru - 1];
      Navigation.arincWordCache.setFromSimVar(simVar);
      if (!Navigation.arincWordCache.isInvalid()) {
        return Navigation.arincWordCache.value;
      }
    }
    return null;
  }

  private updateCurrentPerformance(): void {
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    if (this.isGpirsAvailable) {
      // FIXME fake it until we make it :D
      const estimate = 0.03 + Math.random() * 0.02 + gs * 0.00015;
      // basic IIR filter
      this.currentPerformance =
        this.currentPerformance === undefined ? estimate : this.currentPerformance * 0.9 + estimate * 0.1;

      this._accuracyHigh.set(this.currentPerformance <= this.requiredPerformance.activeRnp);
    } else {
      this._accuracyHigh.set(false);
    }
    this.gpsPrimary.set(this.isGpirsAvailable && this.accuracyHigh.get());
  }

  private updateRadioHeight(): void {
    for (const simVar of Navigation.radioAltimeterVars) {
      Navigation.arincWordCache.setFromSimVar(simVar);
      if (!Navigation.arincWordCache.isInvalid()) {
        this.radioHeight = Navigation.arincWordCache.value;
        return;
      }
    }
    this.radioHeight = null;
  }

  private updateAirData(): void {
    this.baroAltitude = this.getAdiruValue(Navigation.baroAltitudeVars);
    this.pressureAltitude.set(this.getAdiruValue(Navigation.pressureAltitudeVars));

    this.computedAirspeed = this.getAdiruValue(Navigation.computedAirspeedVars);
    this.trueAirspeed = this.getAdiruValue(Navigation.trueAirspeedVars);
    this.staticAirTemperature = this.getAdiruValue(Navigation.staticAirTemperatureVars);
  }

  private updateAttHdgPosData(): void {
    this.isGpirsAvailable = false;
    for (const simVar of Navigation.irDiscreteWordVars) {
      Navigation.arincWordCache.setFromSimVar(simVar);
      // Check if in NAV mode and aligned
      if (
        !Navigation.arincWordCache.isInvalid() &&
        Navigation.arincWordCache.bitValue(3) &&
        !Navigation.arincWordCache.bitValue(1)
      ) {
        this.isGpirsAvailable = true;
        break;
      }
    }
  }

  private updateInertialReference(): void {
    this.windDirection.set(this.getAdiruValue(Navigation.windDirectionVars));
    this.windSpeed.set(this.getAdiruValue(Navigation.windSpeedVars));
  }

  private updatePosition(): void {
    this.ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
    this.ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
    this.groundSpeed = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    this.nearbyAirportMonitor.setLocation(this.ppos.lat, this.ppos.long);
  }

  public setPilotRnp(rnp: number | null) {
    if (rnp) {
      this.requiredPerformance.setPilotRnp(rnp);
    } else {
      this.requiredPerformance.clearPilotRnp();
    }
  }

  public isPilotRnp(): boolean {
    return this.requiredPerformance.manualRnp;
  }

  public isAccuracyHigh(): boolean {
    return this._accuracyHigh.get();
  }

  public getBaroCorrectedAltitude(): number | null {
    return this.baroAltitude;
  }

  public getEpe(): number {
    return this.currentPerformance ?? Infinity;
  }

  public getActiveRnp(): number {
    return this.requiredPerformance.activeRnp;
  }

  public getPpos(): Coordinates | null {
    // TODO return null when fms pos invalid
    return this.ppos;
  }

  public getGpsPrimary(): boolean {
    return this.gpsPrimary.get();
  }

  public getPressureAltitude(): number | null {
    return this.pressureAltitude.get();
  }

  public getComputedAirspeed(): number | null {
    return this.computedAirspeed;
  }

  public getTrueAirspeed(): number | null {
    return this.trueAirspeed;
  }

  public getStaticAirTemperature(): number | null {
    return this.staticAirTemperature;
  }

  public getRadioHeight(): number | null {
    return this.radioHeight;
  }

  public getNavaidTuner(): NavaidTuner {
    return this.navaidTuner;
  }

  public getRequiredPerformance(): RequiredPerformance {
    return this.requiredPerformance;
  }

  public getWindDirection(): number | null {
    return this.windDirection.get();
  }

  public getWindSpeed(): number | null {
    return this.windSpeed.get();
  }

  private resetSelectedNavaid(i: number): void {
    const selected = this.selectedNavaids[i];
    selected.type = SelectedNavaidType.None;
    selected.mode = SelectedNavaidMode.Auto;
    selected.ident = '';
    selected.frequency = 0;
    selected.facility = null;
  }

  public getSelectedNavaids(cdu: 1 | 2 = 1): SelectedNavaid[] {
    if (this.navaidTuner.isFmTuningActive()) {
      const vorStatus = this.navaidTuner.getVorRadioTuningStatus(cdu);
      if (vorStatus.frequency !== null) {
        const selected = this.selectedNavaids[0];
        selected.type = this.getSelectedNavaidType(vorStatus.facility);
        selected.mode = vorStatus.manual ? SelectedNavaidMode.Manual : SelectedNavaidMode.Auto;
        selected.ident = vorStatus.ident;
        selected.frequency = vorStatus.frequency;
        selected.facility = vorStatus.facility ?? null;
      } else {
        this.resetSelectedNavaid(0);
      }
      const dmePair = this.navaidSelectionManager.dmePair;
      if (dmePair !== null) {
        for (const [i, dme] of dmePair.entries()) {
          const selected = this.selectedNavaids[i + 1];
          selected.type = this.getSelectedNavaidType(dme);
          selected.mode = SelectedNavaidMode.Auto;
          selected.ident = dme.ident;
          selected.frequency = dme.frequency;
          selected.facility = dme;
        }
      } else if (this.navaidSelectionManager.displayVorReason === VorSelectionReason.Navigation) {
        const navaid = this.navaidSelectionManager.displayVor;
        const selected = this.selectedNavaids[1];
        selected.type = this.getSelectedNavaidType(navaid);
        selected.mode = SelectedNavaidMode.Auto;
        selected.ident = Icao.getIdent(navaid.databaseId);
        selected.frequency = navaid.frequency;
        selected.facility = navaid;
        this.resetSelectedNavaid(2);
      } else {
        this.resetSelectedNavaid(1);
        this.resetSelectedNavaid(2);
      }
      const mmrStatus = this.navaidTuner.getMmrRadioTuningStatus(1);
      if (mmrStatus.frequency !== null) {
        const selected = this.selectedNavaids[3];
        selected.type = SelectedNavaidType.Ils; // FIXME support other types
        selected.mode = mmrStatus.manual ? SelectedNavaidMode.Manual : SelectedNavaidMode.Auto;
        selected.ident = mmrStatus.ident;
        selected.frequency = mmrStatus.frequency;
        selected.facility = mmrStatus.facility ?? null;
      } else {
        this.resetSelectedNavaid(3);
      }
    } else {
      // RMP
      for (let i = 0; i < 4; i++) {
        this.resetSelectedNavaid(i);
        // No DME pair with RMP active
        if (i === 1 || i === 2) {
          continue;
        }
        const selected = this.selectedNavaids[i];
        selected.type = i === 3 ? SelectedNavaidType.Ils : SelectedNavaidType.None;
        selected.mode = SelectedNavaidMode.Rmp;
        selected.frequency = SimVar.GetSimVarValue(`NAV ACTIVE FREQUENCY:${i === 0 ? cdu : cdu + 2}`, 'mhz');
      }
    }

    return this.selectedNavaids;
  }

  private getSelectedNavaidType(facility?: VhfNavaid): SelectedNavaidType {
    if (!facility) {
      return SelectedNavaidType.None;
    }
    switch (facility.type) {
      case VhfNavaidType.Dme:
        return SelectedNavaidType.Dme;
      case VhfNavaidType.Vor:
        return SelectedNavaidType.Vor;
      case VhfNavaidType.VorDme:
        return SelectedNavaidType.VorDme;
      case VhfNavaidType.Vortac:
        return SelectedNavaidType.VorTac;
      case VhfNavaidType.Tacan:
        return SelectedNavaidType.Tacan;
      case VhfNavaidType.IlsTacan:
      case VhfNavaidType.IlsDme:
        return SelectedNavaidType.Ils;
      default:
        return SelectedNavaidType.None;
    }
  }

  public getNearbyAirports(): Readonly<Readonly<NearbyFacility>[]> {
    return this.nearbyAirportMonitor.getCurrentFacilities();
  }
}
