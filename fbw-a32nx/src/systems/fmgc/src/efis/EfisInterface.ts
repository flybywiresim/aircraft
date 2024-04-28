// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisSide } from '@flybywiresim/fbw-sdk';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';

type PlanCentre = {
  fpIndex: number;
  index: number;
  inAlternate: boolean;
};

export class EfisInterface {
  public version = 0;

  static readonly NUM_LEGS_ON_FPLN_PAGE = 5;

  constructor(
    private side: EfisSide,
    private flightPlanService: FlightPlanService,
  ) {}

  private isSecRelatedPageOpen: boolean = false;

  readonly planCentre: PlanCentre = {
    fpIndex: 0,
    index: 0,
    inAlternate: false,
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

  shouldTransmitSecondary(): boolean {
    return this.isSecRelatedPageOpen;
  }

  shouldTransmitMissed(planIndex: FlightPlanIndex, isArcVsPlanMode: boolean): boolean {
    if (planIndex === FlightPlanIndex.FirstSecondary) {
      return this.isSecRelatedPageOpen;
    }

    const plan = this.flightPlanService.get(planIndex);
    if (!plan) {
      return false;
    }

    if (isArcVsPlanMode) {
      const legIn1stLineIndex = plan.activeLegIndex - 1;
      const legInLastLineIndex = legIn1stLineIndex + EfisInterface.NUM_LEGS_ON_FPLN_PAGE - 1;

      const firstMissedLegIndex = plan.firstMissedApproachLegIndex;
      const lastMissedLegIndex = plan.legCount - 1;

      // Check that first line is before end of alternate plan and last line is after start of alternate plan
      return legIn1stLineIndex <= lastMissedLegIndex && legInLastLineIndex >= firstMissedLegIndex;
    }

    return (
      planIndex === this.planCentre.fpIndex &&
      this.planCentre.index <= plan.legCount &&
      this.planCentre.index >= plan.firstMissedApproachLegIndex
    );
  }

  shouldTransmitAlternate(planIndex: FlightPlanIndex, isArcVsPlanMode: boolean): boolean {
    if (planIndex === FlightPlanIndex.FirstSecondary) {
      return this.isSecRelatedPageOpen;
    }

    const plan = this.flightPlanService.get(planIndex);
    if (!plan || !plan.alternateFlightPlan) {
      return false;
    }

    if (isArcVsPlanMode) {
      const legIn1stLineIndex = plan.activeLegIndex - 1;
      const legInLastLineIndex = legIn1stLineIndex + EfisInterface.NUM_LEGS_ON_FPLN_PAGE - 1;

      const firstAlternateLegIndex = plan.legCount + 1;
      const lastAlternateLegIndex = plan.legCount + plan.alternateFlightPlan.legCount;

      // Check that first line is before end of alternate plan and last line is after start of alternate plan
      return legIn1stLineIndex <= lastAlternateLegIndex && legInLastLineIndex >= firstAlternateLegIndex;
    }

    return planIndex === this.planCentre.fpIndex && this.planCentre.inAlternate;
  }

  shouldTransmitAlternateMissed(planIndex: FlightPlanIndex, isArcVsPlanMode: boolean): boolean {
    if (planIndex === FlightPlanIndex.FirstSecondary) {
      return this.isSecRelatedPageOpen;
    }

    const plan = this.flightPlanService.get(planIndex);
    if (!plan || !plan.alternateFlightPlan) {
      return false;
    }

    if (isArcVsPlanMode) {
      const legIn1stLineIndex = plan.activeLegIndex - 1;
      const legInLastLineIndex = legIn1stLineIndex + EfisInterface.NUM_LEGS_ON_FPLN_PAGE - 1;

      const firstAlternateMissedLegIndex = plan.legCount + 1 + plan.alternateFlightPlan.firstMissedApproachLegIndex;
      const lastAlternateLegIndex = plan.legCount + plan.alternateFlightPlan.legCount;

      // Check that first line is before end of alternate missed plan and last line is after start of alternate missed plan
      return legIn1stLineIndex <= lastAlternateLegIndex && legInLastLineIndex >= firstAlternateMissedLegIndex;
    }

    return (
      planIndex === this.planCentre.fpIndex &&
      this.planCentre.inAlternate &&
      this.planCentre.index >= plan.alternateFlightPlan.firstMissedApproachLegIndex
    );
  }
}
