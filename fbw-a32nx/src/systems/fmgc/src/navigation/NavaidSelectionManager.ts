// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPlans } from '@fmgc/flightplanning/FlightPlanManager';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { NearbyFacilities } from '@fmgc/navigation/NearbyFacilities';
import { arrayFlat, VorClass, VorType } from '@flybywiresim/fbw-sdk';
import { FlightPlanManager } from '@shared/flightplan';
import { bearingTo, diffAngle, distanceTo, EARTH_RADIUS } from 'msfs-geo';

type VorFacilityWithDistance = RawVor & { distance: number };

export enum VorSelectionReason {
    None,
    Display,
    Route,
    Navigation,
    Procedure,
}

export class NavaidSelectionManager {
    // the closest VOR needs to be this much closer than the currently tuned one to make us swap
    private static readonly DISPLAY_VOR_STICKINESS_THRESHOLD = 2;

    private static readonly SPECIFIED_VOR_APPROACH_TYPES = [ApproachType.APPROACH_TYPE_RNAV, ApproachType.APPROACH_TYPE_VOR, ApproachType.APPROACH_TYPE_VORDME];

    private static readonly SPECIFIED_NDB_APPROACH_TYPES = [ApproachType.APPROACH_TYPE_NDB, ApproachType.APPROACH_TYPE_NDBDME];

    private readonly nearbyFacilities: NearbyFacilities = NearbyFacilities.getInstance();

    private readonly candidateUpdateThrottler = new A32NX_Util.UpdateThrottler(180);

    private readonly dmePairUpdateThrottler = new A32NX_Util.UpdateThrottler(10);

    private readonly autotuneUpdateThrottler = new A32NX_Util.UpdateThrottler(1);

    private ppos = { lat: 0, long: 0 };

    private epe = Infinity;

    private pposValid = false;

    private altitude = 0;

    private horizonDistance = 40;

    private coneOfConfusionDistance = 0;

    /** Current candidate navaids eligbible for selection, sorted by distance from the aircraft (nearer navaids first) */
    private candidateList: VorFacilityWithDistance[] = [];

    /** Current candidates for the lowest priority display VOR */
    private vorCandidateList: VorFacilityWithDistance[] = [];

    /** Blacklist of navaids that were tuned but not received, maps icao to blacklist time */
    private blackList = new Map<string, number>();

    private selectedDisplayVor: RawVor | null = null;

    private selectedDisplayVorReason = VorSelectionReason.None;

    private selectedDmePair: [RawVor, RawVor] | null = null;

    private selectedNdb: RawNdb | null = null;

    private deselectedFacilities = new Set<string>();

    private specifiedVorDeselected = false;

    private specifiedNdbDeselected = false;

    private filteredHeight = null;

    constructor(
        private readonly navigationProvider: NavigationProvider,
        private readonly fpm: FlightPlanManager,
    ) {}

    update(deltaTime: number, forceUpdate = false): void {
        this.updatePpos();
        this.updateAltitude();

        if (this.pposValid) {
            if (this.candidateUpdateThrottler.canUpdate(deltaTime, forceUpdate) > -1) {
                this.updateCandidateList();
            }

            try {
                if (this.dmePairUpdateThrottler.canUpdate(deltaTime, forceUpdate) > -1) {
                    this.selectDmePair();
                }
            } catch (e) {
                console.error('Error in DME pair selection', e);
            }

            try {
                if (this.autotuneUpdateThrottler.canUpdate(deltaTime, forceUpdate) > -1) {
                    this.selectDisplayVor();
                    this.selectDisplayNdb();
                }
            } catch (e) {
                console.error('Error in display VOR selection', e);
            }
        }
        // if ppos not valid we don't change anything
    }

    private updatePpos() {
        const ppos = this.navigationProvider.getPpos();
        if (ppos === null) {
            this.pposValid = false;
            this.selectedDisplayVor = null;
            this.selectedDmePair = null;
        } else {
            this.ppos.lat = ppos.lat;
            this.ppos.long = ppos.long;
            this.pposValid = true;
        }
        this.epe = this.navigationProvider.getEpe();
    }

