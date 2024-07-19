// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  arrayFlat,
  UpdateThrottler,
  ApproachType,
  NavaidSubsectionCode,
  NdbNavaid,
  VhfNavaid,
  VhfNavaidType,
} from '@flybywiresim/fbw-sdk';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { NavigationProvider } from '@fmgc/navigation/NavigationProvider';
import { NearbyFacilities } from '@fmgc/navigation/NearbyFacilities';
import { bearingTo, diffAngle, distanceTo, EARTH_RADIUS } from 'msfs-geo';

type VorFacilityWithDistance = VhfNavaid & { distance: number };

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

  private static readonly SPECIFIED_VOR_APPROACH_TYPES = [
    ApproachType.Rnav,
    ApproachType.Vor,
    ApproachType.VorDme,
    ApproachType.Vortac,
  ];

  private static readonly SPECIFIED_NDB_APPROACH_TYPES = [ApproachType.Ndb, ApproachType.NdbDme];

  private readonly nearbyFacilities: NearbyFacilities = NearbyFacilities.getInstance();

  private readonly candidateUpdateThrottler = new UpdateThrottler(180);

  private readonly dmePairUpdateThrottler = new UpdateThrottler(10);

  private readonly autotuneUpdateThrottler = new UpdateThrottler(1);

  private ppos = { lat: 0, long: 0 };

  private epe = Infinity;

  private pposValid = false;

  private altitude = 0;

  private heightAboveGround = 0;

  /** Current candidate navaids eligbible for selection, sorted by distance from the aircraft (nearer navaids first) */
  private candidateList: VorFacilityWithDistance[] = [];

  /** Current candidates for the lowest priority display VOR */
  private vorCandidateList: VorFacilityWithDistance[] = [];

  /** Blacklist of navaids that were tuned but not received, maps icao to blacklist time */
  private blackList = new Map<string, number>();

  private selectedDisplayVor: VhfNavaid | null = null;

  private selectedDisplayVorReason = VorSelectionReason.None;

  private selectedDmePair: [VhfNavaid, VhfNavaid] | null = null;

  private selectedNdb: NdbNavaid | null = null;

  private deselectedFacilities = new Set<string>();

  private specifiedVorDeselected = false;

  private specifiedNdbDeselected = false;

  private filteredHeight = null;

  constructor(
    private readonly flightPlanService: FlightPlanService,
    private readonly navigationProvider: NavigationProvider,
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
    const baroAltitude =
      this.navigationProvider.getBaroCorrectedAltitude() ?? this.navigationProvider.getPressureAltitude();
    if (baroAltitude !== null) {
      this.altitude = baroAltitude;
    }

    // we need this as a fallback for MSFS-sourced facilities with missing elevation data
    this.heightAboveGround = SimVar.GetSimVarValue('PLANE ALT ABOVE GROUND', 'feet');
    if (this.filteredHeight === null) {
      this.filteredHeight = this.heightAboveGround;
    } else {
      this.filteredHeight = 0.01 * this.heightAboveGround + 0.99 * this.filteredHeight;
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

      const distance = distanceTo(this.ppos, facility.dmeLocation ?? facility.location);

      if (this.isInLineOfSight(facility, distance)) {
        // FIXME BCD frequency type in msfs-navdata... comparing floats is problematic
        if (frequencies.has(facility.frequency)) {
          duplicateFrequencies.add(facility.frequency);
        }
        frequencies.add(facility.frequency);
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
      if (duplicateFrequencies.has(facility.frequency)) {
        this.candidateList.splice(i, 1);
      }
    }

    this.candidateList.sort((a, b) => a.distance - b.distance);
    this.vorCandidateList.sort((a, b) => a.distance - b.distance);
    this.vorCandidateList.length = Math.min(this.vorCandidateList.length, 7);
  }

  private isEligibleCandidate(facility: VhfNavaid, distance: number): boolean {
    return (
      !this.isBlackListed(facility) &&
      !this.isDeselected(facility) &&
      this.isInLineOfSight(facility, distance) &&
      this.isWithinFom(facility, distance) &&
      !this.isWithinConeOfConfusion(facility, distance) &&
      this.isWithinGroundRange(distance)
    );
  }

  private isEligibleDisplayVor(facility: VhfNavaid, distance: number): boolean {
    return this.isVor(facility) && this.isWithinFom(facility, distance) && !this.isDeselected(facility);
  }

  /** Checks if a navaid is a VOR type for display VOR tuning */
  private isVor(facility: VhfNavaid): boolean {
    return this.typeIsVor(facility.type);
  }

  private typeIsVor(type: VhfNavaidType): boolean {
    return type === VhfNavaidType.Vor || type === VhfNavaidType.VorDme || type === VhfNavaidType.Vortac;
  }

  /** Checks if a navaid is a co-located VOR/DME type for navigation */
  private isVorDme(facility: VhfNavaid): boolean {
    return facility.type === VhfNavaidType.VorDme || facility.type === VhfNavaidType.Vortac;
  }

  /** Checks if a navaid has been blacklisted due to no reception */
  private isBlackListed(facility: VhfNavaid): boolean {
    return this.blackList.has(facility.databaseId);
  }

  /** Checks if a navaid is delsected by the pilot in the MCDU */
  private isDeselected(facility: VhfNavaid | NdbNavaid): boolean {
    return this.deselectedFacilities.has(facility.databaseId);
  }

  /** Checks if the navaid is able to be received over the horizon */
  private isInLineOfSight(facility: VhfNavaid, distance: number): boolean {
    let heightAboveNavaid: number;
    if (facility.dmeLocation.alt !== undefined) {
      heightAboveNavaid = Math.max(0, this.altitude - facility.dmeLocation.alt) / 6076.12;
    } else {
      // fallback for MSFS navdata with missing navaid elevations
      heightAboveNavaid = this.filteredHeight;
    }

    const heightAboveNavaidNm = heightAboveNavaid / 6076.12;
    const lineOfSightDist = Math.sqrt(heightAboveNavaidNm * (2 * EARTH_RADIUS + heightAboveNavaidNm));
    return distance <= Math.max(10, (7 / 6) * lineOfSightDist);
  }

  /** Checks if the navaid is within it's figure of merit limits */
  private isWithinFom(facility: VhfNavaid, distance?: number): boolean {
    if (distance === undefined) {
      distance = distanceTo(this.ppos, facility.dmeLocation ?? facility.location);
    }

    switch (facility.figureOfMerit) {
      case 3:
        return distance <= 250;
      case 2:
        return distance <= 130;
      case 1:
        return distance <= 70 && this.altitude < 18000;
      case 0:
        return distance <= 40 && this.altitude < 12000;
      default:
        return false;
    }
  }

  /** Checks if the navaid is too close to the aircraft overhead it */
  private isWithinConeOfConfusion(facility: VhfNavaid, distance: number): boolean {
    let coneHeight: number;
    if (facility.dmeLocation.alt !== undefined) {
      coneHeight = Math.max(0, this.altitude - facility.dmeLocation.alt) / 6076.12;
    } else {
      // fallback for MSFS navdata with missing navaid elevations
      coneHeight = this.altitude - this.heightAboveGround;
    }
    const coneOfConfusionDistance = (coneHeight / 6076.12) * Math.tan(Math.PI / 6);
    return distance < coneOfConfusionDistance;
  }

  /** Checks if the navaid is too close to the aircraft laterally */
  private isWithinGroundRange(distance: number): boolean {
    return distance >= Math.min(9, Math.max(1, this.epe));
  }

  /** Filters out unsuitable types of MSFS navaid */
  private isSuitableType(facility: VhfNavaid): boolean {
    switch (facility.type) {
      case VhfNavaidType.Dme:
      case VhfNavaidType.IlsDme:
      case VhfNavaidType.IlsTacan:
      case VhfNavaidType.VorDme:
      case VhfNavaidType.Vortac:
        return true;
      default:
        return false;
    }
  }

  private selectDmePair(): void {
    let findNewPair = this.selectedDmePair === null;
    let geometryCheck = false;

    if (this.selectedDmePair !== null) {
      // check the angle for the current pair
      const angle = this.calcDmePairAngle(this.selectedDmePair[0], this.selectedDmePair[1]);
      geometryCheck = angle < 70 || angle > 110;

      // check the current pair are still valid candidates
      findNewPair =
        findNewPair ||
        !this.candidateList.some((v) => v.databaseId === this.selectedDmePair[0].databaseId) ||
        !this.candidateList.some((v) => v.databaseId === this.selectedDmePair[1].databaseId);

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
        const currentPairAngleDiff = Math.abs(
          diffAngle(90, this.calcDmePairAngle(this.selectedDmePair[0], this.selectedDmePair[1])),
        );
        if (currentPairAngleDiff - bestAngleDiff >= 10) {
          this.selectedDmePair = bestPair;
        }
      } else {
        this.selectedDmePair = bestPair;
      }
    }
  }

  private calcDmePairAngle(a: VhfNavaid, b: VhfNavaid): number {
    // FIXME bearingTo really needs an overload that takes lat and lon as args
    const bearingA = bearingTo(this.ppos, a.dmeLocation);
    const bearingB = bearingTo(this.ppos, b.dmeLocation);
    return Math.abs(diffAngle(bearingA, bearingB));
  }

  private getSpecifiedNavaid(): VhfNavaid | null {
    if (NavaidSelectionManager.SPECIFIED_VOR_APPROACH_TYPES.includes(this.flightPlanService.active.approach.type)) {
      const segment = this.flightPlanService.active.approachSegment;

      // eslint-disable-next-line no-underscore-dangle
      const facility = segment.lastLeg?.definition.recommendedNavaid ?? null;
      if (facility !== null && facility.subSectionCode === NavaidSubsectionCode.VhfNavaid && this.isVor(facility)) {
        return facility;
      }
    }
    return null;
  }

  private selectDisplayVor(): void {
    // manually tuned handled in NavaidTuner

    this.specifiedVorDeselected = false;

    // procedure specified for the approach
    if (this.flightPlanService.active.isApproachActive) {
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
    const activeLegIndex = this.flightPlanService.activeLegIndex;
    if (activeLegIndex >= 0) {
      for (let i = activeLegIndex; i < activeLegIndex + 5; i++) {
        const element = this.flightPlanService.active.allLegs[i];
        if (!element) {
          break;
        }

        if (element.isDiscontinuity) {
          break;
        }

        const leg = element as FlightPlanLeg;

        // eslint-disable-next-line no-underscore-dangle
        const facility = leg.definition.waypoint ?? null;
        if (
          facility !== null &&
          facility.subSectionCode === NavaidSubsectionCode.VhfNavaid &&
          this.isVor(facility) &&
          this.isWithinFom(facility)
        ) {
          this.setDisplayVor(facility, VorSelectionReason.Route);
          return;
        }
      }
    }

    // closest vor/dme within FoM, with a little bit of stickiness to avoid swapping back and forth
    if (this.vorCandidateList.length > 0 && this.displayVor !== null) {
      const currentVor = this.vorCandidateList.find((v) => v.databaseId === this.displayVor.databaseId);
      const replaceCurrentVor =
        !currentVor ||
        this.selectedDisplayVorReason !== VorSelectionReason.Display ||
        currentVor.distance - this.vorCandidateList[0].distance >
          NavaidSelectionManager.DISPLAY_VOR_STICKINESS_THRESHOLD;

      if (replaceCurrentVor) {
        this.setDisplayVor(this.vorCandidateList[0], VorSelectionReason.Display);
      }
    } else if (this.vorCandidateList.length > 0) {
      this.setDisplayVor(this.vorCandidateList[0], VorSelectionReason.Display);
    } else {
      this.setDisplayVor(null, VorSelectionReason.None);
    }
  }

  private getNearestColocatedNavaid(): VhfNavaid | null {
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
  private getReferenceNavaid(): VhfNavaid | null {
    const destRunway = this.flightPlanService.active.destinationRunway;
    if (!destRunway) {
      return null;
    }
    const candidates = this.candidateList.filter((v) => this.isVorDme(v) && v.distance < 51);
    candidates.sort(
      (a, b) =>
        distanceTo(destRunway.thresholdLocation, a.dmeLocation) -
        distanceTo(destRunway.thresholdLocation, b.dmeLocation),
    );
    if (candidates.length > 0 && distanceTo(destRunway.thresholdLocation, candidates[0].dmeLocation) < 5) {
      return candidates[0];
    }
    return null;
  }

  private getSpecifiedNdb(): NdbNavaid | null {
    if (NavaidSelectionManager.SPECIFIED_NDB_APPROACH_TYPES.includes(this.flightPlanService.active.approach.type)) {
      const segment = this.flightPlanService.active.approachSegment;

      // eslint-disable-next-line no-underscore-dangle
      const facility = segment.lastLeg?.definition.recommendedNavaid ?? null;
      if (facility !== null && facility.subSectionCode === NavaidSubsectionCode.NdbNavaid) {
        return facility;
      }
    }
    return null;
  }

  private selectDisplayNdb(): void {
    this.specifiedNdbDeselected = false;
    if (this.flightPlanService.active.isApproachActive) {
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

  private setDisplayNdb(ndb: NdbNavaid | null): void {
    this.selectedNdb = ndb;
  }

  private setDisplayVor(vor: VhfNavaid | null, reason: VorSelectionReason): void {
    this.selectedDisplayVor = vor;
    this.selectedDisplayVorReason = reason;
  }

  get displayVor(): VhfNavaid | null {
    return this.selectedDisplayVor;
  }

  get displayVorReason(): VorSelectionReason {
    return this.selectedDisplayVorReason;
  }

  get displayNdb(): NdbNavaid | null {
    return this.selectedNdb;
  }

  get displayNdbReason(): VorSelectionReason {
    return this.selectedNdb !== null ? VorSelectionReason.Display : VorSelectionReason.None;
  }

  get dmePair(): [VhfNavaid, VhfNavaid] | null {
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
