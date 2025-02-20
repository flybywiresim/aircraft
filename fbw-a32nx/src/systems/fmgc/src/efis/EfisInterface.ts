// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisSide } from '@flybywiresim/fbw-sdk';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';

type PlanCentre = {
  fpIndex: number;
  index: number;
  inAlternate: boolean;
};

type ShownFplnLegs = {
  isMissedApproach: boolean;
  isAlternate: boolean;
  isAlternateMissedApproach: boolean;
};

export class EfisInterface {
  public version = 0;

  static readonly A32NX_NUM_LEGS_ON_FPLN_PAGE = 5;

  constructor(
    private side: EfisSide,
    private flightPlanService: FlightPlanService,
    private numLegOnFplnPage = EfisInterface.A32NX_NUM_LEGS_ON_FPLN_PAGE,
  ) {}

  private isSecRelatedPageOpen: boolean = false;

  readonly planCentre: PlanCentre = {
    fpIndex: 0,
    index: 0,
    inAlternate: false,
  };

  readonly shownFplnLegs: ShownFplnLegs = {
    isMissedApproach: false,
    isAlternate: false,
    isAlternateMissedApproach: false,
  };

  setPlanCentre(fpIndex: number, index: number, inAlternate: boolean): void {
    if (
      this.planCentre.index === index &&
      this.planCentre.fpIndex === fpIndex &&
      this.planCentre.inAlternate === inAlternate
    ) {
      return;
    }

    this.planCentre.fpIndex = fpIndex;
    this.planCentre.index = index;
    this.planCentre.inAlternate = inAlternate;

    this.version++;
  }

  setSecRelatedPageOpen(open: boolean): void {
    if (this.isSecRelatedPageOpen !== open) {
      this.isSecRelatedPageOpen = open;
      this.version++;
    }
  }

  setShownFplnLegs(isMissedApproach: boolean, isAlternate: boolean, isAlternateMissedApproach: boolean): void {
    this.shownFplnLegs.isMissedApproach = isMissedApproach;
    this.shownFplnLegs.isAlternate = isAlternate;
    this.shownFplnLegs.isAlternateMissedApproach = isAlternateMissedApproach;

    // Don't increment version here, the real one takes a bit of time to update as well
  }

  shouldTransmitSecondary(): boolean {
    return this.isSecRelatedPageOpen;
  }

  shouldTransmitMissed(planIndex: FlightPlanIndex, isPlanMode: boolean): boolean {
    const plan = this.flightPlanService.get(planIndex);
    if (!plan) {
      return false;
    }

    if (!isPlanMode) {
      const legIn1stLineIndex = plan.activeLegIndex - 1;
      const legInLastLineIndex = legIn1stLineIndex + this.numLegOnFplnPage - 1;

      const firstMissedLegIndex = plan.firstMissedApproachLegIndex;
      const lastMissedLegIndex = plan.legCount - 1;

      // Check that first line is before end of alternate plan and last line is after start of alternate plan
      const fplnPageWouldShowMissed =
        legIn1stLineIndex <= lastMissedLegIndex && legInLastLineIndex >= firstMissedLegIndex;

      return this.shownFplnLegs.isMissedApproach || fplnPageWouldShowMissed;
    }

    return (
      planIndex === this.planCentre.fpIndex &&
      this.planCentre.index <= plan.legCount &&
      this.planCentre.index >= plan.firstMissedApproachLegIndex
    );
  }

  shouldTransmitAlternate(planIndex: FlightPlanIndex, isPlanMode: boolean): boolean {
    const plan = this.flightPlanService.get(planIndex);
    if (!plan || !plan.alternateFlightPlan) {
      return false;
    }

    if (!isPlanMode) {
      const legIn1stLineIndex = plan.activeLegIndex - 1;
      const legInLastLineIndex = legIn1stLineIndex + this.numLegOnFplnPage - 1;

      const firstAlternateLegIndex = plan.legCount + 1;
      const lastAlternateLegIndex = plan.legCount + plan.alternateFlightPlan.legCount;

      // Check that first line is before end of alternate plan and last line is after start of alternate plan
      const fplnPageWouldShowAlternate =
        legIn1stLineIndex <= lastAlternateLegIndex && legInLastLineIndex >= firstAlternateLegIndex;

      return this.shownFplnLegs.isAlternate || fplnPageWouldShowAlternate;
    }

    return planIndex === this.planCentre.fpIndex && this.planCentre.inAlternate;
  }

  shouldTransmitAlternateMissed(planIndex: FlightPlanIndex, isPlanMode: boolean): boolean {
    const plan = this.flightPlanService.get(planIndex);
    if (!plan || !plan.alternateFlightPlan) {
      return false;
    }

    if (!isPlanMode) {
      const legIn1stLineIndex = plan.activeLegIndex - 1;
      const legInLastLineIndex = legIn1stLineIndex + this.numLegOnFplnPage - 1;

      const firstAlternateMissedLegIndex = plan.legCount + 1 + plan.alternateFlightPlan.firstMissedApproachLegIndex;
      const lastAlternateLegIndex = plan.legCount + plan.alternateFlightPlan.legCount;

      // Check that first line is before end of alternate missed plan and last line is after start of alternate missed plan
      const fplnPageWouldShowAlternateMissed =
        legIn1stLineIndex <= lastAlternateLegIndex && legInLastLineIndex >= firstAlternateMissedLegIndex;

      return this.shownFplnLegs.isAlternateMissedApproach || fplnPageWouldShowAlternateMissed;
    }

    return (
      planIndex === this.planCentre.fpIndex &&
      this.planCentre.inAlternate &&
      this.planCentre.index >= plan.alternateFlightPlan.firstMissedApproachLegIndex
    );
  }

  setNumLegsOnFplnPage(numLegs: number) {
    this.numLegOnFplnPage = numLegs;
  }
}
