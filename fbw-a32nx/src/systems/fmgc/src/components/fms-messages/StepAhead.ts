// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { Navigation } from '@fmgc/navigation/Navigation';
import { FMMessageTypes } from './FmMessages';

export class StepAhead implements FMMessageSelector {
  message = FMMessageTypes.StepAhead;

  private guidanceController?: GuidanceController;

  private flightPlanService?: FlightPlanService;

  private lastState = false;

  init(_navigation: Navigation, guidanceController: GuidanceController, flightPlanService: FlightPlanService): void {
    this.guidanceController = guidanceController;
    this.flightPlanService = flightPlanService;
  }

  process(_: number): FMMessageUpdate {
    const distanceToEnd = this.guidanceController.alongTrackDistanceToDestination;

    if (!this.guidanceController.vnavDriver.mcduProfile?.isReadyToDisplay || distanceToEnd <= 0) {
      return FMMessageUpdate.NO_ACTION;
    }

    const activePlan = this.flightPlanService.active;

    let newState = false;
    for (let i = activePlan.activeLegIndex; i < activePlan.legCount; i++) {
      const leg = activePlan.maybeElementAt(i);

      if (!leg || leg.isDiscontinuity === true || !leg.calculated || !leg.cruiseStep || leg.cruiseStep.isIgnored) {
        continue;
      }

      const legDistanceToEnd = leg.calculated.cumulativeDistanceToEndWithTransitions;

      if (distanceToEnd - legDistanceToEnd < 20) {
        newState = true;
      }
    }

    if (newState !== this.lastState) {
      this.lastState = newState;

      return newState ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