    private updateAltitude(): void {
        // the MSFS navaids no not give any elevation data for our LoS/cone of confusion checks...
        // so we do a bit of a hack and assume all navaids are at ground level
        const baroAltitude = this.navigationProvider.getBaroCorrectedAltitude() ?? this.navigationProvider.getPressureAltitude();
        if (baroAltitude !== null) {
            // FIXME use baroAltitude when we have elevation data for navaids
            const height = SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND', 'feet');
            if (this.filteredHeight === null) {
                this.filteredHeight = height;
            } else {
                this.filteredHeight = 0.01 * height + 0.99 * this.filteredHeight;
            }
            this.altitude = this.filteredHeight;

            const planeAltNm = this.altitude / 6076.12;
            this.horizonDistance = Math.sqrt(planeAltNm * (2 * EARTH_RADIUS + planeAltNm));

            this.coneOfConfusionDistance = planeAltNm * Math.tan(Math.PI / 6);
        }
    }

    private updateCandidateList(): void {
        this.candidateList.length = 0;
        this.vorCandidateList.length = 0;

        const frequencies = new Set<number>();
        const duplicateFrequencies = new Set<number>();

        for (const facility of this.nearbyFacilities.getVhfNavaids()) {
            if (!this.isSuitableType(facility)) {
                continue;
            }

            const distance = distanceTo(this.ppos, { lat: facility.lat, long: facility.lon });

            if (this.isInLineOfSight(distance)) {
                if (frequencies.has(facility.freqBCD16)) {
                    duplicateFrequencies.add(facility.freqBCD16);
                }
                frequencies.add(facility.freqBCD16);
            }

            const candidate = { distance, ...facility };
            if (this.isEligibleCandidate(facility, distance)) {
                this.candidateList.push(candidate);
            }

            if (this.isEligibleDisplayVor(facility, distance)) {
                this.vorCandidateList.push(candidate);
            }
        }

        for (let i = this.candidateList.length - 1; i >= 0; i--) {
            const facility = this.candidateList[i];
            if (duplicateFrequencies.has(facility.freqBCD16)) {
                this.candidateList.splice(i, 1);
            }
        }

        this.candidateList.sort((a, b) => a.distance - b.distance);
        this.vorCandidateList.sort((a, b) => a.distance - b.distance);
        this.vorCandidateList.length = Math.min(this.vorCandidateList.length, 7);
    }

    private isEligibleCandidate(facility: RawVor, distance: number): boolean {
        return !this.isBlackListed(facility)
            && !this.isDeselected(facility)
            && this.isInLineOfSight(distance)
            && this.isWithinFom(facility, distance)
            && !this.isWithinConeOfConfusion(facility, distance)
            && this.isWithinGroundRange(distance);
    }

    private isEligibleDisplayVor(facility: RawVor, distance: number): boolean {
        return this.isVor(facility)
            && this.isWithinFom(facility, distance)
            && !this.isDeselected(facility);
    }

    /** Checks if a navaid is a VOR type for display VOR tuning */
    private isVor(facility: RawVor): boolean {
        return this.typeIsVor(facility.type);
    }

    private typeIsVor(type: VorType): boolean {
        return type === VorType.VOR
            || type === VorType.VORDME
            || type === VorType.VORTAC;
        // FIXME TACAN when the VOR tuner can handle TACANs..
    }

    /** Checks if a navaid is a co-located VOR/DME type for navigation */
    private isVorDme(facility: RawVor): boolean {
        return facility.type === VorType.VORDME
            || facility.type === VorType.VORTAC;
    }

    /** Checks if a navaid has been blacklisted due to no reception */
    private isBlackListed(facility: RawVor): boolean {
        return this.blackList.has(facility.icao);
    }

    /** Checks if a navaid is delsected by the pilot in the MCDU */
    private isDeselected(facility: RawVor | RawNdb): boolean {
        return this.deselectedFacilities.has(facility.icao);
    }

