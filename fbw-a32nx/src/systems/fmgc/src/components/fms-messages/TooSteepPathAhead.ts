// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceController } from '@fmgc/guidance/GuidanceController';

import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { FlightPlanService } from '../../flightplanning/FlightPlanService';
import { Navigation } from '../../navigation/Navigation';
import { FMMessageTypes } from './FmMessages';

export class TooSteepPathAhead implements FMMessageSelector {
  message = FMMessageTypes.TooSteepPathAhead;

  private guidanceController: GuidanceController;

  private lastState = false;

  init(_navigation: Navigation, guidanceController: GuidanceController, _flightPlanService: FlightPlanService): void {
    this.guidanceController = guidanceController;
  }

  process(_: number): FMMessageUpdate {
    const newState = this.guidanceController.vnavDriver.shouldShowTooSteepPathAhead();

    if (newState !== this.lastState) {
      this.lastState = newState;

      return newState ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
    }

    return FMMessageUpdate.NO_ACTION;
  }
}
