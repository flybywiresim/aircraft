// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-underscore-dangle */

import { UpdateThrottler, Airport, Approach, ApproachType, IlsNavaid, Runway } from '@flybywiresim/fbw-sdk';
import { FlightPhaseManager, getFlightPhaseManager } from '@fmgc/flightphase';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { NavigationDatabaseService } from '@fmgc/flightplanning/new/NavigationDatabaseService';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { distanceTo } from 'msfs-geo';
import { FmgcFlightPhase } from '@shared/flightphase';

export class LandingSystemSelectionManager {
    private static readonly DESTINATION_TUNING_DISTANCE = 300;

    private ppos = { lat: 0, long: 0 };

    private pposValid = false;

    private flightPlanVersion = -1;

    private _selectedIls: IlsNavaid | null = null;

    private _selectedLocCourse: number | null = null;

    private _selectedApproachBackcourse = false;

    private _selectedGsSlope: number | null = null;

    private readonly flightPhaseManager: FlightPhaseManager;

    private readonly autotuneUpdateThrottler = new UpdateThrottler(30000);

    private inProcess = false;

    constructor(
        private readonly flightPlanService: FlightPlanService,
        private readonly navigationProvider: NavigationProvider,
    ) {
        this.flightPhaseManager = getFlightPhaseManager();
    }

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
                const phase = this.flightPhaseManager.phase;
                if (phase <= FmgcFlightPhase.Takeoff) {
                    await this.selectDepartureIls();
                } else if (phase >= FmgcFlightPhase.Descent) {
                    await this.selectApproachIls();
                } else if (this.pposValid && phase >= FmgcFlightPhase.Cruise) {
                    const destination = this.flightPlanService.active.destinationAirport;
                    if (destination && distanceTo(this.ppos, destination.location) <= LandingSystemSelectionManager.DESTINATION_TUNING_DISTANCE) {
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
            // const ils = await this.getIls(runway.airportIdent, runway.lsIdent);
            const ils = (await NavigationDatabaseService.activeDatabase.backendDatabase.getILSs([runway.lsIdent]))[0];
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
        const airport = this.flightPlanService.active.destinationAirport;
        const approach = this.flightPlanService.active.approach;

        if (this.isTunableApproach(approach?.type)) {
            return this.setIlsFromApproach(airport, approach, true);
        }

        // if we got here there wasn't a suitable ILS
        this.resetSelectedIls();
        return false;
    }

    /**
     * Attempt to set the ILS from the runway data
     * @param airport The airport
     * @param runway The runway
     * @param icao If specified, the facility will only be selected if it matches this icao
     * @param checkBothEnds Check the secondary runway too in case it's a backcourse approach
     * @returns true on success
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private async setIlsFromRunway(airport: Airport, runway?: Runway, icao?: string, checkBothEnds = false): Promise<boolean> {
        if (!runway) {
            return false;
        }

        const frequencies = await NavigationDatabaseService.activeDatabase.backendDatabase.getIlsAtAirport(airport.ident, undefined, icao);
        const runwayFrequencies = frequencies.filter((it) => it.runwayIdent === runway.ident);

        for (const frequency of runwayFrequencies) {
            if (frequency.frequency > 0 && (!icao || frequency.databaseId === icao)) {
                if (frequency.databaseId === this._selectedIls?.databaseId) {
                    return true;
                }

                this._selectedIls = frequency;
                this._selectedLocCourse = frequency.locBearing !== -1 ? frequency.locBearing : null;
                this._selectedGsSlope = Number.isFinite(frequency.gsSlope) ? frequency.gsSlope : null;

                return true;
            }
        }

        return false;
    }

    /**
     * Attempt to set the ILS from approach data
     * @param airport Airport the approach is to
     * @param approach The approach
     * @param checkRunwayFrequencies if true, runway frequency data will be checked for course/gs information.
     * This method is better if possible because it can get proper glideslope info.
     * unfortunately many scenery developers break the runway <-> ILS links and the data is not available
     * @returns true on success
     */
    private async setIlsFromApproach(airport: Airport, approach: Approach, checkRunwayFrequencies = false): Promise<boolean> {
        const finalLeg = approach.legs[approach.legs.length - 1];

        if ((finalLeg?.waypoint.databaseId.trim() ?? '').length === 0) {
            return false;
        }

        if (finalLeg.waypoint.databaseId === this._selectedIls?.databaseId) {
            return true;
        }

        if (checkRunwayFrequencies) {
            const runways = await NavigationDatabaseService.activeDatabase.backendDatabase.getRunways(airport.ident);
            const runway = runways.find((it) => it.ident === approach.runwayIdent);

            if (runway && await this.setIlsFromRunway(airport, runway, finalLeg.recommendedNavaid.databaseId, true)) {
                return true;
            }
        }

        return false;
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
