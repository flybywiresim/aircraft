// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable no-underscore-dangle */

import { FlightPhaseManager, getFlightPhaseManager } from '@fmgc/flightphase';
import { FlightPlans } from '@fmgc/flightplanning/FlightPlanManager';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { FlightPlanManager } from '@fmgc/wtsdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { bearingTo, distanceTo } from 'msfs-geo';
import { LegType } from '@flybywiresim/fbw-sdk';

interface IlsCourseSlopeData {
    course: number | null,
    backcourse: boolean,
    slope: number | null,
}

export class LandingSystemSelectionManager {
    private static readonly DESTINATION_TUNING_DISTANCE = 300;

    private static readonly courseSlopeCache: IlsCourseSlopeData = {
        course: null,
        backcourse: false,
        slope: null,
    }

    private ppos = { lat: 0, long: 0 };

    private pposValid = false;

    private flightPlanVersion = -1;

    private _selectedIls: RawVor | null = null;

    private _selectedLocCourse: number | null = null;

    private _selectedApproachBackcourse = false;

    private _selectedGsSlope: number | null = null;

    private readonly flightPhaseManager: FlightPhaseManager;

    private readonly autotuneUpdateThrottler = new A32NX_Util.UpdateThrottler(30000);

    private inProcess = false;

    constructor(
        private readonly navigationProvider: NavigationProvider,
        private readonly fpm: FlightPlanManager,
        private readonly facLoader: FacilityLoader,
    ) {
        this.flightPhaseManager = getFlightPhaseManager();
    }

