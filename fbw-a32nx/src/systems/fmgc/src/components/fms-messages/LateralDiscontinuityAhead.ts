// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FMMessageTypes } from '@flybywiresim/fbw-sdk';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { GuidanceController } from '../../guidance/GuidanceController';
import { FlightPlanService } from '../../flightplanning/FlightPlanService';
import { Navigation } from '../../navigation/Navigation';

export class LateralDiscontinuityAhead implements FMMessageSelector {
  message = FMMessageTypes.LateralDiscontinuityAhead;

  private guidanceController?: GuidanceController;

  private lastState = false;

  init(_navigation: Navigation, guidanceController: GuidanceController, _flightPlanService: FlightPlanService): void {
    this.guidanceController = guidanceController;
  }

  process(_: number): FMMessageUpdate {
    if (!this.guidanceController.vnavDriver.mcduProfile?.isReadyToDisplay) {
      return FMMessageUpdate.NO_ACTION;
    }

    const newState = this.guidanceController.vnavDriver.shouldShowLatDiscontinuityAhead();

    if (newState !== this.lastState) {
      this.lastState = newState;

      return newState ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
