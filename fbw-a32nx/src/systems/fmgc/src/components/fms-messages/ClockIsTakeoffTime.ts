// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { FlightPlanService } from '../../flightplanning/FlightPlanService';
import { GuidanceController } from '../../guidance/GuidanceController';
import { Navigation } from '../../navigation/Navigation';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';
import { FMMessageTypes } from './FmMessages';

export class ClockIsTakeoffTime implements FMMessageSelector {
  message = FMMessageTypes.ClockIsTakeoffTime;
  private flightplanService?: FlightPlanService;
  private isActive = false;
  init?(_navigation: Navigation, _guidanceController: GuidanceController, flightPlanService: FlightPlanService): void {
    this.flightplanService = flightPlanService;
  }
  process(_deltaTime: number): FMMessageUpdate {
    const isEttExpired = this.flightplanService?.active.performanceData.estimatedTakeoffTimeExpired.get();
    if (isEttExpired && !this.isActive) {
      this.isActive = true;
      return FMMessageUpdate.SEND;
    } else if (!isEttExpired && this.isActive) {
      this.isActive = false;
      return FMMessageUpdate.RECALL;
    }
    return FMMessageUpdate.NO_ACTION;
  }
}