    async update(deltaTime: number): Promise<void> {
        const forceUpdate = this.fpm.currentFlightPlanVersion !== this.flightPlanVersion;
        this.flightPlanVersion = this.fpm.currentFlightPlanVersion;

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
                    const destination = this.fpm.getDestination(FlightPlans.Active);
                    if (destination && distanceTo(this.ppos, destination.infos.coordinates) <= LandingSystemSelectionManager.DESTINATION_TUNING_DISTANCE) {
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

    private async selectDepartureIls(): Promise<boolean> {
        const airport = this.fpm.getPersistentOrigin(FlightPlans.Active);
        const runway = this.fpm.getOriginRunway(FlightPlans.Active);

        if (await this.setIlsFromRunway(runway)) {
            return true;
        }

        if (await this.setIlsForRunwayFromApproaches(airport, runway)) {
            return true;
        }

        // if we got here there wasn't a suitable ILS
        this.resetSelectedIls();
        return false;
    }

    private async selectApproachIls(): Promise<boolean> {
        const airport = this.fpm.getDestination(FlightPlans.Active);
        const approach = this.fpm.getApproach(FlightPlans.Active);

        if (this.isTunableApproach(approach?.approachType)) {
            return this.setIlsFromApproach(airport, approach, true);
        }

        // if we got here there wasn't a suitable ILS
        this.resetSelectedIls();
        return false;
    }

    /**
     * Attempt to set the ILS from the runway data
     * @param runway The runway
     * @param icao If specified, the facility will only be selected if it matches this icao
     * @param checkBothEnds Check the secondary runway too in case it's a backcourse approach
     * @returns true on success
     */
    private async setIlsFromRunway(runway?: OneWayRunway, icao?: string, checkBothEnds = false): Promise<boolean> {
        if (!runway) {
            return false;
        }

        const frequencies = [runway.primaryILSFrequency];
        if (checkBothEnds) {
            frequencies.push(runway.secondaryILSFrequency);
        }

        for (const frequency of frequencies) {
            if (frequency.freqMHz > 0 && (!icao || frequency.icao === icao)) {
                if (frequency.icao === this._selectedIls?.icao) {
                    return true;
                }

                // eslint-disable-next-line no-await-in-loop
                const loc = await this.facLoader.getFacilityRaw(frequency.icao, 1500, true) as RawVor | undefined;
                if (!loc) {
                    return false;
                }

                this._selectedIls = loc;
                this._selectedLocCourse = frequency.localizerCourse;
                this._selectedGsSlope = frequency.hasGlideslope ? -frequency.glideslopeAngle : null;
                return true;
            }
        }

        return false;
    }

    private async setIlsForRunwayFromApproaches(airport: WayPoint, runway: OneWayRunway): Promise<boolean> {
        // If the airport has correct navdata, the ILS will be listed as the reference navaid (originIcao in MSFS land) on at least the last leg of the
        // ILS approach procedure(s). Tuning this way gives us the ident, and the course
        if (airport && airport.infos && airport.infos.icao.charAt(0) === 'A' && runway) {
            const approaches = (airport.infos as AirportInfo).approaches;
            for (const approach of approaches) {
                // L(eft), C(entre), R(ight), T(true North) are the possible runway designators (ARINC424)
                // If there are multiple procedures for the same type of approach, an alphanumeric suffix is added to their names (last subpattern)
                // We are a little more lenient than ARINC424 in an effort to match non-perfect navdata, so we allow dashes, spaces, or nothing before the suffix
                if (
                    approach.approachType === ApproachType.APPROACH_TYPE_ILS
                    && approach.runwayNumber === runway.number
                    && approach.runwayDesignator === runway.designator
                    && approach.finalLegs.length > 0
                ) {
                    return this.setIlsFromApproach(airport, approach);
                }
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
    private async setIlsFromApproach(airport: WayPoint, approach: RawApproach, checkRunwayFrequencies = false): Promise<boolean> {
        const finalLeg = approach.finalLegs[approach.finalLegs.length - 1];
        if ((finalLeg?.originIcao.trim() ?? '').length === 0) {
            return false;
        }

        if (finalLeg.originIcao === this._selectedIls?.icao) {
            return true;
        }

        if (checkRunwayFrequencies) {
            const runway = (airport.infos as AirportInfo).oneWayRunways.find((r) => r.number === approach.runwayNumber && r.designator === approach.runwayDesignator);
            if (runway && await this.setIlsFromRunway(runway, finalLeg.originIcao, true)) {
                return true;
            }
        }

        const loc = await this.facLoader.getFacilityRaw(finalLeg.originIcao, 1500, true) as RawVor | undefined;
        if (!loc) {
            return false;
        }

        this._selectedIls = loc;

        const courseSlope = await this.getIlsCourseSlopeFromApproach(airport, approach, loc);
        if (courseSlope !== null) {
            this._selectedApproachBackcourse = courseSlope.backcourse;
            this._selectedLocCourse = courseSlope.course;
            this._selectedGsSlope = courseSlope.slope;
        } else {
            this._selectedApproachBackcourse = false;
            this._selectedLocCourse = null;
            this._selectedGsSlope = null;
        }

        return true;
    }

    /**
     * Try to get the course and slope for an ILS from an approach
     * @param airport Airport the approach is from
     * @param approach The approach
     * @param ils The ILS/LOC
     * @returns course/slope data, null fields if not available. Caution: it is not safe to keep a reference to this object.
     */
    private async getIlsCourseSlopeFromApproach(airport: WayPoint, approach: RawApproach, ils: RawVor): Promise<IlsCourseSlopeData | null> {
        const runway = (airport.infos as AirportInfo).oneWayRunways.find((r) => r.number === approach.runwayNumber && r.designator === approach.runwayDesignator);
        if (runway) {
            const frequencies = [runway.primaryILSFrequency, runway.secondaryILSFrequency];

            for (const frequency of frequencies) {
                if (frequency.freqMHz > 0 && frequency.icao === ils.icao) {
                    LandingSystemSelectionManager.courseSlopeCache.backcourse = approach.approachType === ApproachType.APPROACH_TYPE_LOCALIZER_BACK_COURSE;
                    LandingSystemSelectionManager.courseSlopeCache.course = frequency.localizerCourse;
                    LandingSystemSelectionManager.courseSlopeCache.slope = frequency.hasGlideslope ? -frequency.glideslopeAngle : null;
                    return LandingSystemSelectionManager.courseSlopeCache;
                }
            }
        }

        const finalLeg = approach.finalLegs[approach.finalLegs.length - 1];
        if (!finalLeg) {
            return null;
        }

        let finalLegCourse = finalLeg.trueDegrees ? A32NX_Util.trueToMagnetic(finalLeg.course, -ils.magneticVariation) : finalLeg.course;

        if (finalLeg.type === LegType.TF) {
            const previousLeg = approach.finalLegs[approach.finalLegs.length - 2];
            if (!previousLeg || !previousLeg.fixIcao.trim() || !finalLeg.fixIcao.trim()) {
                return null;
            }
            const finalWp = await this.facLoader.getFacility(finalLeg.fixIcao);
            const previousWp = await this.facLoader.getFacility(previousLeg.fixIcao);

            if (!finalWp || !previousWp) {
                return null;
            }

            finalLegCourse = A32NX_Util.trueToMagnetic(bearingTo(
                previousWp.infos.coordinates,
                finalWp.infos.coordinates,
            ), -ils.magneticVariation);
        }

        const ilsApproachExists = (airport.infos as AirportInfo).approaches.find(
            (a) => a.approachType === ApproachType.APPROACH_TYPE_ILS && a.runwayNumber === approach.runwayNumber && a.runwayDesignator === approach.runwayDesignator,
        ) !== undefined;

        LandingSystemSelectionManager.courseSlopeCache.backcourse = approach.approachType === ApproachType.APPROACH_TYPE_LOCALIZER_BACK_COURSE;
        LandingSystemSelectionManager.courseSlopeCache.course = LandingSystemSelectionManager.courseSlopeCache.backcourse ? finalLegCourse + 180 : finalLegCourse;
        LandingSystemSelectionManager.courseSlopeCache.slope = finalLeg.verticalAngle && ilsApproachExists ? finalLeg.verticalAngle - 360 : null;

        return LandingSystemSelectionManager.courseSlopeCache;
    }

    private resetSelectedIls(): void {
        this._selectedIls = null;
        this._selectedLocCourse = null;
        this._selectedApproachBackcourse = false;
        this._selectedGsSlope = null;
    }

    private isTunableApproach(approachType?: ApproachType): boolean {
        // FIXME case ApproachType.APPROACH_TYPE_LOCALIZER_BACK_COURSE: when FG can support it
        switch (approachType) {
        case ApproachType.APPROACH_TYPE_ILS:
        case ApproachType.APPROACH_TYPE_LOCALIZER:
        case ApproachType.APPROACH_TYPE_LDA:
        case ApproachType.APPROACH_TYPE_SDF:
            return true;
        default:
            return false;
        }
    }

    private async tryGetCourseSlopeForIlsFromAirport(ils: RawVor, airport: WayPoint): Promise<[number | null, number | null] | null> {
        for (const approach of (airport.infos as AirportInfo).approaches) {
            if (approach.approachType !== ApproachType.APPROACH_TYPE_ILS) {
                continue;
            }

            const finalLeg = approach.finalLegs[approach.finalLegs.length - 1];
            if (!finalLeg) {
                continue;
            }

            if (finalLeg.originIcao === ils.icao) {
                // eslint-disable-next-line no-await-in-loop
                const data = await this.getIlsCourseSlopeFromApproach(airport, approach, ils);
                if (data !== null) {
                    return [data.course, data.slope];
                }
            }
        }

        return null;
    }

    /** Try to get the course and slope for a manually tuned ILS */
    async tryGetCourseSlopeForIls(ils: RawVor): Promise<[number | null, number | null]> {
        // first try the destination and origin fields, as we already have them loaded
        const flightPlan = this.fpm.activeFlightPlan;
        if (flightPlan.destinationAirfield) {
            const ret = await this.tryGetCourseSlopeForIlsFromAirport(ils, flightPlan.destinationAirfield);
            if (ret !== null) {
                return ret;
            }
        }
        if (flightPlan.originAirfield) {
            const ret = await this.tryGetCourseSlopeForIlsFromAirport(ils, flightPlan.originAirfield);
            if (ret !== null) {
                return ret;
            }
        }

        // last ditch see if it's encoded in the ils icao
        const airportIdent = ils.icao.slice(3, 7).trim();
        if (airportIdent.length === 4) {
            const airport = await this.facLoader.getFacility(`A      ${airportIdent}`);
            if (airport) {
                const ret = await this.tryGetCourseSlopeForIlsFromAirport(ils, airport);
                if (ret !== null) {
                    return ret;
                }
            }
        }

        return [null, null];
    }

    get selectedIls(): RawVor | null {
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
