// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisSide } from '@flybywiresim/fbw-sdk';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';

export class EfisInterface {
  public version = 0;

  constructor(private side: EfisSide) {}

  private isSecRelatedPageOpen: boolean = false;

  private visibleLegsInPlanMode: Record<FlightPlanIndex, number> = {
    [FlightPlanIndex.Active]: 0,
    [FlightPlanIndex.Temporary]: 0,
    [FlightPlanIndex.FirstSecondary]: 0,
    [FlightPlanIndex.Uplink]: 0,
  };

  private visibleLegsInArcMode: Record<FlightPlanIndex, number> = {
    [FlightPlanIndex.Active]: 0,
    [FlightPlanIndex.Temporary]: 0,
    [FlightPlanIndex.FirstSecondary]: 0,
    [FlightPlanIndex.Uplink]: 0,
  };

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

  setAlternateLegVisible(
    visibleInArcMode: boolean,
    visibleInPlanMode: boolean,
    planIndex = FlightPlanIndex.Active,
  ): void {
    const wasPreviouslyVisibleInArcMode = (this.visibleLegsInArcMode[planIndex] & FlightPlanComponents.Alternate) > 0;
    if (!!visibleInArcMode !== wasPreviouslyVisibleInArcMode) {
      this.visibleLegsInArcMode[planIndex] ^= FlightPlanComponents.Alternate;
      this.version++;
    }

    const wasPreviouslyVisibleInPlanMode = (this.visibleLegsInPlanMode[planIndex] & FlightPlanComponents.Alternate) > 0;
    if (!!visibleInPlanMode !== wasPreviouslyVisibleInPlanMode) {
      this.visibleLegsInPlanMode[planIndex] ^= FlightPlanComponents.Alternate;
      this.version++;
    }
  }

  setMissedLegVisible(visibleInArcMode: boolean, visibleInPlanMode: boolean, planIndex = FlightPlanIndex.Active): void {
    const wasPreviouslyVisibleInArcMode = (this.visibleLegsInArcMode[planIndex] & FlightPlanComponents.Missed) > 0;
    if (!!visibleInArcMode !== wasPreviouslyVisibleInArcMode) {
      this.visibleLegsInArcMode[planIndex] ^= FlightPlanComponents.Missed;
      this.version++;
    }

    const wasPreviouslyVisibleInPlanMode = (this.visibleLegsInPlanMode[planIndex] & FlightPlanComponents.Missed) > 0;
    if (!!visibleInPlanMode !== wasPreviouslyVisibleInPlanMode) {
      this.visibleLegsInPlanMode[planIndex] ^= FlightPlanComponents.Missed;
      this.version++;
    }
  }

  setAlternateMissedLegVisible(
    visibleInArcMode: boolean,
    visibleInPlanMode: boolean,
    planIndex = FlightPlanIndex.Active,
  ): void {
    const wasPreviouslyVisibleInArcMode =
      (this.visibleLegsInArcMode[planIndex] & FlightPlanComponents.AlternateMissed) > 0;
    if (!!visibleInArcMode !== wasPreviouslyVisibleInArcMode) {
      this.visibleLegsInArcMode[planIndex] ^= FlightPlanComponents.AlternateMissed;
      this.version++;
    }

    const wasPreviouslyVisibleInPlanMode =
      (this.visibleLegsInPlanMode[planIndex] & FlightPlanComponents.AlternateMissed) > 0;
    if (!!visibleInPlanMode !== wasPreviouslyVisibleInPlanMode) {
      this.visibleLegsInPlanMode[planIndex] ^= FlightPlanComponents.AlternateMissed;
      this.version++;
    }
  }

  shouldTransmitSecondary(): boolean {
    return this.isSecRelatedPageOpen;
  }

  shouldTransmitAlternate(planIndex: FlightPlanIndex, isArcVsPlanMode: boolean): boolean {
    if (planIndex === FlightPlanIndex.FirstSecondary) {
      return this.isSecRelatedPageOpen;
    }

    return isArcVsPlanMode
      ? (this.visibleLegsInArcMode[planIndex] & FlightPlanComponents.Alternate) > 0
      : (this.visibleLegsInPlanMode[planIndex] & FlightPlanComponents.Alternate) > 0;
  }

  shouldTransmitMissed(planIndex: FlightPlanIndex, isArcVsPlanMode: boolean): boolean {
    if (planIndex === FlightPlanIndex.FirstSecondary) {
      return this.isSecRelatedPageOpen;
    }

    return isArcVsPlanMode
      ? (this.visibleLegsInArcMode[planIndex] & FlightPlanComponents.Missed) > 0
      : (this.visibleLegsInPlanMode[planIndex] & FlightPlanComponents.Missed) > 0;
  }

  shouldTransmitAlternateMissed(planIndex: FlightPlanIndex, isArcVsPlanMode: boolean): boolean {
    if (planIndex === FlightPlanIndex.FirstSecondary) {
      return this.isSecRelatedPageOpen;
    }

    return isArcVsPlanMode
      ? (this.visibleLegsInArcMode[planIndex] & FlightPlanComponents.AlternateMissed) > 0
      : (this.visibleLegsInPlanMode[planIndex] & FlightPlanComponents.AlternateMissed) > 0;
  }
}

enum FlightPlanComponents {
  Missed = 1 << 0,
  Alternate = 1 << 1,
  AlternateMissed = 1 << 2,
}

type PlanCentre = {
  fpIndex: number;
  index: number;
  inAlternate: boolean;
};
