// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-underscore-dangle */

import {
  UpdateThrottler,
  Approach,
  ApproachType,
  IlsNavaid,
  AirportSubsectionCode,
  MathUtils,
} from '@flybywiresim/fbw-sdk';
import { FlightPhaseManagerEvents } from '@fmgc/flightphase';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { distanceTo } from 'msfs-geo';
import { FmgcFlightPhase } from '@shared/flightphase';
import { ConsumerSubject, EventBus } from '@microsoft/msfs-sdk';

export class LandingSystemSelectionManager {
  private static readonly DESTINATION_TUNING_DISTANCE = 300;

  private ppos = { lat: 0, long: 0 };

  private pposValid = false;

  private flightPlanVersion = -1;

  private _selectedIls: IlsNavaid | null = null;

  private _selectedLocCourse: number | null = null;

  private _selectedApproachBackcourse = false;

  private _selectedGsSlope: number | null = null;

  private readonly flightPhase = ConsumerSubject.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  private readonly autotuneUpdateThrottler = new UpdateThrottler(30000);

  private inProcess = false;

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanService: FlightPlanService,
    private readonly navigationProvider: NavigationProvider,
  ) {}

  async update(deltaTime: number): Promise<void> {
    const forceUpdate = this.flightPlanService.active.version !== this.flightPlanVersion;
    this.flightPlanVersion = this.flightPlanService.active.version;

    if (this.autotuneUpdateThrottler.canUpdate(deltaTime, forceUpdate) > -1) {
      if (this.inProcess) {
        return;
      }
      this.inProcess = true;
      try {
        this.updatePpos();
        const phase = this.flightPhase.get();
        if (phase <= FmgcFlightPhase.Takeoff) {
          await this.selectDepartureIls();
        } else if (phase >= FmgcFlightPhase.Descent) {
          await this.selectApproachIls();
        } else if (this.pposValid && phase >= FmgcFlightPhase.Cruise) {
          const destination = this.flightPlanService.active.destinationAirport;
          if (
            destination &&
            distanceTo(this.ppos, destination.location) <= LandingSystemSelectionManager.DESTINATION_TUNING_DISTANCE
          ) {
            await this.selectApproachIls();
          } else if (this._selectedIls !== null) {
            this.resetSelectedIls();
          }
        } else if (this._selectedIls !== null) {
          this.resetSelectedIls();
        }
      } catch (e) {
        console.error('Failed to select ILS', e);
        this.resetSelectedIls();
      } finally {
        this.inProcess = false;
      }
    }
  }

  private updatePpos(): void {
    const ppos = this.navigationProvider.getPpos();
    if (ppos === null) {
      this.pposValid = false;
    } else {
      this.ppos.lat = ppos.lat;
      this.ppos.long = ppos.long;
      this.pposValid = true;
    }
  }

  private async getIls(airportIdent: string, ilsIdent: string): Promise<IlsNavaid | undefined> {
    return (await NavigationDatabaseService.activeDatabase.backendDatabase.getIlsAtAirport(airportIdent, ilsIdent))[0];
  }

  private async selectDepartureIls(): Promise<boolean> {
    const runway = this.flightPlanService.active.originRunway;

    if (runway?.lsIdent) {
      const ils = await this.getIls(runway.airportIdent, runway.lsIdent);
      this._selectedIls = ils;
      this._selectedLocCourse = ils.locBearing !== -1 ? ils.locBearing : null;
      this._selectedGsSlope = ils.gsSlope ?? null;
      this._selectedApproachBackcourse = false;
      return true;
    }

    this.resetSelectedIls();
    return false;
  }

  private async selectApproachIls(): Promise<boolean> {
    const approach = this.flightPlanService.active.approach;

    if (this.isTunableApproach(approach?.type)) {
      return this.setIlsFromApproach(approach);
    }

    // if we got here there wasn't a suitable ILS
    this.resetSelectedIls();
    return false;
  }

  /**
   * Attempt to set the ILS from approach data
   * @param approach The approach
   * @returns true on success
   */
  private async setIlsFromApproach(approach: Approach): Promise<boolean> {
    const finalLeg = approach.legs[approach.legs.length - 1];
    if (!finalLeg || !finalLeg.recommendedNavaid || finalLeg.recommendedNavaid.databaseId.trim().length === 0) {
      return false;
    }
    const recNavaid = finalLeg.recommendedNavaid;
    const isBackcourse = approach.type === ApproachType.LocBackcourse;

    if (recNavaid.databaseId === this._selectedIls?.databaseId && isBackcourse === this._selectedApproachBackcourse) {
      return true;
    }

    const navaids = (await NavigationDatabaseService.activeDatabase.backendDatabase.getILSs([recNavaid.ident])).filter(
      (n) => n.databaseId === finalLeg.recommendedNavaid.databaseId,
    );
    if (navaids.length !== 1 || navaids[0].subSectionCode !== AirportSubsectionCode.LocalizerGlideSlope) {
      return false;
    }
    const ils = navaids[0];

    this._selectedApproachBackcourse = isBackcourse;
    this._selectedIls = ils;
    this._selectedLocCourse = MathUtils.normalise360(
      this._selectedApproachBackcourse ? ils.locBearing + 180 : ils.locBearing,
    );
    this._selectedGsSlope = ils.gsSlope ?? null;

    return true;
  }

  private resetSelectedIls(): void {
    this._selectedIls = null;
    this._selectedLocCourse = null;
    this._selectedApproachBackcourse = false;
    this._selectedGsSlope = null;
  }

  private isTunableApproach(approachType?: ApproachType): boolean {
    // FIXME case ApproachType.LocBackcourse: when FG can support it
    // FIXME support GLS/MLS/SLS when the rest of the systems can support it
    switch (approachType) {
      case ApproachType.Igs:
      case ApproachType.Ils:
      case ApproachType.Lda:
      case ApproachType.Loc:
      case ApproachType.LocBackcourse:
      case ApproachType.Sdf:
        return true;
      default:
        return false;
    }
  }

  get selectedIls(): IlsNavaid | null {
    return this._selectedIls;
  }

  get selectedLocCourse(): number | null {
    return this._selectedLocCourse !== null ? Math.round(this._selectedLocCourse % 360) : null;
  }

  get selectedApprBackcourse(): boolean {
    return this._selectedApproachBackcourse;
  }

  get selectedGsSlope(): number | null {
    return this._selectedGsSlope;
  }

  /** Reset all state e.g. when the nav database is switched */
  resetState(): void {
    this.resetSelectedIls();
  }
}
