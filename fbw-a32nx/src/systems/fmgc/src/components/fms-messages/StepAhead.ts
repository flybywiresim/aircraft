// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { FMMessageTypes } from '@shared/FmMessages';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';

export class StepAhead implements FMMessageSelector {
    message = FMMessageTypes.StepAhead;

    private guidanceController: GuidanceController;

    private flightPlanService: FlightPlanService;

    private lastState = false;

    init(baseInstrument: BaseInstrument, flightPlanService: FlightPlanService): void {
        this.guidanceController = baseInstrument.guidanceController;
        this.flightPlanService = flightPlanService;
    }

    process(_: number): FMMessageUpdate {
        const distanceToEnd = this.guidanceController.vnavDriver.distanceToEnd;

        if (!this.guidanceController.vnavDriver.mcduProfile?.isReadyToDisplay || distanceToEnd <= 0) {
            return FMMessageUpdate.NO_ACTION;
        }

        const activePlan = this.flightPlanService.active;

        let newState = false;
        for (let i = activePlan.activeLegIndex; i < activePlan.legCount; i++) {
            const leg = activePlan.maybeElementAt(i);

            if (!leg || leg.isDiscontinuity === true || !leg.cruiseStep || leg.cruiseStep.isIgnored) {
                continue;
            }

            const legDistanceToEnd = this.guidanceController.vnavDriver.constraintReader.legDistancesToEnd[i];

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
