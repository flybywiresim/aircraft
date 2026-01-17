// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { FlightPlanService } from '../../flightplanning/FlightPlanService';
import { GuidanceController } from '../../guidance/GuidanceController';
import { Navigation } from '../../navigation/Navigation';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { FMMessageTypes } from './FmMessages';

export class ClockIsTakeoffTime implements FMMessageSelector {
  message = FMMessageTypes.ClockIsTakeoffTime;
  private flightplanService: FlightPlanService;
  shouldTrigger = false;
  init?(_navigation: Navigation, _guidanceController: GuidanceController, flightPlanService: FlightPlanService): void {
    this.flightplanService = flightPlanService;
  }
  process(_deltaTime: number): FMMessageUpdate {
    const isEttExpired = this.flightplanService.active.performanceData.ettExpired.get();
    if (isEttExpired && !this.shouldTrigger) {
      this.shouldTrigger = true;
      return FMMessageUpdate.SEND;
    } else if (!isEttExpired && this.shouldTrigger) {
      this.shouldTrigger = false;
      return FMMessageUpdate.RECALL;
    }
    return FMMessageUpdate.NO_ACTION;
  }
}