    /** Checks if the navaid is able to be received over the horizon */
    private isInLineOfSight(distance: number): boolean {
        // FIXME should also consider navaid elevation but we don't have that from MSFS
        return distance <= Math.max(10, 7 / 6 * this.horizonDistance);
    }

    /** Checks if the navaid is within it's figure of merit limits */
    private isWithinFom(facility: RawVor, distance?: number): boolean {
        if (distance === undefined) {
            distance = distanceTo(this.ppos, { lat: facility.lat, long: facility.lon });
        }

        switch (facility.vorClass) {
        // MSFS thinks everything is 130ish
        case VorClass.HighAlttitude: //  return distance <= 250; // FoM 3
        case VorClass.Unknown:
            return distance <= 130; // unclassified, FoM 2
        case VorClass.LowAltitude:
            return distance <= 70 && this.altitude < 18000; // FoM 1
        case VorClass.Terminal:
            return distance <= 40 && this.altitude < 12000; // FoM 0
        default:
            return false;
        }
    }

    /** Checks if the navaid is too close to the aircraft overhead it */
    private isWithinConeOfConfusion(facility: RawVor, distance: number): boolean {
        // FIXME should consider navaid elevation but MSFS doesn't give it to us
        return distance < this.coneOfConfusionDistance;
    }

    /** Checks if the navaid is too close to the aircraft laterally */
    private isWithinGroundRange(distance: number): boolean {
        return distance >= Math.min(9, Math.max(1, this.epe));
    }

    /** Filters out unsuitable types of MSFS navaid */
    private isSuitableType(facility: RawVor): boolean {
        // FIXME we should be able to use ILS/DME but MSFS doesn't allow us to determine if an ILS has a DME
        return facility.vorClass !== VorClass.VOT
            && facility.type !== VorType.TACAN
            && facility.type !== VorType.ILS;
    }

    private selectDmePair(): void {
        let findNewPair = this.selectedDmePair === null;
        let geometryCheck = false;

        if (this.selectedDmePair !== null) {
            // check the angle for the current pair
            const angle = this.calcDmePairAngle(this.selectedDmePair[0], this.selectedDmePair[1]);
            geometryCheck = angle < 70 || angle > 110;

            // check the current pair are still valid candidates
            findNewPair = findNewPair || (!this.candidateList.some((v) => v.icao === this.selectedDmePair[0].icao) || !this.candidateList.some((v) => v.icao === this.selectedDmePair[1].icao));

            // FIXME either of the navaid idents don't match expected
            // FIXME either navaid not received or unstable for 10 seconds
            // we don't have enough NAV radios to actually tune DME pairs and check this
        }

        if (findNewPair || geometryCheck) {
            const pairs = arrayFlat(this.candidateList.map((a, i) => this.candidateList.slice(i + 1).map((b) => [a, b])));

            /** angle diff from 90 for current best selection */
            let bestAngleDiff = Infinity;
            let bestPair = null;

            for (const [a, b] of pairs) {
                const angle = this.calcDmePairAngle(a, b);
                const validPair = angle > 30 && angle < 150;
                if (validPair) {
                    if (this.altitude < 12000) {
                        this.selectedDmePair = [a, b];
                        return;
                    }

                    const angleDiff = Math.abs(diffAngle(90, angle));
                    if (angleDiff < bestAngleDiff) {
                        bestPair = [a, b];
                        bestAngleDiff = angleDiff;
                    }
                }
            }

            if (geometryCheck) {
                // only select a new pair if they're at least 10° close to the ideal 90°
                const currentPairAngleDiff = Math.abs(diffAngle(90, this.calcDmePairAngle(this.selectedDmePair[0], this.selectedDmePair[1])));
                if ((currentPairAngleDiff - bestAngleDiff) >= 10) {
                    this.selectedDmePair = bestPair;
                }
            } else {
                this.selectedDmePair = bestPair;
            }
        }
    }

    private calcDmePairAngle(a: RawVor, b: RawVor): number {
        // FIXME bearingTo really needs an overload that takes lat and lon as args
        const bearingA = bearingTo(this.ppos, { lat: a.lat, long: a.lon });
        const bearingB = bearingTo(this.ppos, { lat: b.lat, long: b.lon });
        return Math.abs(diffAngle(bearingA, bearingB));
    }

    private getSpecifiedNavaid(): RawVor | null {
        if (NavaidSelectionManager.SPECIFIED_VOR_APPROACH_TYPES.includes(this.fpm.getApproachType(FlightPlans.Active))) {
            const waypoints = this.fpm.getApproachWaypoints(FlightPlans.Active);
            // due to cfms 1.5 messing up the last leg of the final approach, we take the second last
            const finalLeg = waypoints[waypoints.length - 2];
            // eslint-disable-next-line no-underscore-dangle
            const facility: RawVor | null = finalLeg?.additionalData.recommendedFacility?.__Type === 'JS_FacilityVOR' ? finalLeg.additionalData.recommendedFacility : null;
            if (facility !== null && this.isVor(facility as RawVor)) {
                return facility;
            }
        }
        return null;
    }

    private selectDisplayVor(): void {
        // manually tuned handled in NavaidTuner

        this.specifiedVorDeselected = false;

        // procedure specified for the approach
        if (this.fpm.isActiveApproach(FlightPlans.Active)) {
            const specified = this.getSpecifiedNavaid();
            if (specified !== null) {
                if (this.isDeselected(specified)) {
                    this.specifiedVorDeselected = true;
                    // fall through and pick another criteria
                } else {
                    this.setDisplayVor(specified, VorSelectionReason.Procedure);
                    return;
                }
            }
        }

        if (this.selectedDmePair === null) {
            // reference navaid (vor/dme or vortac within 5 NM of dest runway, no dme pair available, and ppos < 51 NM from navaid)
            const refNavaid = this.getReferenceNavaid();
            if (refNavaid !== null) {
                this.setDisplayVor(refNavaid, VorSelectionReason.Navigation);
                return;
            }

            // closest co-located vor/dme when no DME pair available
            const colocated = this.getNearestColocatedNavaid();
            if (colocated !== null) {
                this.setDisplayVor(colocated, VorSelectionReason.Navigation);
                return;
            }
        }

        // route navaid (to waypoint or 5 next downpath within FoM limit)
        const activeLegIndex = this.fpm.getActiveWaypointIndex(false, false, FlightPlans.Active);
        if (activeLegIndex >= 0) {
            for (let i = activeLegIndex; i < activeLegIndex + 5; i++) {
                const leg = this.fpm.getWaypoint(i, FlightPlans.Active, true);
                if (!leg) {
                    break;
                }

                // eslint-disable-next-line no-underscore-dangle
                const facility: RawVor | null = leg.additionalData.facility?.__Type === 'JS_FacilityVOR' ? leg.additionalData.facility : null;
                if (facility !== null && this.isVor(facility as RawVor) && this.isWithinFom(facility)) {
                    this.setDisplayVor(facility, VorSelectionReason.Route);
                    return;
                }
            }
        }

        // closest vor/dme within FoM, with a little bit of stickiness to avoid swapping back and forth
        if (this.vorCandidateList.length > 0 && this.displayVor !== null) {
            const currentVor = this.vorCandidateList.find((v) => v.icao === this.displayVor.icao);
            const replaceCurrentVor = !currentVor
                || this.selectedDisplayVorReason !== VorSelectionReason.Display
                || (currentVor.distance - this.vorCandidateList[0].distance) > NavaidSelectionManager.DISPLAY_VOR_STICKINESS_THRESHOLD;

            if (replaceCurrentVor) {
                this.setDisplayVor(this.vorCandidateList[0], VorSelectionReason.Display);
            }
        } else if (this.vorCandidateList.length > 0) {
            this.setDisplayVor(this.vorCandidateList[0], VorSelectionReason.Display);
        } else {
            this.setDisplayVor(null, VorSelectionReason.None);
        }
    }

    private getNearestColocatedNavaid(): RawVor | null {
        for (const candidate of this.candidateList) {
            if (this.isVorDme(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    /**
     * Finds a VOR/DME or VOR/TAC within 5 NM of the destination runway and within 51 NM or the aircraft
     */
    private getReferenceNavaid(): RawVor | null {
        const destRunway = this.fpm.getDestinationRunway(FlightPlans.Active);
        if (!destRunway) {
            return null;
        }
        const candidates = this.candidateList.filter((v) => this.isVorDme(v) && v.distance < 51);
        candidates.sort((a, b) => distanceTo(destRunway.thresholdCoordinates, { lat: a.lat, long: a.lon }) - distanceTo(destRunway.thresholdCoordinates, { lat: b.lat, long: b.lon }));
        if (candidates.length > 0 && distanceTo(destRunway.thresholdCoordinates, { lat: candidates[0].lat, long: candidates[0].lon }) < 5) {
            return candidates[0];
        }
        return null;
    }

    private getSpecifiedNdb(): RawNdb | null {
        if (NavaidSelectionManager.SPECIFIED_NDB_APPROACH_TYPES.includes(this.fpm.getApproachType(FlightPlans.Active))) {
            const waypoints = this.fpm.getApproachWaypoints(FlightPlans.Active);
            // due to cfms 1.5 messing up the last leg of the final approach, we take the second last
            const finalLeg = waypoints[waypoints.length - 2];
            // eslint-disable-next-line no-underscore-dangle
            const facility: RawNdb | null = finalLeg?.additionalData.recommendedFacility?.__Type === 'JS_FacilityNDB' ? finalLeg.additionalData.recommendedFacility : null;
            if (facility !== null) {
                return facility;
            }
        }
        return null;
    }

    private selectDisplayNdb(): void {
        this.specifiedNdbDeselected = false;
        if (this.fpm.isActiveApproach(FlightPlans.Active)) {
            const specified = this.getSpecifiedNdb();
            if (specified !== null) {
                if (this.isDeselected(specified)) {
                    this.specifiedNdbDeselected = true;
                } else {
                    this.setDisplayNdb(specified);
                    return;
                }
            }
        }
        this.setDisplayNdb(null);
    }

    private setDisplayNdb(ndb: RawNdb | null): void {
        this.selectedNdb = ndb;
    }

    private setDisplayVor(vor: RawVor | null, reason: VorSelectionReason): void {
        this.selectedDisplayVor = vor;
        this.selectedDisplayVorReason = reason;
    }

    get displayVor(): RawVor | null {
        return this.selectedDisplayVor;
    }

    get displayVorReason(): VorSelectionReason {
        return this.selectedDisplayVorReason;
    }

    get displayNdb(): RawNdb | null {
        return this.selectedNdb;
    }

    get displayNdbReason(): VorSelectionReason {
        return this.selectedNdb !== null ? VorSelectionReason.Display : VorSelectionReason.None;
    }

    get dmePair(): [RawVor, RawVor] | null {
        return this.selectedDmePair;
    }

    deselectNavaid(icao: string): void {
        this.deselectedFacilities.add(icao);
        this.update(0, true);
    }

    reselectNavaid(icao: string): void {
        this.deselectedFacilities.delete(icao);
        this.update(0, true);
    }

    get deselectedNavaids(): string[] {
        return Array.from(this.deselectedFacilities);
    }

    get isSpecifiedVorDeselected(): boolean {
        return this.specifiedVorDeselected;
    }

    get isSpecifiedNdbDeselected(): boolean {
        return this.specifiedNdbDeselected;
    }

    /** Reset all state e.g. when the nav database is switched */
    resetState(): void {
        this.candidateList.length = 0;
        this.vorCandidateList.length = 0;
        this.blackList.clear();
        this.selectedDisplayVor = null;
        this.selectedDisplayVorReason = VorSelectionReason.None;
        this.selectedDmePair = null;
        this.selectedNdb = null;
        this.deselectedFacilities.clear();
        this.specifiedVorDeselected = false;
        this.specifiedNdbDeselected = false;
    }
}
